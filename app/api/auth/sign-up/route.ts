import { routes } from "@/config/site";
import { sendVerificationEmail } from "@/lib/server/auth-mail";
import { logAuthEvent } from "@/lib/server/audit";
import { mutate, newId, type StoredUser } from "@/lib/server/db";
import { asString, jsonError, jsonOk, readJson } from "@/lib/server/http";
import { sameOriginGate } from "@/lib/server/origin";
import { hashPassword } from "@/lib/server/password";
import { clientIp, consumeQuota, RULES, waitMessage } from "@/lib/server/rate-limit";
import { createSession, toSessionUser } from "@/lib/server/session";
import {
  MIN_PASSWORD_LENGTH,
  validateEmail,
  validatePassword,
  validateRequired,
} from "@/lib/validation";

/**
 * POST /api/auth/sign-up — creates an account, signs the new user in, and
 * emails them a link to confirm their address.
 *
 * Sign-up is open to anyone. The order of operations is the conventional one:
 *
 *  - throttle by IP first, so the endpoint cannot be used to mint accounts or
 *    to pump mail at strangers;
 *  - validate everything server-side, whatever the client already checked;
 *  - create the account with the address *unconfirmed*, then sign the person
 *    in anyway. Blocking the product until they fetch their email is the
 *    older, worse pattern; nagging with a banner is the current one, and it
 *    is what the `emailVerified` flag drives.
 */
export async function POST(request: Request) {
  const blocked = sameOriginGate(request);
  if (blocked) return blocked;

  const body = await readJson(request);
  if (!body) return jsonError("bad_request", "Expected a JSON body.", 400);

  const quota = await consumeQuota(`signup:ip:${clientIp(request)}`, RULES.signUpIp);
  if (!quota.ok) {
    return jsonError(
      "validation_error",
      `Too many accounts created from here. ${waitMessage(quota.retryAfterSeconds)}`,
      429,
    );
  }

  const fullName = asString(body.fullName).trim();
  const email = asString(body.email).trim().toLowerCase();
  const workspace = asString(body.workspace).trim();
  const password = asString(body.password);
  const confirmPassword = asString(body.confirmPassword);
  const acceptedTerms = body.acceptedTerms === true;
  const remember = body.remember === true;

  // The client validates too; the server never trusts that it did.
  const problem =
    validateRequired(fullName, "full name") ??
    validateEmail(email) ??
    validateRequired(workspace, "company or workspace name") ??
    validatePassword(password, { checkStrength: true, email, name: fullName }) ??
    // Only enforced when the client sent one, so an API caller is not obliged
    // to repeat itself.
    (confirmPassword && confirmPassword !== password ? "Those passwords do not match." : undefined) ??
    (acceptedTerms ? undefined : "Please accept the terms to continue.");
  if (problem) return jsonError("validation_error", problem, 400);

  const passwordHash = await hashPassword(password);

  const created = await mutate((db) => {
    if (db.users.some((user) => user.email === email)) return null;
    const user: StoredUser = {
      id: newId(),
      fullName,
      email,
      workspace,
      passwordHash,
      emailVerifiedAt: null,
      passwordChangedAt: new Date().toISOString(),
      status: "active",
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    return user;
  });

  if (!created) {
    return jsonError("email_taken", "An account already exists for that email. Try signing in instead.", 409);
  }

  await createSession(created.id, { request, remember });
  await logAuthEvent("signed_up", { userId: created.id, email, request });

  // A mail failure must not fail the sign-up: the account exists, and the
  // address can be confirmed later from the banner.
  const mail = await sendVerificationEmail(request, created);

  return jsonOk(
    {
      user: toSessionUser(created),
      redirectTo: routes.verifyEmail,
      emailSent: mail.delivered,
      minPasswordLength: MIN_PASSWORD_LENGTH,
    },
    201,
  );
}

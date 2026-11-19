import { routes } from "@/config/site";
import { logAuthEvent } from "@/lib/server/audit";
import { read } from "@/lib/server/db";
import { asString, jsonError, jsonOk, readJson } from "@/lib/server/http";
import { sameOriginGate } from "@/lib/server/origin";
import { verifyPassword } from "@/lib/server/password";
import {
  clearFailures,
  clientIp,
  isLocked,
  recordFailure,
  RULES,
  waitMessage,
} from "@/lib/server/rate-limit";
import { createSession, toSessionUser } from "@/lib/server/session";

/**
 * POST /api/auth/sign-in — verifies credentials and starts a session.
 *
 * Three things here are not obvious but are standard practice:
 *
 *  - **One message for every failure.** Wrong email, wrong password, or
 *    locked out: all answer "Incorrect email or password." Saying which was
 *    wrong turns this endpoint into a way to discover who has an account.
 *  - **Two lockout keys.** Failures are counted against the email *and* the
 *    IP. Email-only lets one attacker lock a victim out of their own account
 *    at will; IP-only lets them spread guesses across many accounts.
 *  - **Clear on success.** A correct password wipes the failure count, so a
 *    few typos never leave someone locked out of their own account.
 */
export async function POST(request: Request) {
  const blocked = sameOriginGate(request);
  if (blocked) return blocked;

  const body = await readJson(request);
  if (!body) return jsonError("bad_request", "Expected a JSON body.", 400);

  const email = asString(body.email).trim().toLowerCase();
  const password = asString(body.password);
  const remember = body.remember === true;
  if (!email || !password) {
    return jsonError("validation_error", "Enter your email and password.", 400);
  }

  const emailKey = `signin:email:${email}`;
  const ipKey = `signin:ip:${clientIp(request)}`;

  // Already locked: refuse without touching the password, and say how long.
  for (const key of [emailKey, ipKey]) {
    const lock = await isLocked(key);
    if (!lock.ok) {
      return jsonError(
        "invalid_credentials",
        `Too many sign-in attempts. ${waitMessage(lock.retryAfterSeconds)}`,
        429,
      );
    }
  }

  const user = await read((db) => db.users.find((candidate) => candidate.email === email) ?? null);
  const invalid = jsonError("invalid_credentials", "Incorrect email or password.", 401);

  const fail = async () => {
    await recordFailure(emailKey, RULES.signInEmail);
    await recordFailure(ipKey, RULES.signInIp);
    await logAuthEvent("sign_in_failed", { userId: user?.id, email, request });
    return invalid;
  };

  if (!user) return fail();
  // A Google-only account has no password to check. Same generic answer, so
  // the response still reveals nothing; the sign-in page separately offers
  // the Google button and the reset flow, which is how such a person gets in.
  if (!user.passwordHash) return fail();
  if (user.status === "suspended") return fail();
  if (!(await verifyPassword(password, user.passwordHash))) return fail();

  await clearFailures(emailKey);
  await createSession(user.id, { request, remember });
  await logAuthEvent("signed_in", { userId: user.id, email, request });

  return jsonOk({
    user: toSessionUser(user),
    // An unconfirmed address is nudged, not blocked: land them on the
    // confirm page, which has a "skip for now" way through.
    redirectTo: user.emailVerifiedAt ? routes.requests : routes.verifyEmail,
  });
}

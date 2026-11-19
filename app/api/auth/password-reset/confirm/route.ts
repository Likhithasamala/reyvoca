import { routes } from "@/config/site";
import { logAuthEvent } from "@/lib/server/audit";
import { sendPasswordChangedEmail } from "@/lib/server/auth-mail";
import { mutate } from "@/lib/server/db";
import { asString, jsonError, jsonOk, readJson } from "@/lib/server/http";
import { sameOriginGate } from "@/lib/server/origin";
import { hashPassword } from "@/lib/server/password";
import { clearFailures, clientIp, consumeQuota, RULES, waitMessage } from "@/lib/server/rate-limit";
import { createSession, revokeOtherSessions, toSessionUser } from "@/lib/server/session";
import { consumeToken, peekToken, tokenProblemMessage } from "@/lib/server/tokens";
import { validatePassword } from "@/lib/validation";

/**
 * POST /api/auth/password-reset/confirm — sets a new password from a link.
 *
 * The careful part is what happens *after* the password is written:
 *
 *  1. every other session is revoked. If the reason for the reset was that
 *     somebody else got in, their cookie has to stop working too — changing
 *     the password while leaving their session alive achieves nothing;
 *  2. the address is marked confirmed, because clicking a link sent to it is
 *     the same proof the verification email asks for;
 *  3. a "your password was changed" email goes out, so a reset the owner did
 *     not ask for cannot happen quietly;
 *  4. the person is signed in on this device, since they have just proved
 *     both the mailbox and a new password.
 */
export async function POST(request: Request) {
  const blocked = sameOriginGate(request);
  if (blocked) return blocked;

  const body = await readJson(request);
  if (!body) return jsonError("bad_request", "Expected a JSON body.", 400);

  // Redeeming is cheap but guessable in principle; cap attempts per IP.
  const quota = await consumeQuota(`redeem:ip:${clientIp(request)}`, RULES.tokenRedeemIp);
  if (!quota.ok) {
    return jsonError("validation_error", `Too many attempts. ${waitMessage(quota.retryAfterSeconds)}`, 429);
  }

  const token = asString(body.token);
  const password = asString(body.password);
  const confirmPassword = asString(body.confirmPassword);

  // Checked but not yet spent: a password that fails the rules below must not
  // cost someone their link. The authoritative, single-use redemption happens
  // once the new password is known to be acceptable.
  const checked = await peekToken(token, "password_reset");
  if (!checked.ok) {
    return jsonError("validation_error", tokenProblemMessage(checked.reason, "password_reset"), 400);
  }

  const problem =
    validatePassword(password, { checkStrength: true }) ??
    (confirmPassword && confirmPassword !== password ? "Those passwords do not match." : undefined);
  if (problem) return jsonError("validation_error", problem, 400);

  // Now spend it. This is the atomic step, so two simultaneous submissions of
  // the same link cannot both go through.
  const redeemed = await consumeToken(token, "password_reset");
  if (!redeemed.ok) {
    return jsonError("validation_error", tokenProblemMessage(redeemed.reason, "password_reset"), 400);
  }

  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();

  const user = await mutate((db) => {
    const row = db.users.find((candidate) => candidate.id === redeemed.token.userId);
    if (!row) return null;
    row.passwordHash = passwordHash;
    row.passwordChangedAt = now;
    // Clicking a link we emailed proves the address as well as any
    // confirmation link would.
    row.emailVerifiedAt ??= now;
    return row;
  });

  if (!user) return jsonError("validation_error", "That account no longer exists.", 400);

  // Someone who just proved their mailbox and set a new password should not
  // still be serving a lockout earned by failed guesses at the old one.
  await clearFailures(`signin:email:${user.email}`);
  await revokeOtherSessions(user.id);
  await createSession(user.id, { request, remember: body.remember === true });
  await logAuthEvent("password_reset", { userId: user.id, email: user.email, request });
  await sendPasswordChangedEmail(request, user);

  return jsonOk({ user: toSessionUser(user), redirectTo: routes.requests });
}

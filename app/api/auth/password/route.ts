import { logAuthEvent } from "@/lib/server/audit";
import { sendPasswordChangedEmail } from "@/lib/server/auth-mail";
import { mutate } from "@/lib/server/db";
import { asString, jsonError, jsonOk, readJson } from "@/lib/server/http";
import { sameOriginGate } from "@/lib/server/origin";
import { hashPassword, verifyPassword } from "@/lib/server/password";
import { clearFailures } from "@/lib/server/rate-limit";
import { createSession, revokeOtherSessions } from "@/lib/server/session";
import { requireUser } from "@/lib/server/session";
import { validatePassword } from "@/lib/validation";

/**
 * POST /api/auth/password — changes the password of the signed-in account.
 *
 * Re-asking for the current password is not bureaucracy: a session cookie
 * proves the browser, not the person. Without that step, anyone who sat down
 * at an unlocked laptop could change the password and lock the owner out.
 *
 * An account created through Google has no current password to give, so for
 * that one case the signed-in session is accepted on its own and the result
 * is a password being set for the first time.
 */
export async function POST(request: Request) {
  const blocked = sameOriginGate(request);
  if (blocked) return blocked;

  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const body = await readJson(request);
  if (!body) return jsonError("bad_request", "Expected a JSON body.", 400);

  const currentPassword = asString(body.currentPassword);
  const password = asString(body.password);
  const confirmPassword = asString(body.confirmPassword);
  const settingFirstPassword = auth.user.passwordHash === null;

  if (!settingFirstPassword) {
    if (!currentPassword) {
      return jsonError("validation_error", "Enter your current password.", 400);
    }
    if (!(await verifyPassword(currentPassword, auth.user.passwordHash as string))) {
      return jsonError("invalid_credentials", "That is not your current password.", 400);
    }
    if (currentPassword === password) {
      return jsonError("validation_error", "Choose a password you have not used here before.", 400);
    }
  }

  const problem =
    validatePassword(password, {
      checkStrength: true,
      email: auth.user.email,
      name: auth.user.fullName,
    }) ?? (confirmPassword && confirmPassword !== password ? "Those passwords do not match." : undefined);
  if (problem) return jsonError("validation_error", problem, 400);

  const passwordHash = await hashPassword(password);
  const user = await mutate((db) => {
    const row = db.users.find((candidate) => candidate.id === auth.user.id);
    if (!row) return null;
    row.passwordHash = passwordHash;
    row.passwordChangedAt = new Date().toISOString();
    return row;
  });
  if (!user) return jsonError("server_error", "Could not save the new password.", 500);

  // Everywhere else is signed out, then this device gets a brand-new session:
  // the old cookie is retired along with the old password.
  await clearFailures(`signin:email:${user.email}`);
  const revoked = await revokeOtherSessions(user.id);
  await createSession(user.id, { request, remember: auth.session.remember });
  await logAuthEvent("password_changed", { userId: user.id, email: user.email, request });
  await sendPasswordChangedEmail(request, user);

  return jsonOk({
    // `revoked` counts this device's old session too, hence the subtraction.
    otherDevicesSignedOut: Math.max(0, revoked - 1),
    wasFirstPassword: settingFirstPassword,
  });
}

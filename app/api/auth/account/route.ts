import { logAuthEvent } from "@/lib/server/audit";
import { sendEmailChangedNotice, sendEmailChangeEmail } from "@/lib/server/auth-mail";
import { mutate, read } from "@/lib/server/db";
import { asString, jsonError, jsonOk, readJson } from "@/lib/server/http";
import { sameOriginGate } from "@/lib/server/origin";
import { verifyPassword } from "@/lib/server/password";
import { destroySession, requireUser, revokeOtherSessions, toSessionUser } from "@/lib/server/session";
import { consumeToken, tokenProblemMessage } from "@/lib/server/tokens";
import { validateEmail, validateRequired } from "@/lib/validation";

/**
 * PATCH /api/auth/account — profile changes, and the email-change flow.
 *
 * Name and workspace save immediately; they are not security-relevant.
 *
 * Email is different and gets the two-step treatment every service uses:
 * asking for a new address only *starts* a change. The new mailbox has to
 * confirm it by clicking a link, and the old address is told afterwards. Were
 * it a single step, one unlocked laptop would be enough to move an account to
 * an attacker's address and lock the owner out of their own reset emails.
 */
export async function PATCH(request: Request) {
  const blocked = sameOriginGate(request);
  if (blocked) return blocked;

  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const body = await readJson(request);
  if (!body) return jsonError("bad_request", "Expected a JSON body.", 400);

  // Step two of an email change: redeem the token from the new mailbox.
  const emailToken = asString(body.emailToken);
  if (emailToken) {
    const redeemed = await consumeToken(emailToken, "email_change");
    if (!redeemed.ok) {
      return jsonError("validation_error", tokenProblemMessage(redeemed.reason, "email_change"), 400);
    }
    if (redeemed.token.userId !== auth.user.id) {
      return jsonError("forbidden", "That link belongs to a different account.", 403);
    }

    const pending = redeemed.token.pendingEmail?.toLowerCase() ?? "";
    const taken = await read((db) =>
      db.users.some((row) => row.email === pending && row.id !== auth.user.id),
    );
    if (!pending || taken) {
      return jsonError("email_taken", "That address is now in use by another account.", 409);
    }

    const previousEmail = auth.user.email;
    const updated = await mutate((db) => {
      const row = db.users.find((candidate) => candidate.id === auth.user.id);
      if (!row) return null;
      row.email = pending;
      // Confirmed by construction: the link was sent to this address.
      row.emailVerifiedAt = new Date().toISOString();
      return row;
    });
    if (!updated) return jsonError("server_error", "Could not save the new address.", 500);

    await logAuthEvent("email_changed", { userId: updated.id, email: pending, request });
    await sendEmailChangedNotice(request, updated, previousEmail);
    return jsonOk({ user: toSessionUser(updated), emailChanged: true });
  }

  // Step one of an email change: ask, and send the confirmation link.
  const newEmail = asString(body.email).trim().toLowerCase();
  if (newEmail && newEmail !== auth.user.email) {
    const problem = validateEmail(newEmail);
    if (problem) return jsonError("validation_error", problem, 400);

    // Changing the address is as sensitive as changing the password.
    const password = asString(body.password);
    if (auth.user.passwordHash) {
      if (!password) return jsonError("validation_error", "Enter your password to change your email.", 400);
      if (!(await verifyPassword(password, auth.user.passwordHash))) {
        return jsonError("invalid_credentials", "That password is not correct.", 400);
      }
    }

    const taken = await read((db) => db.users.some((row) => row.email === newEmail));
    if (taken) {
      return jsonError("email_taken", "An account already exists for that email.", 409);
    }

    const mail = await sendEmailChangeEmail(request, auth.user, newEmail);
    await logAuthEvent("email_change_requested", { userId: auth.user.id, email: newEmail, request });
    return jsonOk({ pendingEmail: newEmail, emailSent: mail.delivered });
  }

  // Plain profile edit.
  const fullName = asString(body.fullName).trim();
  const workspace = asString(body.workspace).trim();
  const problem =
    (fullName ? validateRequired(fullName, "full name") : undefined) ??
    (workspace ? validateRequired(workspace, "company or workspace name") : undefined);
  if (problem) return jsonError("validation_error", problem, 400);
  if (!fullName && !workspace) {
    return jsonError("validation_error", "Nothing to change.", 400);
  }

  const updated = await mutate((db) => {
    const row = db.users.find((candidate) => candidate.id === auth.user.id);
    if (!row) return null;
    if (fullName) row.fullName = fullName;
    if (workspace) row.workspace = workspace;
    return row;
  });
  if (!updated) return jsonError("server_error", "Could not save those changes.", 500);

  return jsonOk({ user: toSessionUser(updated) });
}

/**
 * DELETE /api/auth/account — deletes the account and everything it owns.
 *
 * Guarded by the password (or, for a Google account, by typing the email),
 * and it really deletes: the user row, every session, every pending link, and
 * every workspace-scoped record. A "deleted" flag that leaves the data in
 * place is not what someone asking to be deleted is asking for.
 */
export async function DELETE(request: Request) {
  const blocked = sameOriginGate(request);
  if (blocked) return blocked;

  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const body = await readJson(request);
  const password = asString(body?.password);
  const confirmEmail = asString(body?.confirmEmail).trim().toLowerCase();

  if (auth.user.passwordHash) {
    if (!(await verifyPassword(password, auth.user.passwordHash))) {
      return jsonError("invalid_credentials", "That password is not correct.", 400);
    }
  } else if (confirmEmail !== auth.user.email) {
    return jsonError("validation_error", "Type your email address to confirm.", 400);
  }

  const userId = auth.user.id;
  await logAuthEvent("account_deleted", { userId, email: auth.user.email, request });

  await mutate((db) => {
    db.users = db.users.filter((row) => row.id !== userId);
    db.sessions = db.sessions.filter((row) => row.userId !== userId);
    db.authTokens = db.authTokens.filter((row) => row.userId !== userId);
    // Workspace-scoped data: the workspace id is the user id (see
    // lib/server/workspace.ts), so everything this account owns goes with it.
    db.agents = db.agents.filter((row) => row.workspaceId !== userId);
    db.leads = db.leads.filter((row) => row.workspaceId !== userId);
    db.campaigns = db.campaigns.filter((row) => row.workspaceId !== userId);
    db.webhookEvents = db.webhookEvents.filter((row) => row.workspaceId !== userId);
    db.instantSetups = db.instantSetups.filter((row) => row.workspaceId !== userId);
    db.idempotencyKeys = db.idempotencyKeys.filter((row) => row.workspaceId !== userId);
    db.calls = db.calls.filter((row) => row.userId !== userId);
    db.wallets = db.wallets.filter((row) => row.workspaceId !== userId);
    db.ledger = db.ledger.filter((row) => row.workspaceId !== userId);
    db.topupRequests = db.topupRequests.filter((row) => row.workspaceId !== userId);
  });

  await revokeOtherSessions(userId);
  await destroySession();

  return jsonOk({ redirectTo: "/" });
}

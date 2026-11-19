import { logAuthEvent } from "@/lib/server/audit";
import { asString, jsonError, jsonOk, readJson } from "@/lib/server/http";
import { sameOriginGate } from "@/lib/server/origin";
import { listSessions, requireUser, revokeOtherSessions, revokeSession } from "@/lib/server/session";

/** GET /api/auth/sessions — where this account is signed in. */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  return jsonOk({ sessions: await listSessions(auth.user.id) });
}

/**
 * DELETE /api/auth/sessions — signs out other devices.
 *
 * With a `sessionId`, drops that one; with nothing, drops every session but
 * the one asking. This is the control someone reaches for when they realise
 * they left themselves signed in somewhere, and it is the reason sessions are
 * rows in a database rather than self-contained tokens.
 */
export async function DELETE(request: Request) {
  const blocked = sameOriginGate(request);
  if (blocked) return blocked;

  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const body = await readJson(request);
  const sessionId = asString(body?.sessionId);

  if (sessionId) {
    if (sessionId === auth.session.id) {
      return jsonError("validation_error", "Use sign out to end this session.", 400);
    }
    const removed = await revokeSession(auth.user.id, sessionId);
    if (!removed) return jsonError("validation_error", "That session has already ended.", 404);
    await logAuthEvent("sessions_revoked", { userId: auth.user.id, email: auth.user.email, request });
    return jsonOk({ revoked: 1 });
  }

  const revoked = await revokeOtherSessions(auth.user.id, auth.session.id);
  if (revoked > 0) {
    await logAuthEvent("sessions_revoked", { userId: auth.user.id, email: auth.user.email, request });
  }
  return jsonOk({ revoked });
}

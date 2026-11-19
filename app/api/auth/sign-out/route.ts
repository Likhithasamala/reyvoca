import { logAuthEvent } from "@/lib/server/audit";
import { jsonOk } from "@/lib/server/http";
import { sameOriginGate } from "@/lib/server/origin";
import { currentSession, destroySession } from "@/lib/server/session";

/** POST /api/auth/sign-out — clears the session cookie and its database row. */
export async function POST(request: Request) {
  const blocked = sameOriginGate(request);
  if (blocked) return blocked;

  // Read the account before the session goes, so the event can name it.
  const found = await currentSession();
  await destroySession();
  if (found) {
    await logAuthEvent("signed_out", { userId: found.user.id, email: found.user.email, request });
  }

  return jsonOk({ redirectTo: "/" });
}

import { jsonOk } from "@/lib/server/http";
import { destroySession } from "@/lib/server/session";

/** POST /api/auth/sign-out — clears the session cookie and its database row. */
export async function POST() {
  await destroySession();
  return jsonOk({ redirectTo: "/" });
}

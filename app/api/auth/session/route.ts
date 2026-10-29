import { getSessionUser } from "@/lib/server/session";

/** GET /api/auth/session — the signed-in account, or `user: null`. */
export async function GET() {
  const user = await getSessionUser();
  return Response.json({ ok: true, user });
}

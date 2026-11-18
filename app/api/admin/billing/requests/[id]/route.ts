import { adminGate, currentAdmin } from "@/lib/server/admin";
import { mutate } from "@/lib/server/db";
import { jsonError, jsonOk } from "@/lib/server/http";

/** DELETE /api/admin/billing/requests/[id] — dismisses a pending credit request. */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/admin/billing/requests/[id]">) {
  const denied = await adminGate();
  if (denied) return denied;
  const { id } = await ctx.params;
  const { user } = await currentAdmin();
  const done = await mutate((db) => {
    const row = db.topupRequests.find((entry) => entry.id === id && entry.status === "pending");
    if (!row) return false;
    row.status = "dismissed";
    row.resolvedAt = new Date().toISOString();
    row.resolvedBy = user?.email ?? "operator (local)";
    return true;
  });
  if (!done) return jsonError("bad_request", "That request is no longer pending.", 404);
  return jsonOk({});
}

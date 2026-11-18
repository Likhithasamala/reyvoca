import { adminGate } from "@/lib/server/admin";
import { mutate } from "@/lib/server/db";
import { invalidateEngineCache } from "@/lib/server/engine";
import { jsonError, jsonOk } from "@/lib/server/http";
import { PLATFORM_WORKSPACE_ID } from "@/lib/server/scope";

/** DELETE /api/providers/[id] — removes a platform key. Operators only. */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/providers/[id]">) {
  const denied = await adminGate();
  if (denied) return denied;

  const { id } = await ctx.params;

  const removed = await mutate((db) => {
    const before = db.providerConfigs.length;
    db.providerConfigs = db.providerConfigs.filter(
      (row) => !(row.id === id && row.workspaceId === PLATFORM_WORKSPACE_ID),
    );
    return db.providerConfigs.length < before;
  });

  if (!removed) return jsonError("bad_request", "Key not found.", 404);
  invalidateEngineCache();
  return jsonOk({});
}

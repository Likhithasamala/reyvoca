import { mutate } from "@/lib/server/db";
import { jsonError, jsonOk } from "@/lib/server/http";
import { currentWorkspaceId } from "@/lib/server/workspace";

/** DELETE /api/providers/[id] — removes a saved key. */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/providers/[id]">) {
  const { id } = await ctx.params;
  const workspaceId = await currentWorkspaceId();

  const removed = await mutate((db) => {
    const before = db.providerConfigs.length;
    db.providerConfigs = db.providerConfigs.filter(
      (row) => !(row.id === id && row.workspaceId === workspaceId),
    );
    return db.providerConfigs.length < before;
  });

  if (!removed) return jsonError("bad_request", "Key not found.", 404);
  return jsonOk({});
}

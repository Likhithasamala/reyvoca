import { jsonOk } from "@/lib/server/http";
import { getOverview } from "@/lib/server/overview";
import { currentWorkspace } from "@/lib/server/workspace";

/**
 * GET /api/dashboard/overview — live figures for the current workspace.
 *
 * Open without an account, like the rest of the dashboard API: signed out, the
 * figures are those of the shared development workspace.
 */
export async function GET() {
  const { id, name } = await currentWorkspace();
  return jsonOk(await getOverview({ workspaceId: id, workspace: name }));
}

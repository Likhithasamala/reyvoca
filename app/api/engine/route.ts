import { jsonOk } from "@/lib/server/http";
import { engineStatus } from "@/lib/server/engine";
import { currentWorkspaceId } from "@/lib/server/workspace";

/**
 * GET /api/engine — what the dashboard may know about the voice engine.
 *
 * Capability flags, the voices on offer and the languages they speak. Which
 * vendors are behind them is deliberately absent: that lives in the operator
 * panel (`/api/providers`, admin only).
 */
export async function GET() {
  const workspaceId = await currentWorkspaceId();
  const engine = await engineStatus(workspaceId);
  return jsonOk({ engine });
}

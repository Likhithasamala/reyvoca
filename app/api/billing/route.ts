import { jsonError, jsonOk } from "@/lib/server/http";
import { customerUsage, reconcileCalls } from "@/lib/server/billing";
import { currentWorkspaceId } from "@/lib/server/workspace";

/**
 * GET /api/billing — this workspace's wallet, per-minute price, live calls,
 * usage and credit history. Calls awaiting Sarvam's record are settled first,
 * so the figures are as final as Sarvam allows.
 */
export async function GET() {
  const workspaceId = await currentWorkspaceId();
  try {
    await reconcileCalls(workspaceId);
  } catch {
    // Settlement is retried on the next request; usage still reports.
  }
  try {
    return jsonOk({ usage: await customerUsage(workspaceId) });
  } catch {
    return jsonError("server_error", "Could not load usage. Try again.", 500);
  }
}

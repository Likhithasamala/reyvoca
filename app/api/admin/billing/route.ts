import { adminGate } from "@/lib/server/admin";
import { jsonError, jsonOk } from "@/lib/server/http";
import { operatorBilling, reconcileCalls } from "@/lib/server/billing";
import { DEV_WORKSPACE_ID, DEV_WORKSPACE_NAME } from "@/lib/server/workspace";

/** GET /api/admin/billing — prices, margin earned and every wallet. Operator-only. */
export async function GET() {
  const denied = await adminGate();
  if (denied) return denied;
  try {
    await reconcileCalls(undefined, 10);
  } catch {
    // Retried next time; the figures below are still consistent.
  }
  try {
    return jsonOk({ billing: await operatorBilling({ id: DEV_WORKSPACE_ID, name: DEV_WORKSPACE_NAME }) });
  } catch {
    return jsonError("server_error", "Could not load billing. Try again.", 500);
  }
}

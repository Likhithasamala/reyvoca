import { mutate } from "@/lib/server/db";
import { jsonError, jsonOk, readJson } from "@/lib/server/http";
import { meterCall } from "@/lib/server/billing";
import { currentWorkspaceId } from "@/lib/server/workspace";

/**
 * POST /api/calls/[id]/meter — the live call meter.
 *
 * The browser calls this once audio connects (`{ connected: true }`) and then
 * every few seconds. Minutes are counted on the server's clock from the
 * connect moment, each charged as it starts. The reply says how far the call
 * is paid for and whether the wallet can pay for the next minute; when it
 * cannot, the browser hangs up before `paidUntil`.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/calls/[id]/meter">) {
  const { id } = await ctx.params;
  const body = (await readJson(request)) ?? {};
  const workspaceId = await currentWorkspaceId();

  const meter = await mutate((db) => {
    const call = db.calls.find((entry) => entry.id === id && entry.userId === workspaceId);
    if (!call) return undefined;
    return meterCall(db, call, { connected: body.connected === true });
  });
  if (meter === undefined) return jsonError("bad_request", "Call not found.", 404);
  if (meter === null) return jsonError("bad_request", "This call is not metered.", 400);
  return jsonOk({ meter });
}

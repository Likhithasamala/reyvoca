import { mutate } from "@/lib/server/db";
import { asString, jsonError, jsonOk, readJson } from "@/lib/server/http";
import { endCallBilling } from "@/lib/server/billing";
import { currentWorkspaceId } from "@/lib/server/workspace";

const MAX_CALL_SECONDS = 4 * 60 * 60;

/**
 * PATCH /api/calls/[id] — closes a call: { outcome, durationSeconds? }.
 *
 * A metered call's length and charge come from the server clock (and later
 * from Sarvam), never from the browser; `durationSeconds` is only used for
 * calls that were not metered.
 */
export async function PATCH(request: Request, ctx: RouteContext<"/api/calls/[id]">) {
  const { id } = await ctx.params;
  const body = await readJson(request);
  if (!body) return jsonError("bad_request", "Expected a JSON body.", 400);
  const outcome = asString(body.outcome).trim().slice(0, 60) || "Completed";

  const workspaceId = await currentWorkspaceId();
  const updated = await mutate((db) => {
    const call = db.calls.find((entry) => entry.id === id && entry.userId === workspaceId);
    if (!call) return null;
    if (call.billing) {
      endCallBilling(db, call);
    } else {
      const seconds = Math.round(Number(body.durationSeconds));
      if (Number.isFinite(seconds) && seconds >= 0 && seconds <= MAX_CALL_SECONDS) call.durationSeconds = seconds;
    }
    call.outcome = outcome;
    return {
      id: call.id,
      durationSeconds: call.durationSeconds,
      outcome: call.outcome,
      minutes: call.billing?.minutesCharged ?? 0,
      creditsPaise: call.billing?.chargedPaise ?? 0,
    };
  });
  if (!updated) return jsonError("bad_request", "Call not found.", 404);
  return jsonOk({ call: updated });
}

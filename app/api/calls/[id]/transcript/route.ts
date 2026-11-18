import { mutate, read } from "@/lib/server/db";
import { jsonError, jsonOk } from "@/lib/server/http";
import { settleCall } from "@/lib/server/billing";
import { callTag, findInteraction, samvaadConfig } from "@/lib/server/samvaad";
import { currentWorkspaceId } from "@/lib/server/workspace";

/**
 * GET /api/calls/[id]/transcript — the call's transcript, read live from
 * Sarvam. Sarvam is the record of what was said; only its interaction id and
 * duration are copied onto the call. `pending: true` means Sarvam has not
 * written the call up yet — ask again in a few seconds.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/calls/[id]/transcript">) {
  const { id } = await ctx.params;
  const workspaceId = await currentWorkspaceId();
  const call = await read((db) => db.calls.find((entry) => entry.id === id && entry.userId === workspaceId));
  if (!call) return jsonError("bad_request", "Call not found.", 404);
  if (call.channel !== "web") return jsonError("bad_request", "This call has no Sarvam transcript.", 404);

  const config = samvaadConfig();
  if (!config) return jsonError("server_error", "Web calls are not configured yet.", 503);

  let found;
  try {
    found = await findInteraction(config, callTag(call.id), new Date(call.startedAt));
  } catch {
    return jsonError("server_error", "Could not load the transcript from the voice service.", 502);
  }
  if (!found) return jsonOk({ callId: call.id, pending: true, messages: [] });

  // Sarvam's record is in: store its id and settle the bill to its duration.
  await mutate((db) => {
    const row = db.calls.find((entry) => entry.id === call.id);
    if (!row) return;
    row.interactionId = found.interactionId;
    if (row.billing) settleCall(db, row, found.durationSeconds);
    else if (found.durationSeconds) row.durationSeconds = found.durationSeconds;
  });
  return jsonOk({
    callId: call.id,
    pending: false,
    interactionId: found.interactionId,
    durationSeconds: found.durationSeconds,
    endedBy: found.endedBy,
    messages: found.messages,
  });
}

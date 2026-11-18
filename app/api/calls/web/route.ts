import { mutate, newId, read, type StoredCall } from "@/lib/server/db";
import { asString, jsonError, jsonOk, readJson } from "@/lib/server/http";
import { formatCredits } from "@/lib/billing/format";
import { openCallBilling } from "@/lib/server/billing";
import { callTag, publicSamvaadConfig, samvaadConfig } from "@/lib/server/samvaad";
import { currentWorkspaceId } from "@/lib/server/workspace";

/**
 * GET /api/calls/web — whether browser calls run on Sarvam, and the public
 * ids the SDK needs to address the agent. The API key is never included.
 */
export async function GET() {
  const config = samvaadConfig();
  return jsonOk({ enabled: !!config, samvaad: config ? publicSamvaadConfig(config) : null });
}

/**
 * POST /api/calls/web — opens a web call record before the browser connects.
 * Body: { agentId?, agentName? }. Returns the call and the `tag` the browser
 * must send to Sarvam as `user_identifier`; the transcript route finds
 * Sarvam's record by that tag. Duration and outcome follow on PATCH.
 */
export async function POST(request: Request) {
  if (!samvaadConfig()) return jsonError("server_error", "Web calls are not configured yet.", 503);
  const body = await readJson(request);
  if (!body) return jsonError("bad_request", "Expected a JSON body.", 400);

  const workspaceId = await currentWorkspaceId();
  const agentId = asString(body.agentId).trim();
  // The agent's name comes from storage, not the request, when the agent exists.
  const stored = agentId
    ? await read((db) => db.agents.find((a) => a.id === agentId && a.workspaceId === workspaceId))
    : undefined;

  const opened = await mutate((db) => {
    const billing = openCallBilling(db, workspaceId);
    if ("refused" in billing) return billing;
    const call: StoredCall = {
      id: newId(),
      userId: workspaceId,
      customer: "Web call",
      agent: stored?.name ?? (asString(body.agentName).trim().slice(0, 80) || "Unsaved agent"),
      durationSeconds: 0,
      outcome: "In progress",
      startedAt: new Date().toISOString(),
      agentId: stored?.id,
      channel: "web",
      billing,
    };
    db.calls.push(call);
    return call;
  });
  if ("refused" in opened) {
    return jsonError(
      "insufficient_credits",
      `Not enough credits. A call needs at least ${formatCredits(opened.ratePaise)} credits for its first minute; ` +
        `this workspace has ${formatCredits(opened.balancePaise)}. Add credits under Usage & Billing.`,
      402,
    );
  }
  // Only the id leaves the server: the billing record holds Sarvam's rate.
  return jsonOk({ call: { id: opened.id }, tag: callTag(opened.id) }, 201);
}

import { publicRecord, read } from "@/lib/server/db";
import { jsonError, jsonOk, readJson } from "@/lib/server/http";
import { ingestLead } from "@/lib/server/leads";
import { currentWorkspaceId } from "@/lib/server/workspace";
import type { LeadChannel, LeadEventPayload } from "@/types/calling";

/** GET /api/leads — every lead in this workspace, whichever channel called. */
export async function GET() {
  const workspaceId = await currentWorkspaceId();
  const leads = await read((db) =>
    db.leads.filter((lead) => lead.workspaceId === workspaceId).map(publicRecord),
  );
  return jsonOk({ leads });
}

/**
 * POST /api/leads — the inbound lead event.
 *
 * This is the endpoint a form, CRM or webhook posts to. Validation and
 * de-duplication run here, so a retried delivery never produces a second call.
 */
export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return jsonError("bad_request", "Expected a JSON body.", 400);

  const payload = body as unknown as LeadEventPayload;
  if (!payload.lead) return jsonError("bad_request", "Expected a `lead` object.", 400);

  const workspaceId = await currentWorkspaceId();
  const channel = (payload as { channel?: LeadChannel }).channel ?? "instant";

  const result = await ingestLead(
    { ...payload, event: payload.event ?? "lead.created" },
    { workspaceId, channel },
  );

  if (!result.valid) {
    // 409 for a replay, 422 for a lead that can never be called.
    const status = result.reason === "Duplicate event" ? 409 : 422;
    return jsonError("validation_error", result.detail ?? result.reason, status);
  }

  return jsonOk({ lead: result.lead }, 201);
}

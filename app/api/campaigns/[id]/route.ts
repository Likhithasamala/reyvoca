import { mutate, publicRecord } from "@/lib/server/db";
import { asString, jsonError, jsonOk, readJson } from "@/lib/server/http";
import { currentWorkspaceId } from "@/lib/server/workspace";
import { CAMPAIGN_STATUS_LABELS, type CampaignStatus } from "@/types/calling";

/** PATCH /api/campaigns/[id] — changes a campaign's status. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/campaigns/[id]">) {
  const { id } = await ctx.params;
  const body = await readJson(request);
  if (!body) return jsonError("bad_request", "Expected a JSON body.", 400);

  const status = asString(body.status) as CampaignStatus;
  if (!(status in CAMPAIGN_STATUS_LABELS)) {
    return jsonError("validation_error", `Unknown campaign status "${status}".`, 400);
  }

  const workspaceId = await currentWorkspaceId();
  const updated = await mutate((db) => {
    const campaign = db.campaigns.find(
      (entry) => entry.id === id && entry.workspaceId === workspaceId,
    );
    if (!campaign) return null;
    campaign.status = status;
    campaign.updatedAt = new Date().toISOString();
    return publicRecord(campaign);
  });

  if (!updated) return jsonError("bad_request", "Campaign not found.", 404);
  return jsonOk({ campaign: updated });
}

/** DELETE /api/campaigns/[id] — removes a campaign. */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/campaigns/[id]">) {
  const { id } = await ctx.params;
  const workspaceId = await currentWorkspaceId();

  const removed = await mutate((db) => {
    const before = db.campaigns.length;
    db.campaigns = db.campaigns.filter(
      (entry) => !(entry.id === id && entry.workspaceId === workspaceId),
    );
    return db.campaigns.length < before;
  });

  if (!removed) return jsonError("bad_request", "Campaign not found.", 404);
  return jsonOk({});
}

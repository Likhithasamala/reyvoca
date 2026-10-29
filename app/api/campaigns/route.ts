import { mutate, newId, publicRecord, read } from "@/lib/server/db";
import { asString, jsonError, jsonOk, readJson } from "@/lib/server/http";
import { currentWorkspaceId } from "@/lib/server/workspace";
import type { Campaign, CampaignContact, CampaignStatus } from "@/types/calling";

/** GET /api/campaigns — campaigns in this workspace, newest first. */
export async function GET() {
  const workspaceId = await currentWorkspaceId();
  const campaigns = await read((db) =>
    db.campaigns
      .filter((campaign) => campaign.workspaceId === workspaceId)
      .map(publicRecord),
  );
  return jsonOk({ campaigns });
}

/** POST /api/campaigns — creates a campaign from a validated contact list. */
export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return jsonError("bad_request", "Expected a JSON body.", 400);

  const name = asString(body.name).trim();
  if (!name) return jsonError("validation_error", "Give the campaign a name.", 400);

  const contacts = Array.isArray(body.contacts) ? (body.contacts as CampaignContact[]) : [];
  const callable = contacts.filter((contact) => !contact.invalidReason && !contact.excluded);
  if (callable.length === 0) {
    return jsonError("validation_error", "No contact in this list can be called.", 400);
  }

  const now = new Date().toISOString();
  const campaign = {
    ...(body as Partial<Campaign>),
    id: newId(),
    name,
    contacts,
    status: (asString(body.status) || "scheduled") as CampaignStatus,
    createdAt: now,
    updatedAt: now,
  } as Campaign;

  const workspaceId = await currentWorkspaceId();
  await mutate((db) => {
    db.campaigns.unshift({ ...campaign, workspaceId });
  });

  return jsonOk({ campaign }, 201);
}

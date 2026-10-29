import { mutate, publicRecord, read } from "@/lib/server/db";
import { jsonError, jsonOk, readJson } from "@/lib/server/http";
import { currentWorkspaceId } from "@/lib/server/workspace";
import type { InstantSetup, InstantSetupStatus } from "@/types/calling";

const DEFAULT_SETUP: InstantSetup = {
  status: "not_configured",
  timing: { mode: "immediate", delayMinutes: 0 },
  rules: {
    window: { start: "09:00", end: "19:00", timezone: "Workspace timezone" },
    retry: { retryOnNoAnswer: true, maxRetries: 2, retryDelayMinutes: 60 },
    respectDoNotCall: true,
  },
  goals: ["interest_level", "requirement", "callback_requested"],
  actions: ["update_lead", "create_callback"],
};

/** A setup only counts as configured once it has both a source and an agent. */
function resolveStatus(setup: InstantSetup, requested?: InstantSetupStatus): InstantSetupStatus {
  if (!setup.source || !setup.agentId) return "not_configured";
  if (requested === "active" || requested === "paused") return requested;
  return setup.status === "active" || setup.status === "paused" ? setup.status : "ready";
}

/** GET /api/instant-setup — this workspace's instant calling configuration. */
export async function GET() {
  const workspaceId = await currentWorkspaceId();
  const setup = await read((db) => {
    const stored = db.instantSetups.find((entry) => entry.workspaceId === workspaceId);
    return stored ? publicRecord(stored) : DEFAULT_SETUP;
  });
  return jsonOk({ setup });
}

/** PUT /api/instant-setup — merges a patch into the stored configuration. */
export async function PUT(request: Request) {
  const body = await readJson(request);
  if (!body) return jsonError("bad_request", "Expected a JSON body.", 400);

  const workspaceId = await currentWorkspaceId();
  const requested = body.status as InstantSetupStatus | undefined;

  const setup = await mutate((db) => {
    const index = db.instantSetups.findIndex((entry) => entry.workspaceId === workspaceId);
    const current: InstantSetup = index >= 0 ? db.instantSetups[index] : DEFAULT_SETUP;

    const merged: InstantSetup = {
      ...current,
      ...(body as Partial<InstantSetup>),
      updatedAt: new Date().toISOString(),
    };
    merged.status = resolveStatus(merged, requested);

    const row = { ...merged, workspaceId };
    if (index >= 0) db.instantSetups[index] = row;
    else db.instantSetups.push(row);

    return merged;
  });

  return jsonOk({ setup });
}

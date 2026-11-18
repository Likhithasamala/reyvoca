import { hideEngine, resolveEngine } from "@/lib/server/engine";
import { mutate, publicRecord, read } from "@/lib/server/db";
import { asString, jsonError, jsonOk, readJson } from "@/lib/server/http";
import { currentWorkspaceId } from "@/lib/server/workspace";
import { AGENT_ROLES, normalizeAgentConfig, type AgentRole, type AgentStatus } from "@/lib/agents/types";

const STATUSES: AgentStatus[] = ["Draft", "Ready", "Live", "Paused"];

/** GET /api/agents/[id] — one agent, with the engine fields blanked. */
export async function GET(_request: Request, ctx: RouteContext<"/api/agents/[id]">) {
  const { id } = await ctx.params;
  const workspaceId = await currentWorkspaceId();
  const agent = await read((db) =>
    db.agents.find((entry) => entry.id === id && entry.workspaceId === workspaceId),
  );
  if (!agent) return jsonError("bad_request", "Agent not found.", 404);
  return jsonOk({
    agent: { ...publicRecord(agent), config: hideEngine(normalizeAgentConfig(agent.config)) },
  });
}

/** PATCH /api/agents/[id] — updates an agent's fields and config. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/agents/[id]">) {
  const { id } = await ctx.params;
  const body = await readJson(request);
  if (!body) return jsonError("bad_request", "Expected a JSON body.", 400);

  const workspaceId = await currentWorkspaceId();
  // Resolved before the mutation so the write stays synchronous.
  const engine = await resolveEngine(
    workspaceId,
    asString((body.config as Record<string, unknown> | undefined)?.template),
  );

  const updated = await mutate((db) => {
    const agent = db.agents.find((entry) => entry.id === id && entry.workspaceId === workspaceId);
    if (!agent) return null;

    if (typeof body.name === "string" && body.name.trim()) agent.name = body.name.trim();
    if (typeof body.purpose === "string") agent.purpose = body.purpose.trim();
    if (typeof body.firstMessage === "string") agent.firstMessage = body.firstMessage;
    if (typeof body.instructions === "string") agent.instructions = body.instructions;

    const role = asString(body.role) as AgentRole;
    if (AGENT_ROLES.includes(role)) agent.role = role;

    const status = asString(body.status) as AgentStatus;
    if (STATUSES.includes(status)) agent.status = status;

    if (typeof body.config === "object" && body.config !== null) {
      const config = normalizeAgentConfig({ ...normalizeAgentConfig(agent.config), ...body.config });
      // The caller's provider fields are ignored — Reyvoca owns that choice.
      // If the voice engine has changed under the agent, the saved voice no
      // longer exists, so it is cleared and the editor picks a new one.
      const previousVoiceProvider = normalizeAgentConfig(agent.config).voiceProvider;
      Object.assign(config, engine);
      if (previousVoiceProvider && previousVoiceProvider !== engine.voiceProvider) {
        config.voiceId = "";
        config.voiceName = "";
      }
      agent.config = config;
      agent.language = config.primaryLanguage;
    }

    return publicRecord(agent);
  });

  if (!updated) return jsonError("bad_request", "Agent not found.", 404);
  return jsonOk({ agent: { ...updated, config: hideEngine(normalizeAgentConfig(updated.config)) } });
}

/** DELETE /api/agents/[id] — removes an agent. */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/agents/[id]">) {
  const { id } = await ctx.params;
  const workspaceId = await currentWorkspaceId();

  const removed = await mutate((db) => {
    const before = db.agents.length;
    db.agents = db.agents.filter((entry) => !(entry.id === id && entry.workspaceId === workspaceId));
    return db.agents.length < before;
  });

  if (!removed) return jsonError("bad_request", "Agent not found.", 404);
  return jsonOk({});
}

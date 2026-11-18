import { hideEngine, resolveEngine } from "@/lib/server/engine";
import { mutate, newId, publicRecord, read } from "@/lib/server/db";
import { asString, jsonError, jsonOk, readJson } from "@/lib/server/http";
import { currentWorkspaceId } from "@/lib/server/workspace";
import {
  AGENT_ROLES,
  normalizeAgentConfig,
  type Agent,
  type AgentRole,
} from "@/lib/agents/types";

/**
 * GET /api/agents — agents in this workspace, newest first.
 *
 * The engine fields are blanked on the way out: the dashboard shows what an
 * agent does, never which vendor runs it.
 */
export async function GET() {
  const workspaceId = await currentWorkspaceId();
  const agents = await read((db) =>
    db.agents
      .filter((agent) => agent.workspaceId === workspaceId)
      .map(publicRecord)
      .map((agent) => ({ ...agent, config: hideEngine(normalizeAgentConfig(agent.config)) })),
  );
  return jsonOk({ agents });
}

/** POST /api/agents — creates an agent. */
export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return jsonError("bad_request", "Expected a JSON body.", 400);

  const name = asString(body.name).trim();
  // The form validates too; the server never trusts that it did.
  if (!name) return jsonError("validation_error", "Give your agent a name.", 400);

  const role = asString(body.role) as AgentRole;
  const config = normalizeAgentConfig(body.config);

  const workspaceId = await currentWorkspaceId();
  // The engine is Reyvoca's choice, not the caller's: whatever the request
  // said about providers is replaced by the platform's own resolution.
  const engine = await resolveEngine(workspaceId, config.template);
  Object.assign(config, engine);

  const agent: Agent = {
    id: newId(),
    name,
    purpose: asString(body.purpose).trim(),
    role: AGENT_ROLES.includes(role) ? role : "Custom",
    language: config.primaryLanguage,
    firstMessage: asString(body.firstMessage).trim(),
    instructions: asString(body.instructions),
    status: "Draft",
    createdAt: new Date().toISOString(),
    config,
  };

  await mutate((db) => {
    db.agents.unshift({ ...agent, workspaceId });
  });

  return jsonOk({ agent: { ...agent, config: hideEngine(config) } }, 201);
}

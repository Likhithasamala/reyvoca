"use client";

/**
 * Agents, served by the Reyvoca API.
 *
 * Agents are stored on the server (`/api/agents`), so they survive a reload,
 * follow the workspace across devices and are visible to anything else that
 * reads the same API.
 */
import { apiFetch, createRemoteStore } from "@/lib/calling/remote-store";
import type { Agent, AgentDraft } from "./types";

export {
  AGENT_ROLES,
  emptyAgentConfig,
  type Agent,
  type AgentConfig,
  type AgentDraft,
  type AgentRole,
  type AgentStatus,
  type AgentTool,
} from "./types";

const agentStore = createRemoteStore<Agent[]>(
  "/agents",
  (body) => (body.agents as Agent[]) ?? [],
  [],
);

export type AgentsSnapshot = { agents: Agent[]; ready: boolean; error?: string };

/** Creates an agent on the server and refreshes the cached list. */
export async function createAgent(draft: AgentDraft): Promise<Agent> {
  const { agent } = await apiFetch<{ agent: Agent }>("/agents", {
    method: "POST",
    body: JSON.stringify(draft),
  });
  await agentStore.refresh();
  return agent;
}

/** Updates an agent on the server and refreshes the cached list. */
export async function updateAgent(id: string, patch: Partial<Agent>): Promise<Agent> {
  const { agent } = await apiFetch<{ agent: Agent }>(`/agents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  await agentStore.refresh();
  return agent;
}

/** Deletes an agent on the server and refreshes the cached list. */
export async function deleteAgent(id: string): Promise<void> {
  await apiFetch(`/agents/${id}`, { method: "DELETE" });
  await agentStore.refresh();
}

export function useAgents(): AgentsSnapshot {
  const { value, ready, error } = agentStore.use();
  return { agents: value, ready, error };
}

/** Single agent by id. `ready` behaves as in `useAgents`. */
export function useAgent(id: string) {
  const { agents, ready, error } = useAgents();
  return { agent: agents.find((candidate) => candidate.id === id), ready, error };
}

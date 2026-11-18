"use client";

import { Bot, Plus } from "lucide-react";
import { AgentCard } from "@/components/dashboard/agent-card";
import { ActionLink } from "@/components/panel/action";
import { EmptyState } from "@/components/panel/empty-state";
import { PageHeader } from "@/components/panel/page-header";
import { deleteAgent, useAgents } from "@/lib/agents/store";

export function MyAgentsView() {
  const { agents, ready } = useAgents();

  async function remove(id: string, name: string) {
    if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return;
    await deleteAgent(id);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="My Agents"
        description="Create, manage and monitor your Reyvoca voice agents."
        actions={
          <ActionLink href="/dashboard/agents/create">
            <Plus className="size-4" aria-hidden="true" /> Create Agent
          </ActionLink>
        }
      />

      {!ready ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-[178px] rounded-xl border border-line bg-surface-muted/50" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="No agents yet"
          description="Create your first AI voice agent from a template — prompt, model and voice come prefilled."
          action={
            <ActionLink href="/dashboard/agents/create">
              <Plus className="size-4" aria-hidden="true" /> Create Agent
            </ActionLink>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} onDelete={() => remove(agent.id, agent.name)} />
          ))}
        </div>
      )}
    </div>
  );
}

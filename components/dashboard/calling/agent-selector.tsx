"use client";

import { Bot, Plus } from "lucide-react";
import { ActionLink } from "@/components/panel/action";
import { StatusBadge } from "@/components/panel/status-badge";
import { useAgents } from "@/lib/agents/store";
import { cn } from "@/lib/cn";

/**
 * Picks the agent that will handle the conversation.
 *
 * Shared by Instant Leads and Bulk Campaigns so the "no agents yet" path is
 * handled once. Agents come from the local agent store, and the component says
 * so rather than implying a server-side roster.
 */
export function AgentSelector({
  value,
  onChange,
  emptyMessage = "Create an agent before enabling instant calling.",
}: {
  value?: string;
  onChange: (agent: { id: string; name: string } | undefined) => void;
  emptyMessage?: string;
}) {
  const { agents, ready } = useAgents();

  if (!ready) {
    return <div className="h-24 rounded-lg border border-line bg-surface-muted/50" />;
  }

  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-line-strong px-4 py-4">
        <div className="flex items-start gap-2.5">
          <Bot className="mt-0.5 size-4 shrink-0 text-ink-subtle" strokeWidth={1.75} aria-hidden="true" />
          <p className="text-xs leading-relaxed text-ink-muted text-pretty">{emptyMessage}</p>
        </div>
        <ActionLink href="/dashboard/agents/create" size="sm">
          <Plus className="size-4" aria-hidden="true" /> Create Agent
        </ActionLink>
      </div>
    );
  }

  return (
    <div role="radiogroup" aria-label="Select agent" className="grid gap-2 sm:grid-cols-2">
      {agents.map((agent) => {
        const selected = agent.id === value;
        return (
          <button
            key={agent.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(selected ? undefined : { id: agent.id, name: agent.name })}
            className={cn(
              "rounded-lg border p-3 text-left transition-colors",
              selected
                ? "border-accent-soft bg-accent-wash"
                : "border-line bg-surface hover:border-line-strong hover:bg-surface-muted/50",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="truncate text-sm font-medium text-ink">{agent.name}</span>
              <StatusBadge status={agent.status} />
            </div>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-muted">
              {agent.purpose || "No purpose described."}
            </p>
            <p className="mt-1.5 text-[0.6875rem] text-ink-subtle">
              {agent.role} · {agent.language}
            </p>
          </button>
        );
      })}
    </div>
  );
}

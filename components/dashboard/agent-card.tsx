"use client";

import Link from "next/link";
import { Bot, Cpu, Globe, Trash2 } from "lucide-react";
import type { Agent } from "@/lib/agents/store";
import { providerLabel, templateById } from "@/lib/agents/templates";
import { StatusBadge } from "./ui/status-badge";

/** Summary tile for one agent in the My Agents grid. */
export function AgentCard({ agent, onDelete }: { agent: Agent; onDelete?: () => void }) {
  const template = templateById(agent.config?.template ?? "");
  const model = agent.config?.llmProvider ? providerLabel(agent.config.llmProvider) : "No model";

  return (
    <Link
      href={`/dashboard/agents/${agent.id}`}
      className="group flex flex-col rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong hover:bg-surface-muted/40 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-muted text-ink">
          <Bot className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div className="flex items-center gap-1.5">
          <StatusBadge status={agent.status} dot={agent.status === "Live"} />
          {onDelete && (
            <button
              type="button"
              aria-label={`Delete ${agent.name}`}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onDelete();
              }}
              className="rounded-md p-1.5 text-ink-subtle opacity-0 transition-all group-hover:opacity-100 hover:bg-danger-soft hover:text-danger focus-visible:opacity-100"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <h3 className="mt-3.5 truncate text-sm font-semibold text-ink">{agent.name}</h3>
      <p className="mt-1 line-clamp-2 min-h-9 text-xs leading-relaxed text-ink-muted text-pretty">
        {agent.purpose || "No purpose described yet."}
      </p>

      <dl className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line pt-3 text-xs text-ink-subtle">
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Template</dt>
          <dd>{template ? template.name : agent.role}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <Cpu className="size-3.5" aria-hidden="true" />
          <dt className="sr-only">Model</dt>
          <dd>{model}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <Globe className="size-3.5" aria-hidden="true" />
          <dt className="sr-only">Language</dt>
          <dd>{agent.config?.primaryLanguage ?? agent.language}</dd>
        </div>
      </dl>
    </Link>
  );
}

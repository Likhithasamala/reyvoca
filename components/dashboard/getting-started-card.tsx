"use client";

import Link from "next/link";
import { ArrowRight, Bot, Plus } from "lucide-react";
import { useAgents } from "@/lib/agents/store";
import { ActionLink } from "./ui/action";

/**
 * The first thing a new workspace sees. "Start Free" now lands people straight
 * here, so creating an agent has to be the obvious next step.
 *
 * Once an agent exists the card steps back to a quiet summary row.
 */
export function GettingStartedCard() {
  const { agents, ready } = useAgents();

  // The prompt is the default, including on the server render where stored
  // agents are not yet readable. A new workspace therefore sees the full card
  // on first paint rather than an empty placeholder.
  if (ready && agents.length > 0) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-muted text-ink">
            <Bot className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">
              {agents.length} {agents.length === 1 ? "agent" : "agents"} in this workspace
            </p>
            <p className="truncate text-xs text-ink-muted">
              Review the conversation setup, then prepare the agent for calling.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ActionLink href="/dashboard/agents" variant="secondary" size="sm">
            My Agents
          </ActionLink>
          <ActionLink href="/dashboard/agents/create" size="sm">
            <Plus className="size-4" aria-hidden="true" /> Create Agent
          </ActionLink>
        </div>
      </div>
    );
  }

  return (
    <section className="relative isolate overflow-hidden rounded-2xl bg-night px-5 py-6 sm:px-7 sm:py-7">
      <div aria-hidden="true" className="night-glow absolute inset-x-0 top-0 -z-10 h-40" />
      <p className="text-[0.6875rem] font-semibold tracking-[0.1em] text-accent-glow uppercase">Get started</p>
      <h2 className="mt-2.5 text-lg font-semibold tracking-tight text-white sm:text-xl">
        Create your first Reyvoca agent
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-night-text text-pretty">
        Set up your agent, test the conversation and prepare it for calling.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard/agents/create"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
        >
          <Plus className="size-4" aria-hidden="true" /> Create Agent
        </Link>
        <Link
          href="/docs/quickstart"
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-night-text transition-colors hover:text-white"
        >
          Read the quickstart
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

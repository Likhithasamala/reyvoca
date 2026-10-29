"use client";

import { AudioLines, MessagesSquare, PhoneIncoming, PhoneOutgoing, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  conversationDirections,
  conversationRows,
  leadAgents,
  leadOutcomes,
  type ConversationRow,
} from "@/config/dashboard-demo";
import { DataTable, type Column } from "@/components/dashboard/ui/data-table";
import { DemoTag } from "@/components/dashboard/ui/demo-tag";
import { EmptyState } from "@/components/dashboard/ui/empty-state";
import { Notice } from "@/components/dashboard/ui/notice";
import { PageHeader } from "@/components/dashboard/ui/page-header";
import { SearchFilterBar } from "@/components/dashboard/ui/search-filter-bar";
import { SectionCard } from "@/components/dashboard/ui/section-card";
import { StatusBadge } from "@/components/dashboard/ui/status-badge";
import { cn } from "@/lib/cn";

export function ConversationsView() {
  const [search, setSearch] = useState("");
  const [direction, setDirection] = useState<string>(conversationDirections[0]);
  const [outcome, setOutcome] = useState<string>(leadOutcomes[0]);
  const [agent, setAgent] = useState<string>(leadAgents[0]);
  const [selected, setSelected] = useState<ConversationRow | null>(null);

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return conversationRows.filter((row) => {
      if (needle && !`${row.contact} ${row.agent}`.toLowerCase().includes(needle)) return false;
      if (direction !== conversationDirections[0] && row.direction !== direction) return false;
      if (outcome !== leadOutcomes[0] && row.outcome !== outcome) return false;
      if (agent !== leadAgents[0] && row.agent !== agent) return false;
      return true;
    });
  }, [search, direction, outcome, agent]);

  const columns: Column<ConversationRow>[] = [
    {
      key: "contact",
      header: "Contact",
      rowHeader: true,
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelected(row)}
          className="text-left font-medium text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ink"
        >
          {row.contact}
        </button>
      ),
    },
    { key: "agent", header: "Agent", hideBelow: "md", render: (row) => row.agent },
    {
      key: "channel",
      header: "Channel",
      hideBelow: "lg",
      render: (row) => <StatusBadge status={row.channel} tone="neutral" />,
    },
    {
      key: "direction",
      header: "Direction",
      hideBelow: "lg",
      render: (row) => (
        <span className="inline-flex items-center gap-1.5">
          {row.direction === "Inbound" ? (
            <PhoneIncoming className="size-3.5 text-ink-subtle" aria-hidden="true" />
          ) : (
            <PhoneOutgoing className="size-3.5 text-ink-subtle" aria-hidden="true" />
          )}
          {row.direction}
        </span>
      ),
    },
    { key: "duration", header: "Duration", render: (row) => <span className="tabular-nums">{row.duration}</span> },
    { key: "outcome", header: "Outcome", render: (row) => <StatusBadge status={row.outcome} /> },
    { key: "date", header: "Date", hideBelow: "sm", align: "right", render: (row) => row.date },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="AI Conversations"
        description="Review the calls and conversations handled by your agents."
        meta={<DemoTag />}
      />

      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search conversations…"
        filters={[
          { key: "direction", label: "Direction", options: conversationDirections, value: direction, onChange: setDirection },
          { key: "outcome", label: "Outcome", options: leadOutcomes, value: outcome, onChange: setOutcome },
          { key: "agent", label: "Agent", options: leadAgents, value: agent, onChange: setAgent },
        ]}
      />

      {rows.length > 0 ? (
        <DataTable
          caption="AI conversations"
          columns={columns}
          rows={rows}
          footer="Select a contact to preview the conversation detail."
        />
      ) : (
        <EmptyState
          icon={MessagesSquare}
          title="No conversations match these filters"
          description="Clear the search or choose a different direction, outcome or agent."
        />
      )}

      {/* Detail drawer — the shape the real conversation record will take. */}
      <div
        className={cn("fixed inset-0 z-50", !selected && "pointer-events-none")}
        aria-hidden={!selected}
      >
        <div
          className={cn("absolute inset-0 bg-night/40 transition-opacity", selected ? "opacity-100" : "opacity-0")}
          onClick={() => setSelected(null)}
        />
        <div
          inert={!selected}
          role="dialog"
          aria-label="Conversation detail"
          className={cn(
            "absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-y-auto bg-canvas shadow-float transition-transform duration-300",
            selected ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-line bg-canvas/95 px-5 py-4 backdrop-blur">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{selected?.contact}</p>
              <p className="truncate text-xs text-ink-muted">
                {selected?.agent} · {selected?.date}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Close conversation detail"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
            >
              <X className="size-4" />
            </button>
          </div>

          {selected && (
            <div className="space-y-4 px-5 py-5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={selected.outcome} />
                <span className="text-xs text-ink-subtle tabular-nums">{selected.duration}</span>
                <span className="text-xs text-ink-subtle">{selected.direction}</span>
                <DemoTag />
              </div>

              {selected.campaign && (
                <p className="text-xs text-ink-muted">
                  From campaign <span className="font-medium text-ink">{selected.campaign}</span>
                </p>
              )}

              <SectionCard title="Summary">
                <p className="text-sm leading-relaxed text-ink-muted text-pretty">{selected.summary}</p>
              </SectionCard>

              <SectionCard title="Recording">
                <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-line-strong px-3.5 py-3 text-sm text-ink-muted">
                  <AudioLines className="size-4 shrink-0 text-ink-subtle" aria-hidden="true" />
                  No recording — calls are not being placed yet.
                </div>
              </SectionCard>

              <Notice title="Preview.">
                The full record will show the transcript, extracted information, the phone number and the agent that
                handled the call. It arrives with the calling infrastructure.
              </Notice>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

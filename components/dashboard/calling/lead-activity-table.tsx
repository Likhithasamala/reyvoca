"use client";

import { UserRoundSearch } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable, type Column } from "@/components/panel/data-table";
import { EmptyState } from "@/components/panel/empty-state";
import { SearchFilterBar } from "@/components/panel/search-filter-bar";
import { StatusBadge } from "@/components/panel/status-badge";
import {
  CALL_OUTCOME_LABELS,
  CALL_STATUS_LABELS,
  HUMAN_FOLLOW_UP_LABELS,
  LEAD_SOURCE_LABELS,
  type Lead,
} from "@/types/calling";
import { CallStatusBadge, OutcomeBadge } from "./badges";

const ALL_STATUSES = "All statuses";
const ALL_OUTCOMES = "All outcomes";
const ALL_SOURCES = "All sources";
const ALL_AGENTS = "All agents";

const relativeTime = (iso?: string) => {
  if (!iso) return "—";
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { dateStyle: "medium" });
};

/**
 * Instant lead activity.
 *
 * Filtering runs over the rows already on the page, so it works without a
 * backend. Selecting a row opens the lead detail the caller provides.
 */
export function LeadActivityTable({
  leads,
  onSelect,
}: {
  leads: Lead[];
  onSelect?: (lead: Lead) => void;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL_STATUSES);
  const [outcome, setOutcome] = useState(ALL_OUTCOMES);
  const [source, setSource] = useState(ALL_SOURCES);
  const [agent, setAgent] = useState(ALL_AGENTS);

  const options = useMemo(() => {
    const unique = <T,>(values: T[]) => [...new Set(values)];
    return {
      statuses: [ALL_STATUSES, ...unique(leads.map((lead) => CALL_STATUS_LABELS[lead.status]))],
      outcomes: [
        ALL_OUTCOMES,
        ...unique(leads.filter((lead) => lead.outcome).map((lead) => CALL_OUTCOME_LABELS[lead.outcome!])),
      ],
      sources: [ALL_SOURCES, ...unique(leads.map((lead) => LEAD_SOURCE_LABELS[lead.source]))],
      agents: [ALL_AGENTS, ...unique(leads.map((lead) => lead.agentName).filter(Boolean) as string[])],
    };
  }, [leads]);

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return leads.filter((lead) => {
      if (needle && !`${lead.name ?? ""} ${lead.phone} ${lead.requirement ?? ""}`.toLowerCase().includes(needle))
        return false;
      if (status !== ALL_STATUSES && CALL_STATUS_LABELS[lead.status] !== status) return false;
      if (outcome !== ALL_OUTCOMES && (!lead.outcome || CALL_OUTCOME_LABELS[lead.outcome] !== outcome)) return false;
      if (source !== ALL_SOURCES && LEAD_SOURCE_LABELS[lead.source] !== source) return false;
      if (agent !== ALL_AGENTS && lead.agentName !== agent) return false;
      return true;
    });
  }, [leads, search, status, outcome, source, agent]);

  const columns: Column<Lead>[] = [
    {
      key: "lead",
      header: "Lead",
      rowHeader: true,
      render: (lead) => (
        <div className="min-w-0">
          {onSelect ? (
            <button
              type="button"
              onClick={() => onSelect(lead)}
              className="max-w-full truncate text-left font-medium text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ink"
            >
              {lead.name ?? "Unnamed lead"}
            </button>
          ) : (
            <span className="font-medium text-ink">{lead.name ?? "Unnamed lead"}</span>
          )}
          {lead.needsHuman && (
            <span className="mt-1 block">
              <StatusBadge status="Needs Human" tone="attention" />
            </span>
          )}
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      hideBelow: "lg",
      render: (lead) => <span className="font-mono text-xs tabular-nums">{lead.phone || "—"}</span>,
    },
    { key: "source", header: "Source", hideBelow: "lg", render: (lead) => LEAD_SOURCE_LABELS[lead.source] },
    { key: "agent", header: "Agent", hideBelow: "md", render: (lead) => lead.agentName ?? "—" },
    { key: "received", header: "Received", hideBelow: "lg", render: (lead) => relativeTime(lead.createdAt) },
    { key: "status", header: "Call Status", render: (lead) => <CallStatusBadge status={lead.status} /> },
    {
      key: "outcome",
      header: "Outcome",
      hideBelow: "sm",
      render: (lead) => (lead.outcome ? <OutcomeBadge outcome={lead.outcome} /> : <span>—</span>),
    },
    {
      key: "nextAction",
      header: "Next Action",
      align: "right",
      render: (lead) => (
        <span className="text-xs">
          {lead.needsHuman ? HUMAN_FOLLOW_UP_LABELS[lead.needsHuman] : (lead.nextAction ?? "—")}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search leads…"
        filters={[
          { key: "status", label: "Status", options: options.statuses, value: status, onChange: setStatus },
          { key: "outcome", label: "Outcome", options: options.outcomes, value: outcome, onChange: setOutcome },
          { key: "source", label: "Source", options: options.sources, value: source, onChange: setSource },
          { key: "agent", label: "Agent", options: options.agents, value: agent, onChange: setAgent },
        ]}
      />

      {rows.length > 0 ? (
        <DataTable
          caption="Recent instant leads"
          columns={columns}
          rows={rows}
          footer={`${rows.length} of ${leads.length} leads`}
        />
      ) : (
        <EmptyState
          icon={UserRoundSearch}
          title="No leads match these filters"
          description="Clear the search or choose a different status, outcome, source or agent."
        />
      )}
    </div>
  );
}

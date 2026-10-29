"use client";

import { CalendarCheck, Target, UserRound, UserRoundCheck, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable, type Column } from "@/components/dashboard/ui/data-table";
import { DemoTag } from "@/components/dashboard/ui/demo-tag";
import { EmptyState } from "@/components/dashboard/ui/empty-state";
import { MetricCard, type Metric } from "@/components/dashboard/ui/metric-card";
import { PageHeader } from "@/components/dashboard/ui/page-header";
import { SearchFilterBar } from "@/components/dashboard/ui/search-filter-bar";
import { StatusBadge } from "@/components/dashboard/ui/status-badge";
import { OutcomeBadge } from "@/components/dashboard/calling/badges";
import { demoLeads } from "@/lib/calling/demo-data";
import { leadService } from "@/lib/calling/lead-service";
import {
  CALL_OUTCOME_LABELS,
  HUMAN_FOLLOW_UP_LABELS,
  LEAD_CHANNEL_LABELS,
  type Lead,
} from "@/types/calling";

const ALL_CHANNELS = "All channels";
const ALL_OUTCOMES = "All outcomes";
const ALL_AGENTS = "All agents";
const ALL_DATES = "All time";

const CHANNELS = [ALL_CHANNELS, "Instant", "Bulk", "Inbound"];
const DATES = [ALL_DATES, "Today", "Last 7 days", "Last 30 days"];

const DATE_WINDOWS: Record<string, number> = {
  Today: 1,
  "Last 7 days": 7,
  "Last 30 days": 30,
};

const formatDateTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "—";

/**
 * Leads & Results — one table for every channel.
 *
 * Instant Leads and Bulk Campaigns both write the same normalised Lead through
 * `leadService`, so this page reads one source rather than stitching two
 * together. The channel column is what tells them apart.
 */
export function ResultsView() {
  const { value: storedLeads, ready } = leadService.useLeads();
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState(ALL_CHANNELS);
  const [outcome, setOutcome] = useState(ALL_OUTCOMES);
  const [agent, setAgent] = useState(ALL_AGENTS);
  // Stored together: the cutoff is resolved in the change handler so the
  // filtering memo stays pure.
  const [dateFilter, setDateFilter] = useState({ label: ALL_DATES, cutoff: 0 });

  function changeDate(label: string) {
    const days = DATE_WINDOWS[label];
    setDateFilter({ label, cutoff: days ? Date.now() - days * 86_400_000 : 0 });
  }

  // Leads created in this browser sit above the seeded examples.
  const leads = useMemo(() => [...storedLeads, ...demoLeads], [storedLeads]);

  const options = useMemo(() => {
    const unique = (values: (string | undefined)[]) => [...new Set(values.filter(Boolean) as string[])];
    return {
      outcomes: [
        ALL_OUTCOMES,
        ...unique(leads.map((lead) => (lead.outcome ? CALL_OUTCOME_LABELS[lead.outcome] : undefined))),
      ],
      agents: [ALL_AGENTS, ...unique(leads.map((lead) => lead.agentName))],
    };
  }, [leads]);

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return leads.filter((lead) => {
      if (needle && !`${lead.name ?? ""} ${lead.phone} ${lead.requirement ?? ""}`.toLowerCase().includes(needle))
        return false;
      if (channel !== ALL_CHANNELS && LEAD_CHANNEL_LABELS[lead.channel] !== channel) return false;
      if (outcome !== ALL_OUTCOMES && (!lead.outcome || CALL_OUTCOME_LABELS[lead.outcome] !== outcome)) return false;
      if (agent !== ALL_AGENTS && lead.agentName !== agent) return false;
      if (dateFilter.cutoff && new Date(lead.createdAt).getTime() < dateFilter.cutoff) return false;
      return true;
    });
  }, [leads, search, channel, outcome, agent, dateFilter]);

  const metrics: Metric[] = useMemo(() => {
    const count = (predicate: (lead: Lead) => boolean) => leads.filter(predicate).length;
    return [
      { label: "Total Leads", value: String(leads.length), icon: Users },
      { label: "Qualified", value: String(count((lead) => lead.outcome === "qualified")), icon: Target },
      { label: "Callbacks", value: String(count((lead) => lead.outcome === "callback")), icon: CalendarCheck },
      { label: "Interested", value: String(count((lead) => lead.outcome === "interested")), icon: UserRoundCheck },
      { label: "Needs Human", value: String(count((lead) => Boolean(lead.needsHuman))), icon: UserRound },
    ];
  }, [leads]);

  const columns: Column<Lead>[] = [
    {
      key: "lead",
      header: "Lead",
      rowHeader: true,
      render: (lead) => (
        <div className="min-w-0">
          <span className="block truncate font-medium text-ink">{lead.name ?? "Unnamed lead"}</span>
          {lead.needsHuman && (
            <span className="mt-1 block" title={HUMAN_FOLLOW_UP_LABELS[lead.needsHuman]}>
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
    { key: "agent", header: "Agent", hideBelow: "md", render: (lead) => lead.agentName ?? "—" },
    {
      key: "channel",
      header: "Channel",
      hideBelow: "sm",
      render: (lead) => <StatusBadge status={LEAD_CHANNEL_LABELS[lead.channel]} tone="neutral" />,
    },
    {
      key: "outcome",
      header: "Outcome",
      render: (lead) => (lead.outcome ? <OutcomeBadge outcome={lead.outcome} /> : <span>—</span>),
    },
    {
      key: "lastCall",
      header: "Last Call",
      hideBelow: "lg",
      render: (lead) => <span className="text-xs">{formatDateTime(lead.lastCallAt)}</span>,
    },
    {
      key: "nextAction",
      header: "Next Action",
      align: "right",
      render: (lead) => <span className="text-xs">{lead.nextAction ?? "—"}</span>,
    },
  ];

  if (!ready) {
    return <div className="mx-auto h-96 max-w-6xl rounded-xl border border-line bg-surface-muted/50" />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Leads & Results"
        description="See every contact your agents spoke with and what happened. Instant Leads, Bulk Campaigns and Inbound all land here."
        meta={<DemoTag label="Includes demo data" />}
      />

      <section>
        <h2 className="sr-only">Lead summary</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </div>
      </section>

      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search leads…"
        filters={[
          { key: "channel", label: "Channel", options: CHANNELS, value: channel, onChange: setChannel },
          { key: "outcome", label: "Outcome", options: options.outcomes, value: outcome, onChange: setOutcome },
          { key: "agent", label: "Agent", options: options.agents, value: agent, onChange: setAgent },
          { key: "date", label: "Date", options: DATES, value: dateFilter.label, onChange: changeDate },
        ]}
      />

      {rows.length > 0 ? (
        <DataTable
          caption="Leads and results"
          columns={columns}
          rows={rows}
          footer={`${rows.length} of ${leads.length} leads · one record per contact, whichever channel called them.`}
        />
      ) : (
        <EmptyState
          icon={UserRoundCheck}
          title="No leads match these filters"
          description="Clear the search or choose a different channel, outcome, agent or date range."
        />
      )}
    </div>
  );
}

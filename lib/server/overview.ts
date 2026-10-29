/**
 * Dashboard overview figures for one workspace.
 *
 * Shared by the `GET /api/dashboard/overview` route handler and by the
 * dashboard home page's server render, so both always report the same numbers.
 *
 * Every figure here is counted from stored records. Telephony is not connected
 * yet, so a workspace that has only been set up reports agents, leads and
 * campaigns with no call durations behind them — which is the honest picture.
 */
import type { ActivityRow, CallDirection, OverviewPayload } from "@/types";
import { CALL_OUTCOME_LABELS, CALL_STATUS_LABELS } from "@/types/calling";
import type { Lead } from "@/types/calling";
import { read, type StoredCall } from "./db";

/** Which workspace to report on, and what to call it in the UI. */
export type OverviewScope = {
  workspaceId: string;
  workspace: string;
};

const RECENT_ROWS = 5;

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * Fixed locale: this is rendered on the server, so it must not vary by host.
 * Anything older than today carries its date, so a week-old lead does not read
 * as this morning's call.
 */
function formatWhen(iso: string): string {
  const at = new Date(iso);
  const time = at.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const today = new Date();
  const sameDay =
    at.getFullYear() === today.getFullYear() &&
    at.getMonth() === today.getMonth() &&
    at.getDate() === today.getDate();
  if (sameDay) return time;
  return `${at.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${time}`;
}

/** Inbound leads were called by the contact; every other channel calls out. */
const directionOf = (lead: Lead): CallDirection =>
  lead.channel === "inbound" ? "Inbound" : "Outbound";

/** A completed call: duration and outcome are both known. */
const callRow = (call: StoredCall): ActivityRow => ({
  id: call.id,
  contact: call.customer,
  agent: call.agent,
  direction: "Outbound",
  duration: formatDuration(call.durationSeconds),
  outcome: call.outcome,
  time: formatWhen(call.startedAt),
});

/**
 * A lead that has not produced a timed call yet.
 *
 * The duration is an em dash rather than a zero: no call has been placed, and
 * "0:00" would read as one that failed instantly.
 */
const leadRow = (lead: Lead): ActivityRow => ({
  id: lead.id,
  contact: lead.name ?? lead.phone,
  agent: lead.agentName ?? "Unassigned",
  direction: directionOf(lead),
  duration: "—",
  outcome: lead.outcome ? CALL_OUTCOME_LABELS[lead.outcome] : CALL_STATUS_LABELS[lead.status],
  time: formatWhen(lead.lastCallAt ?? lead.createdAt),
});

export async function getOverview({ workspaceId, workspace }: OverviewScope): Promise<OverviewPayload> {
  const { agents, leads, campaigns, calls } = await read((db) => ({
    agents: db.agents.filter((agent) => agent.workspaceId === workspaceId),
    leads: db.leads.filter((lead) => lead.workspaceId === workspaceId),
    campaigns: db.campaigns.filter((campaign) => campaign.workspaceId === workspaceId),
    // Calls are keyed by account id, which is the workspace id for a
    // signed-in account (see `currentWorkspaceId`).
    calls: db.calls.filter((call) => call.userId === workspaceId),
  }));

  const qualifiedLeads = leads.filter(
    (lead) => lead.outcome === "qualified" || lead.outcome === "meeting_booked",
  ).length;
  const callbacks = leads.filter((lead) => lead.outcome === "callback" || lead.callbackAt).length;

  // Real conversations first, then leads still waiting on one, newest first
  // within each group.
  const recentActivity = [
    ...[...calls].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).map(callRow),
    ...[...leads]
      .sort((a, b) => (b.lastCallAt ?? b.createdAt).localeCompare(a.lastCallAt ?? a.createdAt))
      .map(leadRow),
  ].slice(0, RECENT_ROWS);

  return {
    hasData: agents.length + leads.length + campaigns.length + calls.length > 0,
    workspace,
    stats: {
      agents: agents.length,
      leads: leads.length,
      qualifiedLeads,
      callbacks,
    },
    recentActivity,
  };
}

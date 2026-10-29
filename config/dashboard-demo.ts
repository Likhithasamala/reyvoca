/**
 * Example data for pages the backend does not serve yet.
 *
 * Nothing here is real, and every page that falls back to it also shows a
 * "Demo data" marker. Numbers are deliberately small and plausible rather than
 * impressive.
 *
 * Agents, leads, campaigns and the dashboard home read the API instead
 * (`app/api/*`); what remains here backs the analytics and conversation views,
 * which have no endpoint behind them, and the empty-workspace state of the
 * dashboard home.
 */
import { Bot, CalendarCheck, Clock, PhoneCall, Target, UserRoundCheck } from "lucide-react";
import type { Metric } from "@/components/dashboard/ui/metric-card";
import type { ActivityRow, CallDirection } from "@/types";

// The workspace identity is no longer here: it is resolved from the session on
// the server (`lib/server/workspace.ts`), so the chrome shows the real account
// when one is signed in.

/* ------------------------------------------------------------------ */
/* Dashboard home                                                      */
/* ------------------------------------------------------------------ */

export const homeMetrics: Metric[] = [
  { label: "Agents", value: "2", icon: Bot },
  { label: "Calls Today", value: "24", icon: PhoneCall },
  { label: "Qualified Leads", value: "8", icon: Target },
  { label: "Callbacks", value: "3", icon: CalendarCheck },
];

export type Direction = CallDirection;

/**
 * Fallback rows for the dashboard home, shown only while the workspace has
 * nothing of its own. Live rows come from `GET /api/dashboard/overview`.
 */
export const recentActivity: ActivityRow[] = [
  { id: "a1", contact: "Sarah M.", agent: "Sales Agent", direction: "Outbound", duration: "02:14", outcome: "Qualified", time: "10:32 AM" },
  { id: "a2", contact: "John K.", agent: "Renewal Agent", direction: "Outbound", duration: "01:48", outcome: "Callback", time: "9:45 AM" },
  { id: "a3", contact: "Priya N.", agent: "Sales Agent", direction: "Inbound", duration: "03:05", outcome: "Interested", time: "9:12 AM" },
  { id: "a4", contact: "Daniel O.", agent: "Sales Agent", direction: "Outbound", duration: "00:41", outcome: "Not Interested", time: "8:58 AM" },
  { id: "a5", contact: "Aisha R.", agent: "Renewal Agent", direction: "Outbound", duration: "00:12", outcome: "No Answer", time: "8:40 AM" },
];

/* ------------------------------------------------------------------ */
/* Leads & Results                                                     */
/* ------------------------------------------------------------------ */

/**
 * Leads & Results now reads the normalised Lead model from
 * `lib/calling/demo-data.ts`, so both calling channels feed one table. Only the
 * filter option lists are still shared with AI Conversations.
 */
export const leadOutcomes = [
  "All outcomes",
  "Qualified",
  "Interested",
  "Meeting Booked",
  "Callback",
  "Not Interested",
  "No Answer",
] as const;
export const leadAgents = ["All agents", "Sales Agent", "Renewal Agent"] as const;

/* ------------------------------------------------------------------ */
/* AI Conversations                                                    */
/* ------------------------------------------------------------------ */

export type ConversationRow = {
  id: string;
  contact: string;
  agent: string;
  /** Which calling module produced this conversation. */
  channel: "Instant" | "Bulk" | "Inbound";
  campaign?: string;
  direction: Direction;
  duration: string;
  outcome: string;
  date: string;
  /** Short recap shown in the detail panel. */
  summary: string;
};

export const conversationRows: ConversationRow[] = [
  { id: "c1", contact: "Sarah M.", agent: "Sales Agent", channel: "Instant", direction: "Outbound", duration: "02:14", outcome: "Qualified", date: "Today, 10:32 AM", summary: "Confirmed budget and timeline, booked a product demo for Thursday." },
  { id: "c2", contact: "John K.", agent: "Renewal Agent", channel: "Bulk", campaign: "Renewal follow-up (example)", direction: "Outbound", duration: "01:48", outcome: "Callback", date: "Today, 9:45 AM", summary: "Asked to be called back after 4 PM to discuss renewal pricing." },
  { id: "c3", contact: "Priya N.", agent: "Sales Agent", channel: "Inbound", direction: "Inbound", duration: "03:05", outcome: "Interested", date: "Today, 9:12 AM", summary: "Wanted pricing for a 20-seat team; asked for a written summary by email." },
  { id: "c4", contact: "Daniel O.", agent: "Sales Agent", channel: "Bulk", campaign: "Renewal follow-up (example)", direction: "Outbound", duration: "00:41", outcome: "Not Interested", date: "Today, 8:58 AM", summary: "Already using another provider; asked not to be contacted again." },
];

export const conversationDirections = ["All directions", "Inbound", "Outbound"] as const;

/* ------------------------------------------------------------------ */
/* Performance                                                         */
/* ------------------------------------------------------------------ */

export const performanceMetrics: Metric[] = [
  { label: "Calls", value: "128", icon: PhoneCall },
  { label: "Connected", value: "94", icon: UserRoundCheck },
  { label: "Avg. Duration", value: "01:52", icon: Clock },
  { label: "Qualified", value: "22", icon: Target },
  { label: "Callbacks", value: "11", icon: CalendarCheck },
  { label: "Conversion Rate", value: "17%", icon: Bot },
];

/** Calls per day across the last 7 days — example series for the bar chart. */
export const performanceSeries = [
  { day: "Mon", calls: 14 },
  { day: "Tue", calls: 22 },
  { day: "Wed", calls: 18 },
  { day: "Thu", calls: 26 },
  { day: "Fri", calls: 24 },
  { day: "Sat", calls: 9 },
  { day: "Sun", calls: 15 },
];

/** Outcome split for the last 7 days. Values are counts, not percentages. */
export const performanceOutcomes = [
  { label: "Qualified", value: 22 },
  { label: "Interested", value: 19 },
  { label: "Callback", value: 11 },
  { label: "Not Interested", value: 26 },
  { label: "No Answer", value: 16 },
];

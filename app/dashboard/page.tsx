import { Bot, CalendarCheck, PhoneIncoming, PhoneOutgoing, Target, Users } from "lucide-react";
import { homeMetrics, recentActivity as exampleActivity } from "@/config/dashboard-demo";
import { GettingStartedCard } from "@/components/dashboard/getting-started-card";
import { ActionLink } from "@/components/dashboard/ui/action";
import { DataTable, type Column } from "@/components/dashboard/ui/data-table";
import { DemoTag } from "@/components/dashboard/ui/demo-tag";
import { MetricCard, type Metric } from "@/components/dashboard/ui/metric-card";
import { PageHeader } from "@/components/dashboard/ui/page-header";
import { SectionCard } from "@/components/dashboard/ui/section-card";
import { StatusBadge } from "@/components/dashboard/ui/status-badge";
import { getOverview } from "@/lib/server/overview";
import { currentWorkspace } from "@/lib/server/workspace";
import type { ActivityRow } from "@/types";

export const metadata = { title: "Dashboard" };

const columns: Column<ActivityRow>[] = [
  { key: "contact", header: "Contact", rowHeader: true, render: (row) => row.contact },
  { key: "agent", header: "Agent", hideBelow: "md", render: (row) => row.agent },
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
  { key: "time", header: "Time", hideBelow: "sm", align: "right", render: (row) => <span className="tabular-nums">{row.time}</span> },
];

/**
 * Dashboard home.
 *
 * Reads the workspace straight from the backend on the server — the same
 * `getOverview` the `/api/dashboard/overview` endpoint serves, so the page and
 * the API can never disagree. A workspace with nothing stored falls back to
 * example figures, marked as such.
 */
export default async function DashboardHomePage() {
  const { id, name } = await currentWorkspace();
  const overview = await getOverview({ workspaceId: id, workspace: name });
  const { hasData, stats } = overview;

  const metrics: Metric[] = hasData
    ? [
        { label: "Agents", value: String(stats.agents), icon: Bot },
        { label: "Leads", value: String(stats.leads), icon: Users },
        { label: "Qualified Leads", value: String(stats.qualifiedLeads), icon: Target },
        { label: "Callbacks", value: String(stats.callbacks), icon: CalendarCheck },
      ]
    : homeMetrics;

  const rows = hasData ? overview.recentActivity : exampleActivity;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Dashboard"
        description={
          hasData
            ? `Live figures for ${overview.workspace}.`
            : "Monitor your agents, conversations and calling activity."
        }
        meta={hasData ? undefined : <DemoTag />}
      />

      <GettingStartedCard />

      <section>
        <h2 className="sr-only">Today&apos;s figures</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </div>
      </section>

      <SectionCard
        title="Recent conversations"
        description="The latest calls handled by your agents."
        action={
          <ActionLink href="/dashboard/conversations" variant="secondary" size="sm">
            View all
          </ActionLink>
        }
        flush
      >
        <DataTable
          caption="Recent conversations"
          columns={columns}
          rows={rows}
          bare
          footer={
            hasData
              ? "Live from this workspace. Durations appear once calling is connected."
              : "Example rows. Real conversations appear here once calling is connected."
          }
        />
      </SectionCard>
    </div>
  );
}

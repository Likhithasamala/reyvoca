import { demoCalls, demoStats, demoWeeklyCalls } from "@/config/dashboard";
import { DemoBanner } from "@/components/dashboard/demo-banner";
import { RecentCallsTable } from "@/components/dashboard/recent-calls-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { WeeklyCallsChart } from "@/components/dashboard/weekly-calls-chart";

export const metadata = { title: "Overview" };

export default function DashboardOverviewPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Overview</h1>
        <p className="mt-1 text-sm text-ink-muted">Today across all agents.</p>
      </div>
      <DemoBanner />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {demoStats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.7fr]">
        <WeeklyCallsChart data={demoWeeklyCalls} />
        <RecentCallsTable calls={demoCalls} />
      </div>
    </div>
  );
}

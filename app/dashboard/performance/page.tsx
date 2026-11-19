import { performanceMetrics, performanceOutcomes, performanceSeries } from "@/config/dashboard-demo";
import { BarChart, BreakdownList } from "@/components/panel/bar-chart";
import { DemoTag } from "@/components/panel/demo-tag";
import { MetricCard } from "@/components/panel/metric-card";
import { PageHeader } from "@/components/panel/page-header";
import { SectionCard } from "@/components/panel/section-card";

export const metadata = { title: "Performance" };

export default function PerformancePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Performance"
        description="Understand how your voice agents are performing."
        meta={<DemoTag label="Demo analytics" />}
      />

      <section>
        <h2 className="sr-only">Headline figures</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {performanceMetrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <SectionCard title="Calls over time" description="Last 7 days.">
          <BarChart
            data={performanceSeries.map((point) => ({ label: point.day, value: point.calls }))}
            label="Calls per day over the last 7 days"
          />
        </SectionCard>

        <SectionCard title="Outcomes" description="How those calls ended.">
          <BreakdownList
            data={performanceOutcomes.map((outcome) => ({ label: outcome.label, value: outcome.value }))}
            label="Call outcomes over the last 7 days"
          />
        </SectionCard>
      </div>

      <p className="text-xs text-ink-subtle">
        Example analytics. Agent-level performance, call duration and lead conversion reporting arrive once calls are
        being recorded.
      </p>
    </div>
  );
}

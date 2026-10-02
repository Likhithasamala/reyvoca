import { Bell, Search } from "lucide-react";
import { productExperience } from "@/config/marketing";
import { dashboardNav, demoCalls, demoStats, demoWeeklyCalls, demoWorkspace } from "@/config/dashboard";
import { Container } from "@/components/ui/container";
import { LogoMark } from "@/components/ui/logo";
import { RecentCallsTable } from "@/components/dashboard/recent-calls-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { WeeklyCallsChart } from "@/components/dashboard/weekly-calls-chart";
import { cn } from "@/lib/cn";

export function ProductExperience() {
  return (
    <section aria-labelledby="platform-heading" className="relative isolate overflow-hidden bg-navy py-24 lg:py-32">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(50%_60%_at_50%_0%,rgb(37_99_235/0.35),transparent)]"
      />
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold tracking-[0.08em] text-brand-bright uppercase">{productExperience.eyebrow}</p>
          <h2 id="platform-heading" className="mt-4 text-h2 font-semibold text-white text-balance">
            {productExperience.title}
          </h2>
          <p className="mt-5 text-lead text-slate-300 text-pretty">{productExperience.description}</p>
        </div>

        {/* Browser-framed workspace mockup */}
        <div className="reveal mt-14 overflow-hidden rounded-2xl border border-white/10 bg-white shadow-[0_40px_120px_-30px_rgb(37_99_235/0.55)] lg:mt-20">
          <div className="flex items-center gap-3 border-b border-line bg-surface-muted px-4 py-3">
            <div aria-hidden="true" className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-line-strong" />
              <span className="size-2.5 rounded-full bg-line-strong" />
              <span className="size-2.5 rounded-full bg-line-strong" />
            </div>
            <div className="mx-auto w-full max-w-sm truncate rounded-md border border-line bg-white px-3 py-1 text-center text-xs text-ink-subtle">
              Reyvoca · Workspace overview
            </div>
            <span className="hidden rounded-full bg-brand-softer px-2 py-0.5 text-[0.6875rem] font-medium text-brand sm:inline">
              Preview · demo data
            </span>
          </div>

          <div className="flex">
            <aside aria-label="Preview navigation" className="hidden w-52 shrink-0 border-r border-line bg-white p-3 md:block">
              <div className="flex items-center gap-2 px-2 py-2">
                <LogoMark className="size-6" />
                <span className="text-sm font-semibold text-ink">{demoWorkspace.name}</span>
              </div>
              <ul className="mt-3 space-y-0.5">
                {dashboardNav.map(({ label, icon: Icon }, index) => (
                  <li
                    key={label}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[0.8125rem]",
                      index === 0 ? "bg-brand-softer font-medium text-brand" : "text-ink-muted",
                    )}
                  >
                    <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
                    {label}
                  </li>
                ))}
              </ul>
            </aside>

            <div className="min-w-0 flex-1 bg-surface-muted p-4 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-ink">Overview</p>
                  <p className="text-xs text-ink-subtle">Today across all agents</p>
                </div>
                <div aria-hidden="true" className="flex items-center gap-2 text-ink-subtle">
                  <span className="hidden items-center gap-2 rounded-lg border border-line bg-white px-3 py-1.5 text-xs sm:flex">
                    <Search className="size-3.5" /> Search calls
                  </span>
                  <span className="flex size-8 items-center justify-center rounded-lg border border-line bg-white">
                    <Bell className="size-3.5" />
                  </span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
                {demoStats.map((stat) => (
                  <StatCard key={stat.label} stat={stat} compact />
                ))}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.6fr]">
                <WeeklyCallsChart data={demoWeeklyCalls} className="hidden lg:block" />
                <RecentCallsTable calls={demoCalls.slice(0, 4)} compact />
              </div>
            </div>
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-slate-400">
          Interface preview with illustrative data. The Reyvoca workspace is in development.
        </p>
      </Container>
    </section>
  );
}

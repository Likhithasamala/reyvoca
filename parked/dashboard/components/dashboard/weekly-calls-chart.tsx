import { cn } from "@/lib/cn";

type WeeklyCallsChartProps = {
  data: { day: string; calls: number }[];
  className?: string;
  title?: string;
};

/** Single-series bar chart: neutral bars, the latest day highlighted in the ember accent. */
export function WeeklyCallsChart({ data, className, title = "Calls this week" }: WeeklyCallsChartProps) {
  // Guard against a zero max (a week with no calls), which would divide by zero.
  const max = Math.max(1, ...data.map((d) => d.calls));
  return (
    <figure className={cn("rounded-xl border border-line bg-surface p-5", className)}>
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-ink">{title}</span>
        <span className="text-xs text-ink-subtle">Last 7 days</span>
      </figcaption>
      <div className="mt-5 flex h-36 items-end gap-2 border-b border-line sm:gap-3" role="list" aria-label={title}>
        {data.map((d, i) => {
          const latest = i === data.length - 1;
          return (
            <div
              key={d.day}
              role="listitem"
              aria-label={`${d.day}: ${d.calls} calls`}
              title={`${d.day}: ${d.calls} calls`}
              className="group flex h-full flex-1 flex-col items-center justify-end"
            >
              {latest && <span className="mb-1 text-[0.6875rem] font-semibold text-ink tabular-nums">{d.calls}</span>}
              <div
                className={cn(
                  "w-full max-w-7 rounded-t-[4px] transition-colors",
                  latest ? "bg-accent" : "bg-line-strong group-hover:bg-ink-subtle/60",
                )}
                style={{ height: `${(d.calls / max) * 84}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2 sm:gap-3" aria-hidden="true">
        {data.map((d) => (
          <span key={d.day} className="flex-1 text-center text-[0.6875rem] text-ink-subtle">
            {d.day}
          </span>
        ))}
      </div>
    </figure>
  );
}

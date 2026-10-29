import { cn } from "@/lib/cn";

export type BarDatum = { label: string; value: number };

/**
 * Single-series bar chart. Neutral bars with the final column in ember, so the
 * accent marks the most recent period rather than colouring the whole series.
 */
export function BarChart({
  data,
  highlightLast = true,
  valueSuffix = "",
  className,
  label,
}: {
  data: BarDatum[];
  highlightLast?: boolean;
  valueSuffix?: string;
  className?: string;
  label: string;
}) {
  // Floor of 1 keeps the bars finite when every value is zero.
  const max = Math.max(1, ...data.map((datum) => datum.value));

  return (
    <div className={cn("", className)}>
      <div className="flex h-36 items-end gap-2 border-b border-line sm:gap-3" role="list" aria-label={label}>
        {data.map((datum, index) => {
          const highlighted = highlightLast && index === data.length - 1;
          return (
            <div
              key={datum.label}
              role="listitem"
              aria-label={`${datum.label}: ${datum.value}${valueSuffix}`}
              title={`${datum.label}: ${datum.value}${valueSuffix}`}
              className="group flex h-full flex-1 flex-col items-center justify-end"
            >
              {highlighted && (
                <span className="mb-1 text-[0.6875rem] font-semibold text-ink tabular-nums">{datum.value}</span>
              )}
              <div
                className={cn(
                  "w-full max-w-8 rounded-t-[4px] transition-colors",
                  highlighted ? "bg-accent" : "bg-line-strong group-hover:bg-ink-subtle/60",
                )}
                style={{ height: `${(datum.value / max) * 84}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2 sm:gap-3" aria-hidden="true">
        {data.map((datum) => (
          <span key={datum.label} className="flex-1 text-center text-[0.6875rem] text-ink-subtle">
            {datum.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Horizontal breakdown — proportions of a total, one row per category. */
export function BreakdownList({ data, label }: { data: BarDatum[]; label: string }) {
  const total = data.reduce((sum, datum) => sum + datum.value, 0) || 1;
  return (
    <ul className="space-y-3" aria-label={label}>
      {data.map((datum) => {
        const share = Math.round((datum.value / total) * 100);
        return (
          <li key={datum.label}>
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="truncate text-ink-muted">{datum.label}</span>
              <span className="shrink-0 text-ink tabular-nums">
                {datum.value} · {share}%
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-muted">
              <div className="h-full rounded-full bg-ink-subtle/70" style={{ width: `${share}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

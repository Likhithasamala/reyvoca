import type { CampaignProgress as Progress } from "@/types/calling";
import { cn } from "@/lib/cn";

/**
 * Campaign completion.
 *
 * The bar is split into processed / in-flight / remaining rather than one
 * percentage, because an operator cares how much is still moving.
 */
export function CampaignProgressBar({
  progress,
  isDemo = false,
}: {
  progress: Progress;
  /** Labels the figures as example data for the seeded campaign. */
  isDemo?: boolean;
}) {
  const total = Math.max(1, progress.total);
  const processed = progress.completed + progress.failed;
  const percent = Math.round((processed / total) * 100);
  const inFlight = progress.calling;

  const width = (count: number) => `${(count / total) * 100}%`;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-ink">
          <span className="font-semibold tabular-nums">{processed}</span>
          <span className="text-ink-muted"> / {progress.total} processed</span>
        </p>
        <p className="text-sm font-semibold text-ink tabular-nums">{percent}%</p>
      </div>

      <div
        className="mt-2 flex h-2 overflow-hidden rounded-full bg-surface-muted"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Campaign progress"
      >
        <span className="bg-ink transition-[width] duration-500" style={{ width: width(progress.completed) }} />
        <span className="bg-accent transition-[width] duration-500" style={{ width: width(inFlight) }} />
        <span className="bg-line-strong transition-[width] duration-500" style={{ width: width(progress.failed) }} />
      </div>

      <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[0.6875rem] text-ink-subtle">
        {[
          { label: "Completed", count: progress.completed, dot: "bg-ink" },
          { label: "In progress", count: inFlight, dot: "bg-accent" },
          { label: "Could not reach", count: progress.failed, dot: "bg-line-strong" },
          { label: "Remaining", count: progress.queued, dot: "bg-surface-muted border border-line-strong" },
        ].map((item) => (
          <li key={item.label} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={cn("size-1.5 rounded-full", item.dot)} />
            {item.label}
            <span className="font-medium text-ink tabular-nums">{item.count}</span>
          </li>
        ))}
      </ul>

      {isDemo && (
        <p className="mt-2.5 text-[0.6875rem] leading-relaxed text-ink-subtle">
          Example figures. A real campaign shows zero progress until calling is connected.
        </p>
      )}
    </div>
  );
}

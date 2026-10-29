import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type Metric = {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Short qualifier under the value. Never a fabricated trend. */
  note?: string;
};

/** Compact figure tile. Deliberately quiet: one number, one label, one icon. */
export function MetricCard({ metric, className }: { metric: Metric; className?: string }) {
  const { icon: Icon } = metric;
  return (
    <div className={cn("rounded-xl border border-line bg-surface p-4 sm:p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[0.8125rem] font-medium text-ink-muted">{metric.label}</p>
        <Icon className="size-4 shrink-0 text-ink-subtle" strokeWidth={1.75} aria-hidden="true" />
      </div>
      <p className="mt-2.5 text-2xl font-semibold tracking-tight text-ink tabular-nums sm:text-[1.75rem]">
        {metric.value}
      </p>
      {metric.note && <p className="mt-1 text-xs text-ink-subtle">{metric.note}</p>}
    </div>
  );
}

import type { DemoStat } from "@/types";
import { cn } from "@/lib/cn";

export function StatCard({ stat, compact = false }: { stat: DemoStat; compact?: boolean }) {
  const { icon: Icon } = stat;
  return (
    <div className={cn("rounded-xl border border-line bg-white", compact ? "p-3.5" : "p-5")}>
      <div className="flex items-center justify-between gap-2">
        <p className={cn("font-medium text-ink-muted", compact ? "text-xs" : "text-sm")}>{stat.label}</p>
        <Icon className={cn("text-ink-subtle", compact ? "size-3.5" : "size-4")} aria-hidden="true" />
      </div>
      <p className={cn("mt-2 font-semibold tracking-tight text-ink tabular-nums", compact ? "text-xl" : "text-3xl")}>
        {stat.value}
      </p>
      <p className={cn("mt-1 text-success", compact ? "text-[0.6875rem]" : "text-xs")}>{stat.change} vs. yesterday</p>
    </div>
  );
}

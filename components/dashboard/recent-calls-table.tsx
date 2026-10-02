import type { DemoCall } from "@/types";
import { cn } from "@/lib/cn";
import { OutcomeBadge } from "./outcome-badge";

type RecentCallsTableProps = {
  calls: DemoCall[];
  compact?: boolean;
  caption?: string;
};

/** Agent and time columns collapse on narrow screens so the table never overflows. */
export function RecentCallsTable({ calls, compact = false, caption = "Recent calls" }: RecentCallsTableProps) {
  const cell = compact ? "px-3 py-2.5" : "px-4 py-3.5 sm:px-5";
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      <table className={cn("w-full text-left", compact ? "text-xs" : "text-sm")}>
        <caption className={cn("border-b border-line text-left font-semibold text-ink", cell)}>{caption}</caption>
        <thead className="bg-surface-muted text-ink-subtle">
          <tr>
            <th scope="col" className={cn("font-medium", cell)}>Customer</th>
            <th scope="col" className={cn("hidden font-medium md:table-cell", cell)}>Agent</th>
            <th scope="col" className={cn("font-medium", cell)}>Duration</th>
            <th scope="col" className={cn("font-medium", cell)}>Outcome</th>
            <th scope="col" className={cn("hidden font-medium sm:table-cell", cell)}>Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {calls.map((call) => (
            <tr key={call.id}>
              <th scope="row" className={cn("font-medium text-ink", cell)}>{call.customer}</th>
              <td className={cn("hidden text-ink-muted md:table-cell", cell)}>{call.agent}</td>
              <td className={cn("text-ink-muted tabular-nums", cell)}>{call.duration}</td>
              <td className={cell}>
                <OutcomeBadge outcome={call.outcome} />
              </td>
              <td className={cn("hidden text-ink-subtle tabular-nums sm:table-cell", cell)}>{call.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import type { CallOutcome } from "@/types";
import { cn } from "@/lib/cn";

const styles: Record<CallOutcome, string> = {
  Appointment: "bg-brand-softer text-brand border-brand-soft",
  Qualified: "bg-success-soft text-success border-green-200",
  Callback: "bg-warning-soft text-warning border-amber-200",
  "Not interested": "bg-surface-muted text-ink-muted border-line",
  Voicemail: "bg-surface-muted text-ink-muted border-line",
};

export function OutcomeBadge({ outcome }: { outcome: CallOutcome }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap", styles[outcome])}>
      {outcome}
    </span>
  );
}

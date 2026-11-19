import type { CallOutcome } from "@/types";
import { cn } from "@/lib/cn";

const styles: Record<CallOutcome, string> = {
  Appointment: "bg-accent-wash text-accent-strong border-accent-soft",
  Qualified: "bg-success-soft text-success border-success-line",
  Callback: "bg-warning-soft text-warning border-warning-line",
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

import { cn } from "@/lib/cn";

/**
 * Four tones only. Statuses across the dashboard map onto these, so the
 * interface never grows a dozen competing status colours.
 */
export type StatusTone = "neutral" | "accent" | "positive" | "attention";

const toneStyles: Record<StatusTone, string> = {
  neutral: "border-line bg-surface-muted text-ink-muted",
  accent: "border-accent-soft bg-accent-wash text-accent-strong",
  positive: "border-success-line bg-success-soft text-success",
  attention: "border-warning-line bg-warning-soft text-warning",
};

/** Canonical tone for every status label used in the dashboard. */
const statusTones: Record<string, StatusTone> = {
  // Call / lead outcomes
  Qualified: "positive",
  Interested: "accent",
  Callback: "attention",
  "Not Interested": "neutral",
  "No Answer": "neutral",
  Voicemail: "neutral",
  // Agent + campaign states
  Live: "positive",
  Ready: "accent",
  Draft: "neutral",
  Paused: "attention",
  Completed: "positive",
  Scheduled: "accent",
  // Setup states
  Connected: "positive",
  "Not connected": "neutral",
  "Not configured": "neutral",
};

export function StatusBadge({
  status,
  tone,
  dot = false,
  className,
}: {
  status: string;
  /** Overrides the mapped tone when a label is not in the canonical list. */
  tone?: StatusTone;
  /** Shows a leading dot — used for live/running states. */
  dot?: boolean;
  className?: string;
}) {
  const resolved = tone ?? statusTones[status] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        toneStyles[resolved],
        className,
      )}
    >
      {dot && <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />}
      {status}
    </span>
  );
}

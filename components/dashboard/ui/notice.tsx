import { Info } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Neutral explanatory banner. Used to say plainly that a section's controls are
 * a preview of the intended setup, rather than letting them look operational.
 */
export function Notice({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div role="note" className="flex items-start gap-2.5 rounded-xl border border-line bg-surface-muted px-4 py-3">
      <Info className="mt-0.5 size-4 shrink-0 text-ink-subtle" aria-hidden="true" />
      <div className="text-sm leading-relaxed text-ink-muted text-pretty">
        {title && <span className="font-semibold text-ink">{title} </span>}
        {children}
      </div>
    </div>
  );
}

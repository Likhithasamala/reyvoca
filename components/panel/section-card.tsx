import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Titled panel used for grouped content: setup forms, summaries, side panels.
 */
export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  flush = false,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** Drops the body padding — for a table or list that spans the full card. */
  flush?: boolean;
}) {
  return (
    <section className={cn("overflow-hidden rounded-xl border border-line bg-surface", className)}>
      <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {description && <p className="mt-0.5 text-xs leading-relaxed text-ink-muted text-pretty">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children && <div className={flush ? undefined : "px-4 py-4 sm:px-5"}>{children}</div>}
    </section>
  );
}

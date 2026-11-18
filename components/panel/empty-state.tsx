import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The default state for a new workspace. Says what the section is for and
 * offers the one action that moves the user forward.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  footnote,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  /** Quiet line under the action, e.g. why something isn't available yet. */
  footnote?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-14 text-center sm:py-20",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-xl border border-line bg-surface-muted text-ink">
        <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <h2 className="mt-5 text-base font-semibold text-ink">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-muted text-pretty">{description}</p>
      {action && <div className="mt-6">{action}</div>}
      {footnote && <p className="mt-4 max-w-sm text-xs leading-relaxed text-ink-subtle">{footnote}</p>}
    </div>
  );
}

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type WorkflowStage = {
  key: string;
  title: string;
  /** One short line: what happens at this step. */
  detail: string;
  icon: LucideIcon;
};

export type StageState = "done" | "active" | "pending";

/**
 * The Reyvoca calling pipeline, as a rail of stages.
 *
 * Horizontal on wide screens, vertical below — the same component, so the two
 * calling pages describe their flow identically.
 *
 * Colour rule: ember marks only the stage that is currently acting. Completed
 * stages are ink, everything ahead is muted. The accent never fills the rail.
 */
export function WorkflowTimeline({
  stages,
  activeIndex,
  className,
  label,
}: {
  stages: WorkflowStage[];
  /** Index of the acting stage. Omit to render the whole flow as a plan. */
  activeIndex?: number;
  className?: string;
  label: string;
}) {
  const stateOf = (index: number): StageState => {
    if (activeIndex === undefined) return "pending";
    if (index < activeIndex) return "done";
    if (index === activeIndex) return "active";
    return "pending";
  };

  return (
    <ol className={cn("flex flex-col gap-0 lg:flex-row lg:gap-0", className)} aria-label={label}>
      {stages.map((stage, index) => {
        const state = stateOf(index);
        const Icon = stage.icon;
        const last = index === stages.length - 1;

        return (
          <li key={stage.key} className="relative flex min-w-0 flex-1 gap-3 lg:flex-col lg:gap-0">
            {/* Rail: vertical on mobile, horizontal on desktop */}
            <div className="flex flex-col items-center lg:w-full lg:flex-row">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
                  state === "active" && "border-accent-soft bg-accent-wash text-accent-strong",
                  state === "done" && "border-line bg-surface-muted text-ink",
                  state === "pending" && "border-line bg-surface text-ink-subtle",
                )}
              >
                <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
              </span>
              {!last && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "lg:h-px lg:w-full w-px flex-1 lg:flex-1",
                    "my-1 lg:my-0 lg:mx-2",
                    state === "done" ? "bg-line-strong" : "bg-line",
                  )}
                />
              )}
            </div>

            <div className={cn("min-w-0 pb-6 lg:pt-3 lg:pb-0 lg:pr-4", last && "pb-0")}>
              <p
                className={cn(
                  "text-[0.8125rem] font-semibold",
                  state === "pending" ? "text-ink-muted" : "text-ink",
                )}
              >
                {stage.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-subtle text-pretty">{stage.detail}</p>
              {state === "active" && (
                <span className="mt-1.5 inline-flex items-center gap-1.5 text-[0.6875rem] font-medium text-accent-strong">
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
                  In progress
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

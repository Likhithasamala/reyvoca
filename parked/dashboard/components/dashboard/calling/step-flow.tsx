import { Fragment, type ReactNode } from "react";

export type FlowStep = {
  /** Two-digit marker, e.g. "01". */
  number: string;
  title: string;
  /** The small illustration shown inside the card. */
  visual: ReactNode;
  description: string;
};

/**
 * Three connected steps that explain a calling module at a glance.
 *
 * Horizontal on desktop, stacked on mobile, with a hairline connector between
 * cards. Shared by Instant Leads and Bulk Campaigns so both pages tell their
 * story in exactly the same shape.
 */
export function StepFlow({ steps, label }: { steps: FlowStep[]; label: string }) {
  return (
    <ol
      aria-label={label}
      className="grid grid-cols-1 items-stretch gap-0 lg:grid-cols-[1fr_auto_1fr_auto_1fr]"
    >
      {steps.map((step, index) => (
        <Fragment key={step.number}>
          {index > 0 && (
            <li aria-hidden="true" className="flex items-center justify-center py-3 lg:px-4 lg:py-0">
              <span className="h-8 w-px bg-line-strong lg:h-px lg:w-12" />
            </li>
          )}

          <li className="flex flex-col">
            <span className="text-[0.6875rem] font-semibold tracking-[0.16em] text-accent-strong tabular-nums">
              {step.number}
            </span>
            <h3 className="mt-2 text-base font-semibold tracking-tight text-ink">{step.title}</h3>

            <div className="mt-5 flex min-h-44 flex-1 items-center justify-center rounded-2xl border border-line bg-surface p-5 shadow-card">
              {step.visual}
            </div>

            <p className="mt-4 text-sm leading-relaxed text-ink-muted text-pretty">{step.description}</p>
          </li>
        </Fragment>
      ))}
    </ol>
  );
}

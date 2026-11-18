"use client";

import { POST_CALL_ACTIONS } from "@/lib/calling/integration-service";
import { QUALIFICATION_GOAL_LABELS, type PostCallActionType, type QualificationGoal } from "@/types/calling";
import { cn } from "@/lib/cn";
import { AvailabilityBadge } from "./badges";

/**
 * What the agent captures, and what Reyvoca does with it afterwards.
 *
 * Actions needing an outside system can be selected — so a workspace can say
 * what it wants — but they are visibly marked as not yet connected, and the
 * footnote states plainly that they will not run.
 */

const GOALS: QualificationGoal[] = [
  "interest_level",
  "requirement",
  "budget",
  "location",
  "preferred_date",
  "callback_requested",
  "meeting_requested",
  "email_confirmed",
  "notes",
];

export function QualificationGoals({
  selected,
  onChange,
}: {
  selected: QualificationGoal[];
  onChange: (goals: QualificationGoal[]) => void;
}) {
  const toggle = (goal: QualificationGoal) =>
    onChange(selected.includes(goal) ? selected.filter((item) => item !== goal) : [...selected, goal]);

  return (
    <div className="flex flex-wrap gap-2">
      {GOALS.map((goal) => {
        const active = selected.includes(goal);
        return (
          <button
            key={goal}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(goal)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "border-accent-soft bg-accent-wash text-accent-strong"
                : "border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink",
            )}
          >
            {QUALIFICATION_GOAL_LABELS[goal]}
          </button>
        );
      })}
    </div>
  );
}

export function PostCallActions({
  selected,
  onChange,
}: {
  selected: PostCallActionType[];
  onChange: (actions: PostCallActionType[]) => void;
}) {
  const toggle = (type: PostCallActionType) =>
    onChange(selected.includes(type) ? selected.filter((item) => item !== type) : [...selected, type]);

  const blocked = selected.filter(
    (type) => POST_CALL_ACTIONS.find((action) => action.type === type)?.availability !== "available",
  );

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-line">
        {POST_CALL_ACTIONS.map((action) => {
          const active = selected.includes(action.type);
          const inputId = `action-${action.type}`;
          return (
            <li key={action.type} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <input
                id={inputId}
                type="checkbox"
                checked={active}
                onChange={() => toggle(action.type)}
                className="mt-0.5 size-4 shrink-0 rounded border-line-strong accent-brand"
              />
              <div className="min-w-0 flex-1">
                <label htmlFor={inputId} className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-ink">{action.label}</span>
                  <AvailabilityBadge availability={action.availability} />
                </label>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-muted text-pretty">{action.description}</p>
                {action.requires && (
                  <p className="mt-1 text-[0.6875rem] text-ink-subtle">{action.requires}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {blocked.length > 0 && (
        <p className="rounded-lg border border-warning-line bg-warning-soft px-3.5 py-2.5 text-xs leading-relaxed text-warning">
          {blocked.length === 1 ? "One selected action" : `${blocked.length} selected actions`} need an integration that
          is not connected. The preference is saved, but the action will not run until that connector exists.
        </p>
      )}
    </div>
  );
}

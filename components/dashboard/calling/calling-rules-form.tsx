"use client";

import { ShieldCheck } from "lucide-react";
import { SelectField, TextField } from "@/components/panel/field";
import { TIMEZONE_OPTIONS } from "@/lib/calling/integration-service";
import type { CallingRules } from "@/types/calling";

const RETRY_COUNTS = ["0", "1", "2", "3"] as const;
const RETRY_DELAYS = ["15 minutes", "30 minutes", "60 minutes", "4 hours", "Next day"] as const;

const DELAY_MINUTES: Record<string, number> = {
  "15 minutes": 15,
  "30 minutes": 30,
  "60 minutes": 60,
  "4 hours": 240,
  "Next day": 1440,
};
const MINUTES_DELAY = Object.fromEntries(
  Object.entries(DELAY_MINUTES).map(([label, minutes]) => [minutes, label]),
) as Record<number, string>;

/**
 * Calling window, retries and the Do Not Call guarantee.
 *
 * Shared by both channels. Retry limits are capped at three: unlimited
 * redialling is a compliance problem, not a feature.
 */
export function CallingRulesForm({
  rules,
  onChange,
  idPrefix,
}: {
  rules: CallingRules;
  onChange: (rules: CallingRules) => void;
  /** Keeps field ids unique when two forms appear on one page. */
  idPrefix: string;
}) {
  const setWindow = (patch: Partial<CallingRules["window"]>) =>
    onChange({ ...rules, window: { ...rules.window, ...patch } });
  const setRetry = (patch: Partial<CallingRules["retry"]>) =>
    onChange({ ...rules, retry: { ...rules.retry, ...patch } });

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id={`${idPrefix}-start`}
          label="Calling from"
          type="time"
          value={rules.window.start}
          onChange={(event) => setWindow({ start: event.target.value })}
        />
        <TextField
          id={`${idPrefix}-end`}
          label="Calling until"
          type="time"
          value={rules.window.end}
          onChange={(event) => setWindow({ end: event.target.value })}
        />
        <SelectField
          id={`${idPrefix}-timezone`}
          label="Timezone"
          options={TIMEZONE_OPTIONS}
          value={rules.window.timezone}
          onChange={(event) => setWindow({ timezone: event.target.value })}
          wrapperClassName="sm:col-span-2"
          hint="Calls outside this window are held until the window opens, never placed late."
        />
      </div>

      <div className="border-t border-line pt-5">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={rules.retry.retryOnNoAnswer}
            onChange={(event) => setRetry({ retryOnNoAnswer: event.target.checked })}
            className="mt-0.5 size-4 shrink-0 rounded border-line-strong accent-brand"
          />
          <span>
            <span className="block text-[0.8125rem] font-medium text-ink">Retry if there is no answer</span>
            <span className="mt-0.5 block text-xs text-ink-subtle">
              A contact who does not pick up is tried again later, within the calling window.
            </span>
          </span>
        </label>

        {rules.retry.retryOnNoAnswer && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <SelectField
              id={`${idPrefix}-max-retries`}
              label="Maximum retries"
              options={RETRY_COUNTS}
              value={String(rules.retry.maxRetries)}
              onChange={(event) => setRetry({ maxRetries: Number(event.target.value) })}
              hint="Capped at three attempts."
            />
            <SelectField
              id={`${idPrefix}-retry-delay`}
              label="Delay between retries"
              options={RETRY_DELAYS}
              value={MINUTES_DELAY[rules.retry.retryDelayMinutes] ?? "60 minutes"}
              onChange={(event) => setRetry({ retryDelayMinutes: DELAY_MINUTES[event.target.value] ?? 60 })}
            />
          </div>
        )}
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border border-line bg-surface-muted px-3.5 py-3">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-ink-subtle" strokeWidth={1.75} aria-hidden="true" />
        <p className="text-xs leading-relaxed text-ink-muted text-pretty">
          <span className="font-medium text-ink">Do Not Call is always respected.</span> If a contact asks not to be
          called again, Reyvoca records it and stops every future attempt, including retries. This cannot be switched
          off.
        </p>
      </div>
    </div>
  );
}

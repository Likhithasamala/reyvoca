"use client";

import { useState } from "react";
import { FormField } from "@/components/ui/form-field";
import { cn } from "@/lib/cn";
import { MIN_PASSWORD_LENGTH, passwordStrength } from "@/lib/validation";

type PasswordFieldProps = {
  label?: string;
  name?: string;
  error?: string;
  /** Lets the parent read the value for its own confirm-field comparison. */
  onValueChange?: (value: string) => void;
  autoComplete?: "new-password" | "current-password";
};

/** Four segments, filled to the score and coloured by it. */
const TRACK_COLOURS = [
  "bg-danger",
  "bg-danger",
  "bg-warning",
  "bg-accent-strong",
  "bg-success",
] as const;

const LABEL_COLOURS = [
  "text-danger",
  "text-danger",
  "text-warning",
  "text-accent-strong",
  "text-success",
] as const;

/**
 * A password field with a live strength meter.
 *
 * The meter is advice, not a gate — `validatePassword` on the server decides
 * what is acceptable. Its value is that it tells someone *while they type*
 * that a longer password would be better, which is the moment they can still
 * act on it.
 */
export function PasswordField({
  label = "Password",
  name = "password",
  error,
  onValueChange,
  autoComplete = "new-password",
}: PasswordFieldProps) {
  const [value, setValue] = useState("");
  const strength = passwordStrength(value);
  const showMeter = value.length > 0;

  return (
    <div>
      <FormField
        label={label}
        name={name}
        type="password"
        autoComplete={autoComplete}
        error={error}
        hint={showMeter ? undefined : `At least ${MIN_PASSWORD_LENGTH} characters, with a number.`}
        onChange={(event) => {
          setValue(event.target.value);
          onValueChange?.(event.target.value);
        }}
      />
      {showMeter && !error && (
        <div className="mt-2">
          <div className="flex items-center gap-2">
            <div className="flex flex-1 gap-1" aria-hidden="true">
              {[0, 1, 2, 3].map((segment) => (
                <span
                  key={segment}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    segment < strength.score ? TRACK_COLOURS[strength.score] : "bg-line",
                  )}
                />
              ))}
            </div>
            <span
              className={cn("text-xs font-medium tabular-nums", LABEL_COLOURS[strength.score])}
              // Announced politely so a screen reader is not interrupted on
              // every keystroke.
              aria-live="polite"
            >
              {strength.label}
            </span>
          </div>
          {strength.advice && <p className="mt-1.5 text-xs text-ink-subtle">{strength.advice}</p>}
        </div>
      )}
    </div>
  );
}

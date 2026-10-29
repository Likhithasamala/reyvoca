"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type FormFieldProps = Omit<ComponentProps<"input">, "id"> & {
  label: string;
  error?: string;
  hint?: string;
  labelAction?: ReactNode;
};

const inputClass =
  "block h-11 w-full rounded-lg border bg-surface px-3.5 text-[0.9375rem] text-ink placeholder:text-ink-subtle transition-colors focus:outline-none focus:ring-4";

export function FormField({ label, error, hint, labelAction, type = "text", className, ...props }: FormFieldProps) {
  const id = useId();
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";
  const describedBy = [error && `${id}-error`, hint && !error && `${id}-hint`].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        {labelAction}
      </div>
      <div className="relative">
        <input
          id={id}
          type={isPassword && revealed ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            inputClass,
            isPassword && "pr-11",
            error
              ? "border-danger focus:border-danger focus:ring-danger-soft"
              : "border-line-strong hover:border-ink-subtle focus:border-ink focus:ring-surface-muted",
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            aria-label={revealed ? "Hide password" : "Show password"}
            aria-pressed={revealed}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-ink-subtle hover:text-ink"
          >
            {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

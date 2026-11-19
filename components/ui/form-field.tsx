"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * "paper" is the default field on a light surface. "night" is the same field
 * lit for a dark ground — used by the closing scene, where the booking form
 * sits on the ember-lit night rather than on canvas.
 */
export type FieldTone = "paper" | "night";

type FormFieldProps = Omit<ComponentProps<"input">, "id"> & {
  label: string;
  error?: string;
  hint?: string;
  labelAction?: ReactNode;
  tone?: FieldTone;
};

const inputClass =
  "block h-11 w-full rounded-lg border px-3.5 text-[0.9375rem] transition-colors focus:outline-none focus:ring-4";

const toneClass: Record<FieldTone, { label: string; input: string; ok: string; bad: string; hint: string; error: string; reveal: string }> = {
  paper: {
    label: "text-ink",
    input: "bg-surface text-ink placeholder:text-ink-subtle",
    ok: "border-line-strong hover:border-ink-subtle focus:border-ink focus:ring-surface-muted",
    bad: "border-danger focus:border-danger focus:ring-danger-soft",
    hint: "text-ink-subtle",
    error: "text-danger",
    reveal: "text-ink-subtle hover:text-ink",
  },
  night: {
    label: "text-night-text",
    input: "bg-white/[0.06] text-[#fffaf4] placeholder:text-night-muted",
    ok: "border-white/15 hover:border-white/35 focus:border-white/70 focus:ring-white/10",
    bad: "border-[#ffb3ac] focus:border-[#ffb3ac] focus:ring-[#ffb3ac]/15",
    hint: "text-night-muted",
    error: "text-[#ffb3ac]",
    reveal: "text-night-muted hover:text-night-text",
  },
};

export function FormField({
  label,
  error,
  hint,
  labelAction,
  tone = "paper",
  type = "text",
  className,
  ...props
}: FormFieldProps) {
  const id = useId();
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";
  const describedBy = [error && `${id}-error`, hint && !error && `${id}-hint`].filter(Boolean).join(" ") || undefined;
  const skin = toneClass[tone];

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label htmlFor={id} className={cn("text-sm font-medium", skin.label)}>
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
          className={cn(inputClass, skin.input, isPassword && "pr-11", error ? skin.bad : skin.ok)}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            aria-label={revealed ? "Hide password" : "Show password"}
            aria-pressed={revealed}
            className={cn("absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg", skin.reveal)}
          >
            {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className={cn("mt-1.5 text-sm", skin.hint)}>
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className={cn("mt-1.5 text-sm font-medium", skin.error)}>
          {error}
        </p>
      )}
    </div>
  );
}

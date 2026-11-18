import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

const control =
  "block w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-subtle transition-colors hover:border-ink-subtle focus:border-ink focus:ring-4 focus:ring-surface-muted focus:outline-none";

/** Label + hint + error wrapper shared by every dashboard control. */
function Shell({
  id,
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[0.8125rem] font-medium text-ink">
        {label}
        {required && (
          <span className="ml-0.5 text-accent-strong" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs leading-relaxed text-ink-subtle text-pretty">
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

const describedBy = (id: string, hint?: string, error?: string) =>
  [error && `${id}-error`, hint && !error && `${id}-hint`].filter(Boolean).join(" ") || undefined;

type Common = { id: string; label: string; hint?: string; error?: string; wrapperClassName?: string };

export function TextField({
  id,
  label,
  hint,
  error,
  wrapperClassName,
  className,
  ...props
}: Common & Omit<ComponentProps<"input">, "id">) {
  return (
    <Shell id={id} label={label} hint={hint} error={error} required={props.required} className={wrapperClassName}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(control, "h-10", error && "border-danger focus:border-danger focus:ring-danger-soft", className)}
        {...props}
      />
    </Shell>
  );
}

export function TextareaField({
  id,
  label,
  hint,
  error,
  wrapperClassName,
  className,
  rows = 4,
  ...props
}: Common & Omit<ComponentProps<"textarea">, "id">) {
  return (
    <Shell id={id} label={label} hint={hint} error={error} required={props.required} className={wrapperClassName}>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(control, "resize-y py-2.5 leading-relaxed", error && "border-danger focus:border-danger focus:ring-danger-soft", className)}
        {...props}
      />
    </Shell>
  );
}

export function SelectField({
  id,
  label,
  hint,
  error,
  options,
  wrapperClassName,
  className,
  ...props
}: Common & { options: readonly string[] } & Omit<ComponentProps<"select">, "id" | "children">) {
  return (
    <Shell id={id} label={label} hint={hint} error={error} required={props.required} className={wrapperClassName}>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(control, "h-10 pr-8", error && "border-danger", className)}
        {...props}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </Shell>
  );
}

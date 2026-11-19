import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type AccountSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  /** Red-tinted frame for the deletion block. */
  tone?: "default" | "danger";
};

/** One titled card on the account page. */
export function AccountSection({ title, description, children, tone = "default" }: AccountSectionProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border bg-surface p-6 sm:p-7",
        tone === "danger" ? "border-danger-line" : "border-line",
      )}
    >
      <h2
        className={cn(
          "text-[1.0625rem] font-semibold tracking-[-0.015em]",
          tone === "danger" ? "text-danger" : "text-ink",
        )}
      >
        {title}
      </h2>
      {description && <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{description}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** Small success line shown under a form after it saves. */
export function SavedNotice({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="rounded-xl border border-success-line bg-success-soft p-3.5 text-sm text-success">
      {children}
    </p>
  );
}

/** Small failure line shown under a form. */
export function ErrorNotice({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-xl border border-danger-line bg-danger-soft p-3.5 text-sm text-danger">
      {children}
    </p>
  );
}

import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Marks illustrative data. Every figure in this build is example data, and the
 * interface says so wherever a number or row appears.
 */
export function DemoTag({ label = "Demo data", className }: { label?: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-accent-soft bg-accent-wash px-2 py-0.5 text-[0.6875rem] font-medium text-accent-strong",
        className,
      )}
    >
      <FlaskConical className="size-3" aria-hidden="true" />
      {label}
    </span>
  );
}

/** Full-width variant for the top of a page that is entirely example data. */
export function DemoNotice({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="note"
      className="flex items-start gap-2.5 rounded-xl border border-accent-soft bg-accent-wash px-4 py-3 text-sm text-ink"
    >
      <FlaskConical className="mt-0.5 size-4 shrink-0 text-accent-strong" aria-hidden="true" />
      <p className="text-pretty">{children}</p>
    </div>
  );
}

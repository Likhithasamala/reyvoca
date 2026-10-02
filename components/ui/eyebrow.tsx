import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Small uppercase label that introduces a section. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-brand-soft bg-brand-softer px-3 py-1 text-xs font-semibold tracking-[0.08em] text-brand uppercase",
        className,
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-brand" />
      {children}
    </p>
  );
}

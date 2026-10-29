import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/** Icon in a neutral rounded square — the standard feature icon treatment. */
export function IconTile({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-muted text-ink",
        className,
      )}
    >
      <Icon className="size-5" strokeWidth={1.75} />
    </span>
  );
}

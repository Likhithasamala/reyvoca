import { Info } from "lucide-react";
import type { AuthResult } from "@/lib/auth/types";
import { cn } from "@/lib/cn";

type Failure = Extract<AuthResult, { ok: false }>;

/** Result message for an auth form. "Not configured" is informational, not an error. */
export function FormNotice({ result }: { result: Failure }) {
  const informational = result.code === "not_configured";
  return (
    <div
      role={informational ? "status" : "alert"}
      className={cn(
        "flex gap-3 rounded-xl border p-4 text-sm leading-relaxed",
        informational ? "border-line bg-surface-muted text-ink" : "border-danger-line bg-danger-soft text-danger",
      )}
    >
      <Info className={cn("mt-0.5 size-4 shrink-0", informational ? "text-accent-strong" : "text-danger")} aria-hidden="true" />
      <p>{result.message}</p>
    </div>
  );
}

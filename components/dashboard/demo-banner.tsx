import { FlaskConical } from "lucide-react";

export function DemoBanner() {
  return (
    <div role="note" className="flex items-start gap-3 rounded-xl border border-brand-soft bg-brand-softer px-4 py-3 text-sm text-ink">
      <FlaskConical className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
      <p>
        <span className="font-semibold">Demo data.</span> This dashboard is a Phase 1 interface preview. Numbers and calls
        below are illustrative and not connected to any live service.
      </p>
    </div>
  );
}

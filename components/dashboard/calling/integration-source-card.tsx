"use client";

import { Braces, Check, Globe, Megaphone, Puzzle, Server, Webhook } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SOURCE_STATUS_LABELS, type SourceOption, type SourceStatus } from "@/lib/calling/integration-service";
import { StatusBadge, type StatusTone } from "@/components/dashboard/ui/status-badge";
import type { LeadSource } from "@/types/calling";
import { cn } from "@/lib/cn";

const icons: Record<LeadSource, LucideIcon> = {
  webhook: Webhook,
  website_form: Globe,
  meta_lead_ads: Megaphone,
  crm: Server,
  api: Braces,
  csv_upload: Puzzle,
  custom: Puzzle,
};

const statusTones: Record<SourceStatus, StatusTone> = {
  available_for_setup: "positive",
  requires_webhook: "accent",
  planned: "neutral",
};

/**
 * One lead source.
 *
 * A planned source cannot be selected — offering a choice that does nothing
 * would be worse than showing it greyed with an honest label.
 */
export function IntegrationSourceCard({
  option,
  selected,
  onSelect,
}: {
  option: SourceOption;
  selected: boolean;
  onSelect: (source: LeadSource) => void;
}) {
  const Icon = icons[option.source];
  const selectable = option.status !== "planned";

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={!selectable}
      onClick={() => onSelect(option.source)}
      title={selectable ? undefined : "This integration is planned and cannot be selected yet"}
      className={cn(
        "relative flex h-full flex-col rounded-xl border p-4 text-left transition-colors",
        selected && "border-accent-soft bg-accent-wash",
        !selected && selectable && "border-line bg-surface hover:border-line-strong hover:bg-surface-muted/50",
        !selectable && "cursor-not-allowed border-line bg-surface-muted/40 opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg border",
            selected ? "border-accent-soft bg-surface text-accent-strong" : "border-line bg-surface-muted text-ink",
          )}
        >
          <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
        </span>
        {selected && (
          <span className="flex size-5 items-center justify-center rounded-full bg-accent text-white">
            <Check className="size-3" strokeWidth={3} aria-hidden="true" />
          </span>
        )}
      </div>

      <p className="mt-3 text-sm font-semibold text-ink">{option.title}</p>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-ink-muted text-pretty">{option.description}</p>
      <div className="mt-3">
        <StatusBadge status={SOURCE_STATUS_LABELS[option.status]} tone={statusTones[option.status]} />
      </div>
    </button>
  );
}

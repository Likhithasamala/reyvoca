"use client";

import { CircleCheck, CircleX, Copy, Rows3 } from "lucide-react";
import type { ValidationSummary as Summary } from "@/lib/calling/csv";
import { cn } from "@/lib/cn";

/**
 * What will and will not be imported.
 *
 * The point is that nobody launches a campaign without knowing exactly how
 * many contacts will be called, so each figure is spelled out rather than
 * rolled into a single "ready" message.
 */
export function ValidationSummary({ summary }: { summary: Summary }) {
  const tiles = [
    { label: "Rows", value: summary.total, icon: Rows3, tone: "neutral" as const },
    { label: "Valid", value: summary.valid, icon: CircleCheck, tone: "positive" as const },
    { label: "Duplicate", value: summary.duplicates, icon: Copy, tone: "attention" as const },
    { label: "Invalid", value: summary.invalid, icon: CircleX, tone: "attention" as const },
  ];

  const toneClass = {
    neutral: "text-ink",
    positive: "text-success",
    attention: "text-warning",
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl border border-line bg-surface p-3.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-ink-muted">{tile.label}</p>
              <tile.icon className="size-3.5 shrink-0 text-ink-subtle" strokeWidth={1.75} aria-hidden="true" />
            </div>
            <p
              className={cn(
                "mt-1.5 text-xl font-semibold tracking-tight tabular-nums",
                tile.value === 0 && tile.tone !== "positive" ? "text-ink" : toneClass[tile.tone],
              )}
            >
              {tile.value}
            </p>
          </div>
        ))}
      </div>

      {summary.issues.length > 0 && (
        <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
          {summary.issues.map((issue) => (
            <li key={issue.label} className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs">
              <span className="text-ink-muted">{issue.label}</span>
              <span className="shrink-0 font-medium text-ink tabular-nums">{issue.count}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs leading-relaxed text-ink-subtle text-pretty">
        {summary.valid > 0 ? (
          <>
            <span className="font-medium text-ink">{summary.valid}</span> of {summary.total} rows will be called.
            Duplicate and invalid rows stay in the campaign for reference but are never dialled.
          </>
        ) : (
          "No row in this file can be called yet. Check the column mapping, then the phone column."
        )}
      </p>
    </div>
  );
}

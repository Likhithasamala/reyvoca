"use client";

import { AudioLines, Clock, PhoneCall } from "lucide-react";
import type { CampaignContact } from "@/types/calling";
import { OutcomeBadge } from "./badges";

/**
 * The operational view of a running campaign: who is on a call now, who is
 * next, and what just finished. This is what makes a campaign feel live rather
 * than like a table that occasionally changes.
 */
export function LiveCallQueue({
  calling,
  upNext,
  recent,
  agentName,
  elapsedLabel,
}: {
  calling: CampaignContact[];
  upNext: CampaignContact[];
  recent: CampaignContact[];
  agentName?: string;
  /** Call timer text. Omitted when there is no real timing source. */
  elapsedLabel?: string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Currently calling */}
      <section className="rounded-xl border border-accent-soft bg-accent-wash p-4">
        <h3 className="flex items-center gap-2 text-[0.6875rem] font-semibold tracking-[0.08em] text-accent-strong uppercase">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
          Currently calling
        </h3>
        {calling.length === 0 ? (
          <p className="mt-3 text-xs leading-relaxed text-ink-muted">No call in progress.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {calling.map((contact) => (
              <li key={contact.id}>
                <p className="truncate text-sm font-semibold text-ink">{contact.name ?? contact.phone}</p>
                <p className="mt-0.5 flex items-center gap-2 text-xs text-ink-muted">
                  <PhoneCall className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                  <span className="truncate">{agentName ?? "Assigned agent"}</span>
                  {elapsedLabel && <span className="shrink-0 tabular-nums">{elapsedLabel}</span>}
                </p>
                <span className="mt-2 flex items-end gap-0.5" aria-hidden="true">
                  {[6, 11, 8, 14, 9, 5].map((height, index) => (
                    <span
                      key={index}
                      className="w-0.5 rounded-full bg-accent/70"
                      style={{ height: `${height}px` }}
                    />
                  ))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Up next */}
      <section className="rounded-xl border border-line bg-surface p-4">
        <h3 className="flex items-center gap-2 text-[0.6875rem] font-semibold tracking-[0.08em] text-ink-subtle uppercase">
          <Clock className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          Up next
        </h3>
        {upNext.length === 0 ? (
          <p className="mt-3 text-xs leading-relaxed text-ink-muted">The queue is empty.</p>
        ) : (
          <ol className="mt-3 space-y-2.5">
            {upNext.map((contact) => (
              <li key={contact.id} className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm text-ink">{contact.name ?? contact.phone}</span>
                <span className="shrink-0 font-mono text-[0.6875rem] text-ink-subtle tabular-nums">
                  {contact.phone}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Recently completed */}
      <section className="rounded-xl border border-line bg-surface p-4">
        <h3 className="flex items-center gap-2 text-[0.6875rem] font-semibold tracking-[0.08em] text-ink-subtle uppercase">
          <AudioLines className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          Recently completed
        </h3>
        {recent.length === 0 ? (
          <p className="mt-3 text-xs leading-relaxed text-ink-muted">No calls completed yet.</p>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {recent.map((contact) => (
              <li key={contact.id} className="flex items-center justify-between gap-3">
                <span className="truncate text-sm text-ink">{contact.name ?? contact.phone}</span>
                {contact.outcome && (
                  <span className="shrink-0">
                    <OutcomeBadge outcome={contact.outcome} />
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

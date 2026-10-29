"use client";

import { Activity } from "lucide-react";
import { describeEvent, useCallingEvents } from "@/lib/calling/realtime";
import { StatusBadge } from "@/components/dashboard/ui/status-badge";

/**
 * Rolling feed of calling events.
 *
 * It reads from the realtime abstraction rather than from component state, so
 * it will render backend-pushed events unchanged. Until that stream exists the
 * channel reports `isLive: false` and the header says the activity is local.
 */
export function LiveActivityFeed({ emptyHint }: { emptyHint: string }) {
  const { events, isLive } = useCallingEvents();

  return (
    <div className="rounded-xl border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-ink-subtle" strokeWidth={1.75} aria-hidden="true" />
          <h3 className="text-sm font-semibold text-ink">Live activity</h3>
        </div>
        <StatusBadge
          status={isLive ? "Connected" : "Local events"}
          tone={isLive ? "positive" : "neutral"}
          dot={isLive}
        />
      </div>

      {events.length === 0 ? (
        <p className="px-4 py-8 text-center text-xs leading-relaxed text-ink-muted text-pretty">{emptyHint}</p>
      ) : (
        <ol className="divide-y divide-line">
          {events.map((event, index) => (
            <li key={`${event.type}-${event.at}-${index}`} className="flex items-start gap-3 px-4 py-2.5">
              <span
                aria-hidden="true"
                className={`mt-1.5 size-1.5 shrink-0 rounded-full ${index === 0 ? "bg-accent" : "bg-line-strong"}`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-ink">{describeEvent(event)}</p>
                <code className="text-[0.6875rem] text-ink-subtle">{event.type}</code>
              </div>
              <time className="shrink-0 text-[0.6875rem] text-ink-subtle tabular-nums">
                {new Date(event.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" })}
              </time>
            </li>
          ))}
        </ol>
      )}

      {!isLive && (
        <p className="border-t border-line px-4 py-2.5 text-[0.6875rem] leading-relaxed text-ink-subtle">
          These events are produced locally by the controls on this page. When calling goes live the same feed renders
          events pushed from the backend.
        </p>
      )}
    </div>
  );
}

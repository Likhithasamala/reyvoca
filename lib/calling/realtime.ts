"use client";

/**
 * Realtime abstraction for calling activity.
 *
 * Components subscribe to `callingEvents` and never know what is behind it.
 * Today that is a local emitter driven by explicit, user-triggered demo
 * actions. When the backend ships, `createStreamChannel` below is swapped in
 * and no component changes.
 *
 * `isLive` is false for the local emitter, and the UI uses it to say plainly
 * that activity is demo activity rather than a production stream.
 */
import { useEffect, useState } from "react";
import type { CallEvent, RealtimeChannel } from "@/types/calling";

class LocalEventChannel implements RealtimeChannel {
  readonly isLive = false;
  private listeners = new Set<(event: CallEvent) => void>();

  subscribe(listener: (event: CallEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Only reachable from demo controls — nothing emits on its own. */
  emit(event: CallEvent): void {
    for (const listener of this.listeners) listener(event);
  }
}

export const callingEvents = new LocalEventChannel();

/**
 * Placeholder for the production transport.
 *
 * Intentionally not wired up: there is no calling backend yet, and a socket
 * that silently fails would be worse than none. When the stream endpoint
 * exists, this takes its URL and returns a RealtimeChannel with
 * `isLive: true`, and `callingEvents` points here instead of the local emitter.
 */
export function createStreamChannel(): RealtimeChannel | null {
  return null;
}

/**
 * Collects recent events for an activity feed.
 *
 * `limit` keeps the feed bounded; the newest event is first.
 */
export function useCallingEvents(limit = 20): { events: CallEvent[]; isLive: boolean } {
  const [events, setEvents] = useState<CallEvent[]>([]);

  useEffect(() => {
    return callingEvents.subscribe((event) => {
      setEvents((current) => [event, ...current].slice(0, limit));
    });
  }, [limit]);

  return { events, isLive: callingEvents.isLive };
}

/** Human-readable line for one event, used by the activity timeline. */
export function describeEvent(event: CallEvent): string {
  switch (event.type) {
    case "lead.received":
      return `Lead received — ${event.lead.name ?? event.lead.phone}`;
    case "lead.updated":
      return `Lead updated — ${event.lead.name ?? event.lead.phone}`;
    case "call.queued":
      return "Call queued";
    case "call.started":
      return "Call started";
    case "call.connected":
      return "Call connected";
    case "call.completed":
      return `Call completed — ${event.outcome.outcome.replace(/_/g, " ")}`;
    case "meeting.booked":
      return "Meeting booked";
    case "campaign.progress":
      return `Campaign progress — ${event.progress.completed} of ${event.progress.total}`;
    case "campaign.completed":
      return "Campaign completed";
  }
}

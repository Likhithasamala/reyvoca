"use client";

/**
 * Backend-backed store for the dashboard.
 *
 * Replaces the browser-only store: data now lives on the server and is shared
 * across tabs, devices and reloads. The hook shape is unchanged
 * (`{ value, ready }`), so no component had to change when this was swapped in.
 *
 * Reads are cached per endpoint and shared by every subscriber, so five
 * components reading agents cause one request, not five.
 */
import { useSyncExternalStore } from "react";

/** Base URL of the API. Same-origin `/api` by default. */
const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "/api").replace(/\/$/, "");

export type RemoteSnapshot<T> = {
  value: T;
  /** False until the first response arrives. */
  ready: boolean;
  /** Set when the last fetch failed, so the UI can say so instead of showing empty. */
  error?: string;
};

export type RemoteStore<T> = {
  get(): T;
  /** Re-fetches and notifies subscribers. */
  refresh(): Promise<T>;
  use(): RemoteSnapshot<T>;
};

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    credentials: "include",
  });

  const payload = (await response.json().catch(() => null)) as
    | ({ ok?: boolean; message?: string } & Record<string, unknown>)
    | null;

  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.message ?? `Request to ${path} failed (${response.status}).`);
  }
  return payload as T;
}

/**
 * @param path   endpoint to read, e.g. "/agents"
 * @param select pulls the collection out of the response body
 */
export function createRemoteStore<T>(
  path: string,
  select: (body: Record<string, unknown>) => T,
  fallback: T,
): RemoteStore<T> {
  const serverSnapshot: RemoteSnapshot<T> = { value: fallback, ready: false };

  let snapshot: RemoteSnapshot<T> = serverSnapshot;
  let inFlight: Promise<T> | null = null;
  const listeners = new Set<() => void>();

  const emit = () => {
    for (const listener of listeners) listener();
  };

  function load(): Promise<T> {
    // One request in flight per endpoint, however many components subscribe.
    inFlight ??= apiFetch<Record<string, unknown>>(path)
      .then((body) => {
        const value = select(body);
        snapshot = { value, ready: true };
        emit();
        return value;
      })
      .catch((error: Error) => {
        // Keep the last good value; surface the failure rather than blanking.
        snapshot = { value: snapshot.value, ready: true, error: error.message };
        emit();
        return snapshot.value;
      })
      .finally(() => {
        inFlight = null;
      });

    return inFlight;
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    if (!snapshot.ready) void load();
    return () => {
      listeners.delete(listener);
    };
  }

  return {
    get: () => snapshot.value,
    refresh: load,
    use: () => useSyncExternalStore(subscribe, () => snapshot, () => serverSnapshot),
  };
}

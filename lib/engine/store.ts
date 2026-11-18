"use client";

/**
 * The Reyvoca voice engine, as the dashboard knows it.
 *
 * Customers pick a voice and a language; which vendor serves the call is a
 * Reyvoca operations decision, configured in the admin panel and resolved on
 * the server. This store therefore carries capabilities, voices and languages
 * — and deliberately no provider names.
 */
import { createRemoteStore } from "@/lib/calling/remote-store";
import type { Voice } from "@/lib/agents/templates";

export type Engine = {
  /** Conversations can run (Test chat, Web call, live calls). */
  intelligence: boolean;
  /** A Reyvoca voice is available; without it calls use the browser voice. */
  voice: boolean;
  transcription: boolean;
  voices: Voice[];
  languages: string[];
  /** The voice list came from the live library rather than the fallback. */
  live: boolean;
};

const EMPTY: Engine = {
  intelligence: false,
  voice: false,
  transcription: false,
  voices: [],
  languages: [],
  live: false,
};

const engineStore = createRemoteStore<Engine>(
  "/engine",
  (body) => (body.engine as Engine) ?? EMPTY,
  EMPTY,
);

export function useEngine() {
  const { value, ready, error } = engineStore.use();
  return { engine: value, ready, error };
}

/** Re-reads the engine — used after an operator changes the provider stack. */
export function refreshEngine(): Promise<Engine> {
  return engineStore.refresh();
}

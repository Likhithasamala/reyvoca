"use client";

/**
 * Instant Leads setup, backed by the Reyvoca API.
 *
 * The configuration is stored per workspace at `/api/instant-setup`. Saving it
 * records intent — it does not start calling, because the calling layer is not
 * connected yet.
 */
import type { InstantSetup, InstantSetupStatus } from "@/types/calling";
import { DEFAULT_ACTIONS, DEFAULT_CALLING_RULES } from "./integration-service";
import { apiFetch, createRemoteStore } from "./remote-store";

const INITIAL_SETUP: InstantSetup = {
  status: "not_configured",
  timing: { mode: "immediate", delayMinutes: 0 },
  rules: DEFAULT_CALLING_RULES,
  goals: ["interest_level", "requirement", "callback_requested"],
  actions: DEFAULT_ACTIONS,
};

const setupStore = createRemoteStore<InstantSetup>(
  "/instant-setup",
  (body) => (body.setup as InstantSetup) ?? INITIAL_SETUP,
  INITIAL_SETUP,
);

/** Sends a patch; the server merges it and decides the resulting status. */
async function patch(body: Partial<InstantSetup> & { status?: InstantSetupStatus }) {
  const { setup } = await apiFetch<{ setup: InstantSetup }>("/instant-setup", {
    method: "PUT",
    body: JSON.stringify(body),
  });
  await setupStore.refresh();
  return setup;
}

export const instantService = {
  get(): InstantSetup {
    return setupStore.get();
  },

  save(update: Partial<InstantSetup>): Promise<InstantSetup> {
    return patch(update);
  },

  setStatus(status: InstantSetupStatus): Promise<InstantSetup> {
    return patch({ status });
  },

  reset(): Promise<InstantSetup> {
    return patch(INITIAL_SETUP);
  },

  useSetup: setupStore.use,
};

export { INITIAL_SETUP };

"use client";

/**
 * Saved provider keys, served by the Reyvoca API.
 *
 * Operator-only: `/api/providers` answers 403 to anyone who is not a Reyvoca
 * admin, so this module is used by the admin panel alone. The customer
 * dashboard reads `lib/engine/store.ts`, which names no vendor. Only masked
 * keys reach the browser; the raw key stays on the server.
 */
import { apiFetch, createRemoteStore } from "@/lib/calling/remote-store";
import type { ProviderType } from "./catalog";

export type ProviderRecord = {
  id: string;
  providerType: ProviderType;
  providerName: string;
  label: string;
  keyMasked: string;
  isValidated: boolean;
  settings: Record<string, string>;
  createdAt: string;
};

const providerStore = createRemoteStore<ProviderRecord[]>(
  "/providers",
  (body) => (body.providers as ProviderRecord[]) ?? [],
  [],
);

export function useProviders() {
  const { value, ready, error } = providerStore.use();
  return { providers: value, ready, error };
}

/** Validates the key with the provider, then saves it. Throws with the reason. */
export async function saveProviderKey(input: {
  providerType: ProviderType;
  providerName: string;
  label: string;
  apiKey: string;
  settings?: Record<string, string>;
}): Promise<ProviderRecord> {
  const { provider } = await apiFetch<{ provider: ProviderRecord }>("/providers", {
    method: "POST",
    body: JSON.stringify(input),
  });
  await providerStore.refresh();
  return provider;
}

export async function deleteProviderKey(id: string): Promise<void> {
  await apiFetch(`/providers/${id}`, { method: "DELETE" });
  await providerStore.refresh();
}

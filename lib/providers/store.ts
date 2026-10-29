"use client";

/**
 * Saved provider keys, served by the Reyvoca API. Only masked keys reach the
 * browser; the raw key stays on the server.
 */
import { apiFetch, createRemoteStore } from "@/lib/calling/remote-store";
import type { ProviderType } from "./catalog";
import type { ConnectedProviders } from "@/lib/agents/templates";

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

/** Which provider ids have at least one saved key, per category. */
export function connectedProviders(records: ProviderRecord[]): ConnectedProviders {
  const out: ConnectedProviders = { llm: [], tts: [], stt: [] };
  for (const record of records) {
    const list = out[record.providerType];
    if (list && !list.includes(record.providerName)) list.push(record.providerName);
  }
  return out;
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

export type VoicesResponse = {
  voices: { id: string; name: string; language?: string }[];
  live: boolean;
  note?: string;
};

/** The live voice library for a TTS provider (empty + live:false without a key). */
export async function fetchProviderVoices(provider: string): Promise<VoicesResponse> {
  return apiFetch<VoicesResponse>("/providers/voices", {
    method: "POST",
    body: JSON.stringify({ provider }),
  });
}

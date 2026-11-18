/**
 * The Reyvoca voice engine, resolved on the server.
 *
 * Customers never choose — or see — which vendor powers an agent. They pick a
 * voice and a language; Reyvoca decides which LLM, STT and TTS provider serves
 * the call, from the keys the operator saved under `/admin/providers`.
 *
 * Everything vendor-identifying stops here: `engineStatus` is what the browser
 * is allowed to know (is there intelligence, a voice, transcription; which
 * voices and languages are on offer), and it never carries a provider name.
 */
import {
  LLM_MODELS,
  LLM_ORDER,
  STT_ORDER,
  TTS_ORDER,
  VOICE_CATALOG,
  langsFor,
  pickProvider,
  templateById,
  type ConnectedProviders,
  type Voice,
} from "@/lib/agents/templates";
import { read } from "./db";
import { PLATFORM_WORKSPACE_ID } from "./scope";
import { listVoices, providerKey } from "./providers";

/** Which providers this workspace can actually call, per category. */
export async function connectedProviders(workspaceId: string): Promise<ConnectedProviders> {
  const rows = await read((db) =>
    db.providerConfigs
      .filter(
        (row) =>
          (row.workspaceId === workspaceId || row.workspaceId === PLATFORM_WORKSPACE_ID) &&
          !!row.apiKey,
      )
      .map((row) => ({ type: row.providerType, name: row.providerName })),
  );

  const out: ConnectedProviders = { llm: [], tts: [], stt: [] };
  for (const row of rows) {
    const list = out[row.type];
    if (list && !list.includes(row.name)) list.push(row.name);
  }
  return out;
}

export type ResolvedEngine = {
  /** Empty string when nothing is connected for that leg. */
  llmProvider: string;
  llmModel: string;
  voiceProvider: string;
  sttProvider: string;
};

/**
 * Which providers an agent should run on.
 *
 * The agent's template nudges the model choice (a sales agent and a support
 * agent want different things); everything else follows the general
 * preference order over whatever is connected.
 */
export async function resolveEngine(
  workspaceId: string,
  templateId?: string,
): Promise<ResolvedEngine> {
  const providers = await connectedProviders(workspaceId);

  const prefs = templateById(templateId ?? "")?.modelPrefs ?? [];
  let llmProvider = "";
  let llmModel = "";
  for (const [provider, model] of prefs) {
    if (providers.llm.includes(provider) && (LLM_MODELS[provider] ?? []).includes(model)) {
      llmProvider = provider;
      llmModel = model;
      break;
    }
  }
  if (!llmProvider) {
    llmProvider = pickProvider(LLM_ORDER, providers.llm);
    // Empty model means "the provider's default", which every adapter handles.
    llmModel = "";
  }

  return {
    llmProvider,
    llmModel,
    voiceProvider: pickProvider(TTS_ORDER, providers.tts),
    sttProvider: pickProvider(STT_ORDER, providers.stt),
  };
}

/* ── What the browser may know ──────────────────────────────────── */

export type EngineStatus = {
  /** A language model is connected, so Test and Web call can run. */
  intelligence: boolean;
  /** A synthesis voice is connected, so calls use a Reyvoca voice. */
  voice: boolean;
  /** Speech recognition is connected. */
  transcription: boolean;
  /** Voices on offer — provider-native ids, no provider name attached. */
  voices: Voice[];
  /** Languages the active voice can speak. */
  languages: string[];
  /** True when `voices` came from the live library rather than the fallback. */
  live: boolean;
};

/** Live voice libraries are slow and rate-limited; one minute is plenty. */
const VOICE_TTL_MS = 60_000;
const voiceCache = new Map<string, { at: number; voices: Voice[]; live: boolean }>();

async function voicesFor(workspaceId: string, provider: string) {
  if (!provider) return { voices: [] as Voice[], live: false };

  const cacheKey = `${workspaceId}:${provider}`;
  const cached = voiceCache.get(cacheKey);
  if (cached && Date.now() - cached.at < VOICE_TTL_MS) {
    return { voices: cached.voices, live: cached.live };
  }

  const fallback = VOICE_CATALOG[provider] ?? [];
  const key = await providerKey(workspaceId, "tts", provider);
  if (!key) return { voices: fallback, live: false };

  let result = { voices: fallback, live: false };
  try {
    const live = await listVoices(provider, key.apiKey);
    if (live.length) result = { voices: live, live: true };
  } catch {
    // Provider unreachable — the curated catalogue keeps the editor usable.
  }
  voiceCache.set(cacheKey, { at: Date.now(), ...result });
  return result;
}

/**
 * The engine as the dashboard sees it. Safe to send to any signed-in
 * customer: capability flags, voices and languages, never a vendor.
 */
export async function engineStatus(workspaceId: string): Promise<EngineStatus> {
  const engine = await resolveEngine(workspaceId);
  const { voices, live } = await voicesFor(workspaceId, engine.voiceProvider);

  return {
    intelligence: !!engine.llmProvider,
    voice: !!engine.voiceProvider,
    transcription: !!engine.sttProvider,
    voices,
    languages: langsFor(engine.voiceProvider),
    live,
  };
}

/** Clears the cached voice libraries — called when a provider key changes. */
export function invalidateEngineCache(): void {
  voiceCache.clear();
}

/* ── What leaves the agents API ─────────────────────────────────── */

/**
 * Blanks the engine fields on an agent config before it leaves the server.
 *
 * The fields stay in storage — calls need them — but the browser gets empty
 * strings, so no dashboard screen can name a vendor even by accident. The
 * voice (`voiceId` / `voiceName`) is the customer's own choice and stays.
 */
export function hideEngine<T extends ResolvedEngine>(config: T): T {
  return { ...config, llmProvider: "", llmModel: "", voiceProvider: "", sttProvider: "" };
}

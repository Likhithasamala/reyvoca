/**
 * Sarvam Voice Agents (Samvaad) — the engine behind web calls.
 *
 * Every Reyvoca agent runs on one general-purpose Sarvam agent
 * (`SAMVAAD_APP_ID`). Its canvas reads input variables that the browser seeds
 * at call start — the Reyvoca agent's name, instructions and purpose — so a
 * customer's agent is callable the moment it is saved, with nothing to create
 * on Sarvam per agent. See docs/samvaad.md for that agent's setup.
 *
 * The API key never leaves the server: the browser SDK asks
 * `/api/samvaad/…/url` for a signed WebSocket URL, and that route adds the key.
 */

const RUNTIME_BASE = "https://apps.sarvam.ai/api/app-runtime/";
const ANALYTICS_BASE = "https://apps.sarvam.ai/api/analytics/v1/";
const TIMEOUT_MS = 15_000;

export type SamvaadConfig = {
  apiKey: string;
  orgId: string;
  workspaceId: string;
  appId: string;
  /** Pinned committed version; undefined means the latest committed one. */
  version?: number;
};

/** The configured Sarvam agent, or null when any required value is missing. */
export function samvaadConfig(): SamvaadConfig | null {
  const apiKey = process.env.SAMVAAD_API_KEY?.trim() ?? "";
  const orgId = process.env.SAMVAAD_ORG_ID?.trim() ?? "";
  const workspaceId = process.env.SAMVAAD_WORKSPACE_ID?.trim() ?? "";
  const appId = process.env.SAMVAAD_APP_ID?.trim() ?? "";
  if (!apiKey || !orgId || !workspaceId || !appId) return null;

  const version = Number(process.env.SAMVAAD_APP_VERSION);
  return {
    apiKey,
    orgId,
    workspaceId,
    appId,
    version: Number.isInteger(version) && version > 0 ? version : undefined,
  };
}

/** What the browser may know: ids only, never the key. */
export function publicSamvaadConfig(config: SamvaadConfig) {
  return {
    orgId: config.orgId,
    workspaceId: config.workspaceId,
    appId: config.appId,
    version: config.version,
  };
}

function withTimeout(): AbortSignal {
  return AbortSignal.timeout(TIMEOUT_MS);
}

/**
 * Asks Sarvam for a time-limited signed WebSocket URL for one interaction.
 * `search` carries the SDK's own query string (interaction_type, version).
 */
export async function requestSignedUrl(config: SamvaadConfig, search: string): Promise<Response> {
  const url =
    `${RUNTIME_BASE}orgs/${encodeURIComponent(config.orgId)}` +
    `/workspaces/${encodeURIComponent(config.workspaceId)}` +
    `/apps/${encodeURIComponent(config.appId)}/url${search}`;
  return fetch(url, {
    method: "GET",
    headers: { "X-API-Key": config.apiKey },
    cache: "no-store",
    signal: withTimeout(),
  });
}

export type TranscriptMessage = {
  role: "assistant" | "user";
  content: string;
};

/** Tag sent as the SDK's `user_identifier`, so Sarvam's record can be found again. */
export function callTag(callId: string): string {
  return `reyvoca-call-${callId}`;
}

type SarvamInteraction = {
  interaction_id: string;
  user_identifier?: string;
  duration_in_seconds?: number;
  ended_by?: string;
  original_transcript?: { role: string; text: string }[];
};

/** Sarvam wants ISO 8601 with an explicit offset. */
const isoWithOffset = (at: Date) => at.toISOString().replace("Z", "+00:00");

/**
 * Sarvam's record of one web call, found by the tag it was placed with.
 * Null while Sarvam has not finished writing it up (usually 30–60 s after
 * hang-up).
 */
export async function findInteraction(
  config: SamvaadConfig,
  tag: string,
  startedAt: Date,
): Promise<{
  interactionId: string;
  durationSeconds: number;
  endedBy: string;
  messages: TranscriptMessage[];
} | null> {
  const params = new URLSearchParams({
    // A margin either side absorbs clock skew between us and Sarvam.
    start_datetime: isoWithOffset(new Date(startedAt.getTime() - 10 * 60_000)),
    end_datetime: isoWithOffset(new Date(Date.now() + 10 * 60_000)),
    include_transcript: "true",
    limit: "5",
    filter_conditions: JSON.stringify([{ field: "user_identifier", operator: "equals", value: tag }]),
  });
  const url =
    `${ANALYTICS_BASE}${encodeURIComponent(config.orgId)}/${encodeURIComponent(config.workspaceId)}` +
    `/${encodeURIComponent(config.appId)}/interactions?${params.toString()}`;
  const response = await fetch(url, {
    headers: { "X-API-Key": config.apiKey },
    cache: "no-store",
    signal: withTimeout(),
  });
  if (!response.ok) {
    throw new Error(`Sarvam interactions request failed with ${response.status}.`);
  }
  const data = (await response.json()) as { items?: SarvamInteraction[] };
  const match = (data.items ?? []).find((item) => item.user_identifier === tag);
  if (!match) return null;

  return {
    interactionId: match.interaction_id,
    durationSeconds: Math.round(match.duration_in_seconds ?? 0),
    endedBy: match.ended_by ?? "",
    messages: (match.original_transcript ?? [])
      .filter((turn) => turn.text?.trim())
      .map((turn) => ({ role: turn.role === "user" ? "user" : "assistant", content: turn.text.trim() })),
  };
}

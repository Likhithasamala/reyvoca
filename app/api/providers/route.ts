import { adminGate } from "@/lib/server/admin";
import { mutate, newId, read, type StoredProviderConfig } from "@/lib/server/db";
import { invalidateEngineCache } from "@/lib/server/engine";
import { asString, jsonError, jsonOk, readJson } from "@/lib/server/http";
import { maskKey, validateProviderKey } from "@/lib/server/providers";
import { PLATFORM_WORKSPACE_ID } from "@/lib/server/scope";

const PROVIDER_TYPES = ["llm", "stt", "tts"] as const;
type ProviderType = (typeof PROVIDER_TYPES)[number];

/**
 * The provider stack — Reyvoca operators only.
 *
 * Which vendor serves speech, transcription or intelligence is not something
 * customers configure or get to see, so every method here is behind
 * `adminGate()` and reads and writes the platform workspace. The customer
 * dashboard asks `/api/engine` instead, which names no vendor.
 */

/** Strips the raw key before a record leaves the API. */
function publicProvider(row: StoredProviderConfig) {
  const copy: Partial<StoredProviderConfig> = { ...row };
  delete copy.apiKey;
  delete copy.workspaceId;
  return copy as Omit<StoredProviderConfig, "apiKey" | "workspaceId">;
}

/** GET /api/providers — saved platform keys (masked), oldest first. */
export async function GET() {
  const denied = await adminGate();
  if (denied) return denied;

  const providers = await read((db) =>
    db.providerConfigs
      .filter((row) => row.workspaceId === PLATFORM_WORKSPACE_ID)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(publicProvider),
  );
  return jsonOk({ providers });
}

/** POST /api/providers — verifies a key against the provider, then saves it. */
export async function POST(request: Request) {
  const denied = await adminGate();
  if (denied) return denied;

  const body = await readJson(request);
  if (!body) return jsonError("bad_request", "Expected a JSON body.", 400);

  const providerType = asString(body.providerType) as ProviderType;
  const providerName = asString(body.providerName).trim().toLowerCase();
  const apiKey = asString(body.apiKey).trim();
  const label = asString(body.label).trim() || "Default";
  const settings: Record<string, string> = {};
  if (typeof body.settings === "object" && body.settings !== null) {
    for (const [key, value] of Object.entries(body.settings as Record<string, unknown>)) {
      if (typeof value === "string") settings[key] = value;
    }
  }

  if (!PROVIDER_TYPES.includes(providerType)) {
    return jsonError("validation_error", "Unknown provider type.", 400);
  }
  if (!providerName) return jsonError("validation_error", "Pick a provider.", 400);
  if (!apiKey) return jsonError("validation_error", "Enter an API key.", 400);

  // Validate the key against the provider's real API before saving.
  const verdict = await validateProviderKey({ providerType, providerName, apiKey, extra: settings });
  if (!verdict.valid) {
    return jsonError("validation_error", verdict.message, 400);
  }

  const row: StoredProviderConfig = {
    id: newId(),
    workspaceId: PLATFORM_WORKSPACE_ID,
    providerType,
    providerName,
    label,
    apiKey,
    keyMasked: maskKey(apiKey),
    isValidated: true,
    settings,
    createdAt: new Date().toISOString(),
  };

  await mutate((db) => {
    db.providerConfigs.push(row);
  });
  // A new key can change which provider serves calls, so drop cached voices.
  invalidateEngineCache();

  return jsonOk({ provider: publicProvider(row), message: verdict.message }, 201);
}

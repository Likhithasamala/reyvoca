import { asString, jsonError, jsonOk, readJson } from "@/lib/server/http";
import { listVoices, providerKey } from "@/lib/server/providers";
import { currentWorkspaceId } from "@/lib/server/workspace";

/**
 * POST /api/providers/voices — the live voice library for a TTS provider,
 * fetched with the workspace's stored key. `live: false` tells the client to
 * fall back to its curated catalogue.
 */
export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return jsonError("bad_request", "Expected a JSON body.", 400);

  const provider = asString(body.provider).trim().toLowerCase();
  if (!provider) return jsonError("validation_error", "Name a provider.", 400);

  const workspaceId = await currentWorkspaceId();
  const key = await providerKey(workspaceId, "tts", provider);
  if (!key) return jsonOk({ voices: [], live: false, note: "No key saved for this provider." });

  try {
    const voices = await listVoices(provider, key.apiKey);
    return jsonOk({ voices, live: voices.length > 0 });
  } catch {
    return jsonOk({ voices: [], live: false, note: "Could not reach " + provider + "." });
  }
}

import { asString, jsonError, jsonOk, readJson } from "@/lib/server/http";
import { providerKey, synthesize } from "@/lib/server/providers";
import { currentWorkspaceId } from "@/lib/server/workspace";

/**
 * POST /api/agents/speak — synthesizes one line of agent speech for the Web
 * call, with the workspace's stored TTS key. Returns base64 audio to play.
 */
export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return jsonError("bad_request", "Expected a JSON body.", 400);

  const provider = asString(body.provider).trim().toLowerCase();
  const voiceId = asString(body.voiceId).trim();
  const text = asString(body.text);
  const language = asString(body.language).trim() || "English";

  if (!provider || !voiceId) return jsonError("validation_error", "Pick a voice first.", 400);
  if (!text.trim()) return jsonError("validation_error", "Nothing to speak.", 400);

  const workspaceId = await currentWorkspaceId();
  const key = await providerKey(workspaceId, "tts", provider);
  if (!key) {
    return jsonError(
      "validation_error",
      "No API key saved for this voice provider. Add one under Providers → Text-to-Speech.",
      400,
    );
  }

  try {
    const { audio, mime } = await synthesize({
      provider,
      voiceId,
      text,
      language,
      settings: key.settings,
      apiKey: key.apiKey,
    });
    return jsonOk({ audio, mime });
  } catch (error) {
    return jsonError("server_error", (error as Error).message || "Voice synthesis failed.", 502);
  }
}

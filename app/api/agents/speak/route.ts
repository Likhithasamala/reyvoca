import { resolveEngine } from "@/lib/server/engine";
import { asString, jsonError, jsonOk, readJson } from "@/lib/server/http";
import { providerKey, synthesize } from "@/lib/server/providers";
import { currentWorkspaceId } from "@/lib/server/workspace";

/**
 * POST /api/agents/speak — synthesizes one line of agent speech for the Web
 * call. The voice is the customer's choice; the synthesis provider behind it
 * is resolved here, never sent by the browser.
 */
export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return jsonError("bad_request", "Expected a JSON body.", 400);

  const voiceId = asString(body.voiceId).trim();
  const text = asString(body.text);
  const language = asString(body.language).trim() || "English";

  if (!voiceId) return jsonError("validation_error", "Pick a voice first.", 400);
  if (!text.trim()) return jsonError("validation_error", "Nothing to speak.", 400);

  const workspaceId = await currentWorkspaceId();
  const engine = await resolveEngine(workspaceId);
  const key = engine.voiceProvider
    ? await providerKey(workspaceId, "tts", engine.voiceProvider)
    : null;
  if (!key) {
    return jsonError("validation_error", "No Reyvoca voice is available yet.", 400);
  }

  try {
    const { audio, mime } = await synthesize({
      provider: engine.voiceProvider,
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

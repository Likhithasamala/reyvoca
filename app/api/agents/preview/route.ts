import { asString, jsonError, jsonOk, readJson } from "@/lib/server/http";
import { providerKey, runAgentReply, type ChatMessage } from "@/lib/server/providers";
import { currentWorkspaceId } from "@/lib/server/workspace";

/**
 * POST /api/agents/preview — one assistant turn for the Test chat / Web call.
 * The provider is called with the workspace's stored LLM key; the key itself
 * never reaches the browser.
 */
export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return jsonError("bad_request", "Expected a JSON body.", 400);

  const provider = asString(body.provider).trim().toLowerCase();
  const model = asString(body.model).trim();
  const system = asString(body.system);
  const rawMessages = Array.isArray(body.messages) ? body.messages : [];
  const messages: ChatMessage[] = rawMessages
    .map((m) => {
      const entry = (typeof m === "object" && m !== null ? m : {}) as Record<string, unknown>;
      return {
        role: entry.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: asString(entry.content),
      };
    })
    .filter((m) => m.content.trim())
    .slice(-30);

  if (!provider) return jsonError("validation_error", "Pick a language model provider first.", 400);
  if (!messages.length) return jsonError("validation_error", "Send at least one message.", 400);

  const workspaceId = await currentWorkspaceId();
  const key = await providerKey(workspaceId, "llm", provider);
  if (!key) {
    return jsonError(
      "validation_error",
      "No API key saved for this provider. Add one under Providers → Language Model.",
      400,
    );
  }

  try {
    const reply = await runAgentReply({ provider, model, apiKey: key.apiKey, system, messages });
    return jsonOk({ reply });
  } catch (error) {
    return jsonError("server_error", (error as Error).message || "The model could not reply.", 502);
  }
}

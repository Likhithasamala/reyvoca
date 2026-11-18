import { resolveEngine } from "@/lib/server/engine";
import { asString, jsonError, jsonOk, readJson } from "@/lib/server/http";
import { providerKey, runAgentReply, type ChatMessage } from "@/lib/server/providers";
import { currentWorkspaceId } from "@/lib/server/workspace";

/**
 * POST /api/agents/preview — one assistant turn for the Test chat / Web call.
 *
 * Which model answers is decided here, from the platform's connected stack and
 * the agent's template: the browser sends the conversation, never a provider.
 */
export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return jsonError("bad_request", "Expected a JSON body.", 400);

  const template = asString(body.template).trim();
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

  if (!messages.length) return jsonError("validation_error", "Send at least one message.", 400);

  const workspaceId = await currentWorkspaceId();
  const engine = await resolveEngine(workspaceId, template);
  if (!engine.llmProvider) {
    return jsonError("validation_error", "The Reyvoca engine is not available yet.", 400);
  }

  const key = await providerKey(workspaceId, "llm", engine.llmProvider);
  if (!key) {
    return jsonError("validation_error", "The Reyvoca engine is not available yet.", 400);
  }

  try {
    const reply = await runAgentReply({
      provider: engine.llmProvider,
      model: engine.llmModel,
      apiKey: key.apiKey,
      system,
      messages,
    });
    return jsonOk({ reply });
  } catch (error) {
    return jsonError("server_error", (error as Error).message || "The model could not reply.", 502);
  }
}

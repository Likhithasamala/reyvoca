"use client";

import { Loader2, MessageSquare, RotateCcw, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { AgentConfig } from "@/lib/agents/types";
import { providerLabel, withLanguageDirective } from "@/lib/agents/templates";
import { apiFetch } from "@/lib/calling/remote-store";

type Msg = { role: "user" | "assistant"; content: string };

/**
 * Live chat preview: type what a caller would say and get the agent's reply
 * from its configured model, via the server-held provider key.
 */
export function TestChat({
  config,
  firstMessage,
  instructions,
  name,
  onClose,
}: {
  config: AgentConfig;
  firstMessage: string;
  instructions: string;
  name: string;
  onClose: () => void;
}) {
  const system = withLanguageDirective(instructions, config.primaryLanguage, config.secondaryLanguages);
  const greeting = !config.skipWelcome && firstMessage.trim() ? firstMessage.trim() : "";
  const start = (): Msg[] => (greeting ? [{ role: "assistant", content: greeting }] : []);

  const [msgs, setMsgs] = useState<Msg[]>(start);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const noProvider = !config.llmProvider;

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [msgs, busy, err]);

  async function send() {
    const text = input.trim();
    if (!text || busy || noProvider) return;
    setErr("");
    const next: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    // Drop a leading assistant greeting so the model sees a user-first transcript.
    const forModel = next.filter((m, i) => !(i === 0 && m.role === "assistant"));
    try {
      const { reply } = await apiFetch<{ reply: string }>("/agents/preview", {
        method: "POST",
        body: JSON.stringify({
          provider: config.llmProvider,
          model: config.llmModel,
          system,
          messages: forModel,
        }),
      });
      setMsgs((m) => [...m, { role: "assistant", content: reply || "(no response)" }]);
    } catch (cause) {
      setErr((cause as Error).message || "Something went wrong.");
    }
    setBusy(false);
  }

  function reset() {
    setMsgs(start());
    setErr("");
    setInput("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Test agent"
        onClick={(event) => event.stopPropagation()}
        className="flex h-[32rem] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-float"
      >
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <span className="flex size-9 items-center justify-center rounded-lg border border-line bg-surface-muted text-ink">
            <MessageSquare className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">Test {name || "your agent"}</p>
            <p className="truncate text-xs text-ink-muted">
              {config.llmProvider
                ? providerLabel(config.llmProvider) + (config.llmModel ? " · " + config.llmModel : " · default model")
                : "No model selected"}
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            title="Restart conversation"
            aria-label="Restart"
            className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
          >
            <X className="size-[18px]" aria-hidden="true" />
          </button>
        </div>

        <div ref={scroller} className="flex-1 space-y-2.5 overflow-y-auto bg-canvas px-4 py-4">
          {noProvider && (
            <p className="rounded-lg border border-line bg-surface-muted px-3 py-2.5 text-xs leading-relaxed text-ink-muted">
              Pick a language model under <b>Model</b> in the editor, then come back to test this agent.
            </p>
          )}
          {!noProvider && msgs.length === 0 && (
            <p className="text-sm text-ink-subtle">Type what a caller would say to see how your agent responds.</p>
          )}
          {msgs.map((m, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                m.role === "user"
                  ? "ml-auto rounded-br-md bg-brand text-white"
                  : "mr-auto rounded-bl-md border border-line bg-surface text-ink",
              )}
            >
              {m.content}
            </div>
          ))}
          {busy && (
            <div className="mr-auto flex w-14 items-center justify-center gap-1 rounded-2xl rounded-bl-md border border-line bg-surface px-3.5 py-2.5">
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className="size-1.5 animate-dot rounded-full bg-ink-subtle"
                  style={{ animationDelay: `${dot * 0.15}s` }}
                />
              ))}
            </div>
          )}
          {err && (
            <p role="alert" className="rounded-lg border border-danger-line bg-danger-soft px-3 py-2 text-xs text-danger">
              {err}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-line bg-surface px-3 py-3">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") send();
            }}
            placeholder={noProvider ? "Select a model first…" : "Type a caller message…"}
            disabled={busy || noProvider}
            aria-label="Caller message"
            className="block h-10 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-subtle focus:border-ink focus:ring-4 focus:ring-surface-muted focus:outline-none"
          />
          <button
            type="button"
            onClick={send}
            disabled={busy || noProvider || !input.trim()}
            aria-label="Send"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand text-white transition-colors hover:bg-brand-hover disabled:pointer-events-none disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

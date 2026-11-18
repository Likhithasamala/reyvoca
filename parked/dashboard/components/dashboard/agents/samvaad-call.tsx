"use client";

import { Mic, MicOff, PhoneCall, PhoneOff, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ConversationAgent } from "sarvam-conv-ai-sdk/browser";
import { formatClock, formatCredits } from "@/lib/billing/format";
import { cn } from "@/lib/cn";
import type { AgentConfig } from "@/lib/agents/types";
import { apiFetch } from "@/lib/calling/remote-store";

/** Public ids from GET /api/calls/web — never the API key. */
export type SamvaadIds = {
  orgId: string;
  workspaceId: string;
  appId: string;
  version?: number;
};

/** Languages Sarvam accepts as `initial_language_name`. */
const SARVAM_LANGUAGES = new Set([
  "Bengali",
  "Gujarati",
  "Kannada",
  "Malayalam",
  "Tamil",
  "Telugu",
  "Punjabi",
  "Odia",
  "Marathi",
  "Hindi",
  "English",
]);

/** Same-origin relay that adds the Sarvam key (app/api/samvaad/…). */
const RELAY_BASE = "/api/samvaad/";

type Msg = { role: "user" | "assistant"; content: string };

/** Reply of POST /api/calls/:id/meter — the server's view of what the call costs. */
type Meter = {
  minutesCharged: number;
  chargedPaise: number;
  ratePaise: number;
  balancePaise: number;
  paidUntil: number | null;
  canContinue: boolean;
};

/** How often the browser reports the call as running. */
const METER_EVERY_MS = 10_000;
/** Hang up this long before the paid minute runs out when credits are gone. */
const CUTOFF_MARGIN_MS = 3_000;
type CallStatus = "idle" | "connecting" | "listening" | "speaking" | "ended" | "error";

const STATUS_LABEL: Record<CallStatus, string> = {
  idle: "Ready to call",
  connecting: "Connecting…",
  listening: "Listening…",
  speaking: "Speaking…",
  ended: "Call ended",
  error: "Call error",
};

/**
 * Web call on Sarvam Voice Agents.
 *
 * Sarvam runs the whole conversation — speech recognition, the model, the
 * voice and turn-taking — over one WebSocket. Reyvoca's part is to say who the
 * agent is: its name, instructions and opening line are seeded into the
 * general-purpose Sarvam agent at call start, so any saved agent is callable
 * at once. The call and its Sarvam interaction id are recorded so the
 * transcript can be fetched from Sarvam afterwards.
 */
export function SamvaadCall({
  ids,
  agentId,
  config,
  firstMessage,
  instructions,
  name,
  onClose,
}: {
  ids: SamvaadIds;
  agentId?: string;
  config: AgentConfig;
  firstMessage: string;
  instructions: string;
  name: string;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [err, setErr] = useState("");
  const [muted, setMuted] = useState(false);
  const [active, setActive] = useState(false);

  const agentRef = useRef<ConversationAgent | null>(null);
  const callIdRef = useRef<string | null>(null);
  const lastCallIdRef = useRef<string | null>(null);
  const connectedAtRef = useRef(0);
  const limitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cutoffTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [meter, setMeter] = useState<Meter | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [lowCredits, setLowCredits] = useState(false);
  const closingRef = useRef(false);
  const scroller = useRef<HTMLDivElement>(null);

  const language = SARVAM_LANGUAGES.has(config.primaryLanguage) ? config.primaryLanguage : "English";

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [msgs, status, err]);
  // Hang up if the panel unmounts mid-call.
  useEffect(() => () => void hangup(), []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Opens the call record; its tag lets the server find Sarvam's copy later. */
  async function openCall(): Promise<string> {
    const { call, tag } = await apiFetch<{ call: { id: string }; tag: string }>("/calls/web", {
      method: "POST",
      body: JSON.stringify({ agentId, agentName: name }),
    });
    callIdRef.current = call.id;
    return tag;
  }

  /**
   * Sarvam writes the call up within about a minute of hang-up. Poll briefly and
   * show its transcript when the call streamed none live.
   */
  async function loadTranscript(callId: string) {
    // Sarvam files a call roughly 30–60 s after hang-up.
    for (let attempt = 0; attempt < 18; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      try {
        const data = await apiFetch<{ pending: boolean; messages: Msg[] }>(`/calls/${callId}/transcript`);
        if (data.pending) continue;
        if (data.messages.length) setMsgs((prev) => (prev.length ? prev : data.messages));
        return;
      } catch {
        return;
      }
    }
  }

  async function recordEnd(outcome: string) {
    const callId = callIdRef.current;
    callIdRef.current = null;
    if (!callId) return;
    lastCallIdRef.current = callId;
    const seconds = connectedAtRef.current ? Math.round((Date.now() - connectedAtRef.current) / 1000) : 0;
    try {
      const { call } = await apiFetch<{ call: { minutes: number; creditsPaise: number } }>(`/calls/${callId}`, {
        method: "PATCH",
        body: JSON.stringify({ durationSeconds: seconds, outcome }),
      });
      // The final started minute is charged on hang-up; show the closing total.
      setMeter((prev) =>
        prev
          ? {
              ...prev,
              minutesCharged: call.minutes,
              balancePaise: prev.balancePaise - (call.creditsPaise - prev.chargedPaise),
              chargedPaise: call.creditsPaise,
            }
          : prev,
      );
    } catch {
      /* best effort */
    }
  }

  /** Reports the call as running; the server charges each minute as it starts. */
  async function pingMeter(connected = false) {
    const callId = callIdRef.current;
    if (!callId) return;
    try {
      const data = await apiFetch<{ meter: Meter }>(`/calls/${callId}/meter`, {
        method: "POST",
        body: JSON.stringify({ connected }),
      });
      if (closingRef.current) return;
      setMeter(data.meter);
      // Out of credits: finish the minute already paid for, then hang up.
      if (!data.meter.canContinue && data.meter.paidUntil && !cutoffTimerRef.current) {
        setLowCredits(true);
        const wait = Math.max(0, data.meter.paidUntil - Date.now() - CUTOFF_MARGIN_MS);
        cutoffTimerRef.current = setTimeout(() => void hangup("Out of credits"), wait);
      }
    } catch {
      // A missed ping is harmless: the server meters on its own clock.
    }
  }

  async function startCall() {
    setErr("");
    setMsgs([]);
    setMuted(false);
    setStatus("connecting");
    setActive(true);
    closingRef.current = false;
    connectedAtRef.current = 0;
    setMeter(null);
    setElapsed(0);
    setLowCredits(false);

    try {
      // Browser-only module: loaded on demand so it never runs on the server.
      const { ConversationAgent, BrowserAudioInterface, InteractionType, AgentState } = await import(
        "sarvam-conv-ai-sdk/browser"
      );

      const tag = await openCall();
      const greeting = !config.skipWelcome && firstMessage.trim() ? firstMessage.trim() : undefined;
      const agent = new ConversationAgent({
        apiKey: "", // the relay adds the key server-side
        baseUrl: RELAY_BASE,
        audioInterface: new BrowserAudioInterface(),
        config: {
          org_id: ids.orgId,
          workspace_id: ids.workspaceId,
          app_id: ids.appId,
          version: ids.version,
          user_identifier: tag,
          user_identifier_type: "custom",
          interaction_type: InteractionType.CALL,
          input_sample_rate: 16000,
          output_sample_rate: 16000,
          initial_language_name: language as never,
          initial_bot_message: greeting,
          // Read by the general-purpose Sarvam agent (docs/samvaad.md).
          agent_variables: {
            reyvoca_agent_name: name || "Assistant",
            reyvoca_instructions: instructions || "Be a helpful, concise voice assistant.",
            reyvoca_languages: [config.primaryLanguage, ...config.secondaryLanguages].join(", "),
          },
        },
        transcriptCallback: async (msg) => {
          const content = msg.content?.trim();
          if (!content) return;
          setMsgs((prev) => [...prev, { role: msg.role === "user" ? "user" : "assistant", content }]);
        },
        stateCallback: (next) => {
          if (closingRef.current) return;
          if (next === AgentState.SPEAKING) setStatus("speaking");
          else if (next === AgentState.LISTENING || next === AgentState.CONNECTED) setStatus("listening");
          else if (next === AgentState.ERROR) setStatus("error");
        },
        endCallback: async () => {
          // Sarvam ended the call (agent hung up, limit, or network).
          if (closingRef.current) return;
          closingRef.current = true;
          finishUi("ended");
          await recordEnd("Completed");
          void afterCall();
        },
      });
      agentRef.current = agent;

      await agent.start();
      const connected = await agent.waitForConnect(15);
      if (!connected) throw new Error("The voice service did not answer. Try again.");

      connectedAtRef.current = Date.now();
      setStatus("listening");
      void pingMeter(true);
      clockTimerRef.current = setInterval(() => {
        setElapsed(Math.round((Date.now() - connectedAtRef.current) / 1000));
      }, 1000);
      pingTimerRef.current = setInterval(() => void pingMeter(), METER_EVERY_MS);

      // Enforce the agent's maximum call length.
      const limit = Math.max(60, config.maxCallSeconds || 300) * 1000;
      limitTimerRef.current = setTimeout(() => void hangup("Time limit"), limit);
    } catch (error) {
      closingRef.current = true;
      try {
        await agentRef.current?.stop();
      } catch {}
      agentRef.current = null;
      finishUi("error");
      setErr(describeError(error));
      await recordEnd("Failed");
    }
  }

  function finishUi(next: CallStatus) {
    if (limitTimerRef.current) clearTimeout(limitTimerRef.current);
    limitTimerRef.current = null;
    if (cutoffTimerRef.current) clearTimeout(cutoffTimerRef.current);
    cutoffTimerRef.current = null;
    if (clockTimerRef.current) clearInterval(clockTimerRef.current);
    if (pingTimerRef.current) clearInterval(pingTimerRef.current);
    clockTimerRef.current = null;
    pingTimerRef.current = null;
    setActive(false);
    setStatus(next);
  }

  async function hangup(outcome = "Completed") {
    if (closingRef.current || !agentRef.current) return;
    closingRef.current = true;
    const agent = agentRef.current;
    agentRef.current = null;
    finishUi("ended");
    try {
      await agent.stop();
    } catch {}
    await recordEnd(outcome);
    void afterCall();
  }

  async function afterCall() {
    const callId = lastCallIdRef.current;
    if (callId) await loadTranscript(callId);
  }

  function toggleMute() {
    const agent = agentRef.current;
    if (!agent) return;
    if (muted) agent.unmute();
    else agent.mute();
    setMuted(!muted);
  }

  const live = status === "listening" || status === "speaking" || status === "connecting";

  const close = () => {
    void hangup();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Web call"
        onClick={(event) => event.stopPropagation()}
        className="flex h-[36rem] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-float"
      >
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <span className="flex size-9 items-center justify-center rounded-lg border border-line bg-surface-muted text-ink">
            <PhoneCall className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">Call {name || "your agent"}</p>
            <p className="truncate text-xs text-ink-muted">Reyvoca voice · {language}</p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
          >
            <X className="size-[18px]" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-2 border-b border-line bg-canvas py-5">
          <div className="relative">
            <span
              className={cn(
                "relative z-10 flex size-16 items-center justify-center rounded-full border transition-colors",
                status === "speaking"
                  ? "border-accent-soft bg-accent-wash text-accent-strong"
                  : live
                    ? "border-line-strong bg-surface text-ink"
                    : "border-line bg-surface-muted text-ink-subtle",
              )}
            >
              <PhoneCall className="size-6" aria-hidden="true" />
            </span>
            {live && (
              <span
                aria-hidden="true"
                className="absolute inset-0 animate-ping-soft rounded-full border-2 border-accent"
              />
            )}
          </div>
          <p className="text-xs font-medium text-ink-muted" aria-live="polite">
            {muted && active ? "Muted" : STATUS_LABEL[status]}
          </p>
          {meter && (
            <dl className="mt-1 grid grid-cols-3 gap-6 text-center tabular-nums">
              <div>
                <dt className="text-[0.6875rem] text-ink-subtle">Time</dt>
                <dd className="text-sm font-semibold text-ink">{formatClock(elapsed)}</dd>
              </div>
              <div>
                <dt className="text-[0.6875rem] text-ink-subtle">Credits used</dt>
                <dd className="text-sm font-semibold text-ink">{formatCredits(meter.chargedPaise)}</dd>
              </div>
              <div>
                <dt className="text-[0.6875rem] text-ink-subtle">Balance</dt>
                <dd className={cn("text-sm font-semibold", meter.canContinue ? "text-ink" : "text-warning")}>
                  {formatCredits(meter.balancePaise)}
                </dd>
              </div>
            </dl>
          )}
          {meter && (
            <p className="text-[0.6875rem] text-ink-subtle">
              {formatCredits(meter.ratePaise)} credits per started minute
            </p>
          )}
        </div>

        <div ref={scroller} className="flex-1 space-y-2.5 overflow-y-auto bg-canvas px-4 py-4">
          {status === "idle" && msgs.length === 0 && (
            <p className="rounded-lg border border-line bg-surface-muted px-3 py-2.5 text-xs leading-relaxed text-ink-muted">
              Start the call and allow microphone access. Speak naturally — you can interrupt the agent at any time.
            </p>
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
          {lowCredits && active && (
            <p role="status" className="rounded-lg border border-warning-line bg-warning-soft px-3 py-2 text-xs text-warning">
              Credits are running out. The call will end when the current minute is used up.
            </p>
          )}
          {err && (
            <p role="alert" className="rounded-lg border border-danger-line bg-danger-soft px-3 py-2 text-xs text-danger">
              {err}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 border-t border-line bg-surface px-4 py-4">
          {!active ? (
            <button
              type="button"
              onClick={() => void startCall()}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-success px-7 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <PhoneCall className="size-4" aria-hidden="true" />
              {status === "ended" || status === "error" ? "Call again" : "Start call"}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={toggleMute}
                disabled={status === "connecting"}
                aria-label={muted ? "Unmute" : "Mute"}
                className={cn(
                  "flex size-11 items-center justify-center rounded-full border transition-colors disabled:opacity-50",
                  muted
                    ? "border-warning-line bg-warning-soft text-warning"
                    : "border-line-strong bg-surface text-ink hover:bg-surface-muted",
                )}
              >
                {muted ? <MicOff className="size-[18px]" aria-hidden="true" /> : <Mic className="size-[18px]" aria-hidden="true" />}
              </button>
              <button
                type="button"
                onClick={() => void hangup()}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-danger px-7 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <PhoneOff className="size-4" aria-hidden="true" /> End call
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Plain-language message for the failures a caller can actually hit. */
function describeError(error: unknown): string {
  const name = error instanceof Error ? error.name : "";
  const message = error instanceof Error ? error.message : "";
  if (name === "NotAllowedError" || /permission|denied/i.test(message)) {
    return "Microphone access was blocked. Allow it in the browser's address bar, then call again.";
  }
  if (name === "NotFoundError" && /microphone|device/i.test(message)) {
    return "No microphone was found. Connect one and call again.";
  }
  if (/rate limit/i.test(message)) return "Too many calls at once. Wait a minute and try again.";
  if (/not configured/i.test(message)) return "Web calls are not set up for this workspace yet.";
  if (/no committed version|not found/i.test(message)) {
    return "The voice agent is not published yet. Commit a version on Sarvam, then call again.";
  }
  return message || "The call could not start. Try again.";
}

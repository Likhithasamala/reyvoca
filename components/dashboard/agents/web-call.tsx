"use client";

import { Mic, MicOff, PhoneCall, PhoneOff, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { AgentConfig } from "@/lib/agents/types";
import {
  SR_LOCALE,
  detectLang,
  providerLabel,
  withLanguageDirective,
} from "@/lib/agents/templates";
import { apiFetch } from "@/lib/calling/remote-store";

/* Minimal typings for the browser SpeechRecognition API (not in lib.dom). */
type SpeechRecognitionResultLike = { isFinal: boolean; 0: { transcript: string } };
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechRecognitionResultLike };
};
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
};
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

type Msg = { role: "user" | "assistant"; content: string };
type CallStatus = "idle" | "connecting" | "listening" | "thinking" | "speaking" | "ended" | "error";

const STATUS_LABEL: Record<CallStatus, string> = {
  idle: "Ready to call",
  connecting: "Connecting…",
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "Speaking…",
  ended: "Call ended",
  error: "Call error",
};

/**
 * Web call — a real voice conversation in the browser.
 *
 * Mic → browser speech recognition → the agent's configured LLM → the agent's
 * configured TTS voice → playback, with auto turn-taking and barge-in. Falls
 * back to the browser's own voice if no TTS provider/voice is set.
 */
export function WebCall({
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
  const c = config;
  const system = withLanguageDirective(instructions, c.primaryLanguage, c.secondaryLanguages);
  const greeting = !c.skipWelcome && firstMessage.trim() ? firstMessage.trim() : "";
  const locale = SR_LOCALE[c.primaryLanguage] ?? "en-US";
  const SR: SpeechRecognitionCtor | null =
    typeof window !== "undefined"
      ? ((window as unknown as Record<string, unknown>).SpeechRecognition as SpeechRecognitionCtor) ??
        ((window as unknown as Record<string, unknown>).webkitSpeechRecognition as SpeechRecognitionCtor) ??
        null
      : null;
  const supported = !!SR;
  const noProvider = !c.llmProvider;
  // The languages this agent may use; the call starts in primary and
  // auto-switches among these when the model answers in another one.
  const allowedLangs = [c.primaryLanguage, ...(c.secondaryLanguages ?? [])].filter(
    (value, index, all) => value && all.indexOf(value) === index,
  );

  const [status, setStatus] = useState<CallStatus>("idle");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [partial, setPartial] = useState("");
  const [err, setErr] = useState("");
  const [muted, setMuted] = useState(false);
  const [callLang, setCallLang] = useState(c.primaryLanguage || "English");
  const [active, setActive] = useState(false);

  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const msgsRef = useRef<Msg[]>([]);
  const activeRef = useRef(false);
  const mutedRef = useRef(false);
  const scroller = useRef<HTMLDivElement>(null);
  const speakingRef = useRef(false); // agent audio is currently playing
  const speakFinishRef = useRef<(() => void) | null>(null); // lets a barge-in end playback early
  const thinkingRef = useRef(false); // waiting on the LLM (don't start another turn)
  const pendingUserRef = useRef(""); // speech heard while the LLM was thinking — queued, not dropped
  const bargeArmedRef = useRef(false); // barge-in enabled a moment after speech starts (avoids self-echo)
  const callLangRef = useRef(c.primaryLanguage || "English");

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [msgs, partial, status, err]);
  useEffect(() => () => hangup(), []); // cleanup on unmount

  // Update msgsRef synchronously (not inside the setState updater, which runs
  // later) so askLLM, called right after addMsg, sees the new message.
  const addMsg = (role: Msg["role"], content: string) => {
    const next = [...msgsRef.current, { role, content }];
    msgsRef.current = next;
    setMsgs(next);
  };

  function speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(watchdog);
        speakingRef.current = false;
        speakFinishRef.current = null;
        if (activeRef.current && !thinkingRef.current && !mutedRef.current) setStatus("listening");
        resolve();
      };
      // Never let a stuck voice freeze the call.
      const watchdog = setTimeout(finish, Math.min(30000, 3000 + (text || "").length * 90));
      speakFinishRef.current = finish;
      speakingRef.current = true;
      bargeArmedRef.current = false;
      // Let the voice get going before accepting barge-in (reduces the mic hearing the agent).
      setTimeout(() => {
        bargeArmedRef.current = true;
      }, 200);
      setStatus("speaking");

      void (async () => {
        try {
          if (c.voiceProvider && c.voiceId) {
            const lang = callLangRef.current || c.primaryLanguage;
            const d = await apiFetch<{ audio?: string; mime?: string }>("/agents/speak", {
              method: "POST",
              body: JSON.stringify({ provider: c.voiceProvider, voiceId: c.voiceId, text, language: lang }),
            });
            if (d.audio) {
              const audio = new Audio("data:" + (d.mime || "audio/mpeg") + ";base64," + d.audio);
              audioRef.current = audio;
              audio.onended = finish;
              audio.onerror = () => browserSpeak(text, finish);
              await audio.play().catch(() => browserSpeak(text, finish));
              return;
            }
          }
        } catch {
          // Provider voice unavailable — the browser voice keeps the call going.
        }
        browserSpeak(text, finish);
      })();
    });
  }

  function browserSpeak(text: string, finish: () => void) {
    try {
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = SR_LOCALE[callLangRef.current] ?? locale;
        utterance.onend = finish;
        utterance.onerror = finish;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        return;
      }
    } catch {
      /* fall through */
    }
    finish();
  }

  // Barge-in: cut the agent off immediately when the caller starts talking.
  function stopSpeaking() {
    if (!speakingRef.current) return;
    try {
      audioRef.current?.pause();
    } catch {}
    audioRef.current = null;
    try {
      window.speechSynthesis?.cancel();
    } catch {}
    const finish = speakFinishRef.current;
    speakFinishRef.current = null;
    finish?.();
  }

  async function askLLM(): Promise<string> {
    const conv = msgsRef.current.filter((m, i) => !(i === 0 && m.role === "assistant"));
    const d = await apiFetch<{ reply?: string }>("/agents/preview", {
      method: "POST",
      body: JSON.stringify({ provider: c.llmProvider, model: c.llmModel, system, messages: conv }),
    });
    return d.reply || "(no response)";
  }

  // One continuous recognizer runs the whole call so the caller can talk any
  // time — including over the agent (barge-in). Chrome ends recognition
  // periodically, so restart it while the call is active.
  function startRecognition() {
    if (!activeRef.current || !SR) return;
    try {
      recRef.current?.abort();
    } catch {}
    let rec: SpeechRecognitionLike;
    try {
      rec = new SR();
    } catch {
      return;
    }
    recRef.current = rec;
    rec.lang = SR_LOCALE[callLangRef.current] ?? locale;
    rec.interimResults = true;
    rec.continuous = true;
    rec.maxAlternatives = 1;
    rec.onresult = (event) => {
      if (mutedRef.current) {
        setPartial("");
        return;
      }
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) {
          const text = (transcript || "").trim();
          setPartial("");
          if (!text) continue;
          if (speakingRef.current) stopSpeaking(); // caller spoke over the agent → cut it off
          if (thinkingRef.current) {
            // Reply is still being generated — queue this instead of dropping it,
            // and keep it on screen so the caller knows they were heard.
            pendingUserRef.current = (pendingUserRef.current + " " + text).trim();
            setPartial(pendingUserRef.current);
            continue;
          }
          void handleUser(text);
        } else {
          interim += transcript;
        }
      }
      if (interim) {
        setPartial(interim);
        // Interrupt as soon as the caller clearly starts talking (after the arm delay).
        if (speakingRef.current && bargeArmedRef.current && interim.trim().length >= 2) stopSpeaking();
      }
    };
    rec.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setErr("Microphone was blocked. Allow mic access and start the call again.");
        hangup();
      }
    };
    rec.onend = () => {
      setPartial("");
      if (activeRef.current) {
        try {
          rec.start();
        } catch {
          setTimeout(startRecognition, 250);
        }
      }
    };
    try {
      rec.start();
    } catch {
      setTimeout(startRecognition, 250);
    }
  }

  async function handleUser(text: string) {
    addMsg("user", text);
    setStatus("thinking");
    thinkingRef.current = true;
    let reply: string;
    try {
      reply = await askLLM();
    } catch (cause) {
      thinkingRef.current = false;
      pendingUserRef.current = "";
      setPartial("");
      if (activeRef.current && !mutedRef.current) setStatus("listening");
      setErr((cause as Error).message || "Something went wrong.");
      return;
    }
    thinkingRef.current = false;
    if (!activeRef.current) return;
    setErr("");
    // Auto-switch: detect the language the model answered in (among the agent's
    // allowed languages) and move the voice + recognizer to it for next turns.
    const detected = detectLang(reply, allowedLangs);
    if (detected && detected !== callLangRef.current) {
      callLangRef.current = detected;
      setCallLang(detected);
      startRecognition(); // re-arm the recognizer in the new language
    }
    addMsg("assistant", reply);
    await speak(reply);
    // Anything the caller said while the reply was being generated becomes the next turn.
    const queued = pendingUserRef.current.trim();
    pendingUserRef.current = "";
    if (queued && activeRef.current && !mutedRef.current) {
      setPartial("");
      void handleUser(queued);
    }
  }

  async function startCall() {
    setErr("");
    if (noProvider) {
      setErr("Select a language model under Model to start a call.");
      return;
    }
    if (!supported) {
      setErr("Your browser does not support in-browser speech. Use Chrome or Edge, or use the chat Test instead.");
      return;
    }
    setStatus("connecting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      setErr("Microphone access is needed for a web call. Allow it and try again.");
      setStatus("idle");
      return;
    }
    activeRef.current = true;
    setActive(true);
    setMuted(false);
    mutedRef.current = false;
    thinkingRef.current = false;
    pendingUserRef.current = "";
    setMsgs([]);
    msgsRef.current = [];
    callLangRef.current = c.primaryLanguage || "English";
    setCallLang(callLangRef.current);
    startRecognition(); // listen from the start — and through the greeting
    if (greeting) {
      addMsg("assistant", greeting);
      void speak(greeting); // not awaited, so the caller can talk over the greeting
    } else {
      setStatus("listening");
    }
  }

  function hangup() {
    activeRef.current = false;
    setActive(false);
    speakingRef.current = false;
    thinkingRef.current = false;
    pendingUserRef.current = "";
    speakFinishRef.current = null;
    try {
      recRef.current?.abort();
    } catch {}
    recRef.current = null;
    try {
      audioRef.current?.pause();
    } catch {}
    audioRef.current = null;
    try {
      window.speechSynthesis?.cancel();
    } catch {}
    setPartial("");
    setStatus((value) => (value === "idle" ? "idle" : "ended"));
  }

  function toggleMute() {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    setPartial("");
    // Recognition keeps running; while muted the onresult handler ignores input.
    if (!next && activeRef.current && !recRef.current) startRecognition();
  }

  const live = status === "listening" || status === "thinking" || status === "speaking" || status === "connecting";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={() => {
        hangup();
        onClose();
      }}
    >
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
            <p className="truncate text-xs text-ink-muted">
              {c.voiceProvider && c.voiceId ? providerLabel(c.voiceProvider) + " voice" : "Browser voice"} · {callLang}
              {callLang !== c.primaryLanguage ? " (switched)" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              hangup();
              onClose();
            }}
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
          <p className="text-xs font-medium text-ink-muted">{STATUS_LABEL[status]}</p>
        </div>

        <div ref={scroller} className="flex-1 space-y-2.5 overflow-y-auto bg-canvas px-4 py-4">
          {noProvider && (
            <p className="rounded-lg border border-line bg-surface-muted px-3 py-2.5 text-xs leading-relaxed text-ink-muted">
              Pick a language model under <b>Model</b> to make a call.
            </p>
          )}
          {!supported && !noProvider && (
            <p className="rounded-lg border border-line bg-surface-muted px-3 py-2.5 text-xs leading-relaxed text-ink-muted">
              In-browser voice needs Chrome or Edge. In other browsers, use the chat <b>Test</b> instead.
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
          {partial && (
            <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-brand/50 px-3.5 py-2 text-sm leading-relaxed text-white">
              {partial}
            </div>
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
              onClick={startCall}
              disabled={!supported}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-success px-7 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-60"
            >
              <PhoneCall className="size-4" aria-hidden="true" />
              {status === "ended" ? "Call again" : "Start call"}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted ? "Unmute" : "Mute"}
                className={cn(
                  "flex size-11 items-center justify-center rounded-full border transition-colors",
                  muted
                    ? "border-warning-line bg-warning-soft text-warning"
                    : "border-line-strong bg-surface text-ink hover:bg-surface-muted",
                )}
              >
                {muted ? <MicOff className="size-[18px]" aria-hidden="true" /> : <Mic className="size-[18px]" aria-hidden="true" />}
              </button>
              <button
                type="button"
                onClick={hangup}
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

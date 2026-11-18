"use client";

import { Mic, MicOff, PhoneCall, PhoneOff, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { AgentConfig } from "@/lib/agents/types";
import {
  SR_LOCALE,
  allowedCallLanguages,
  detectLang,
  latinFallbackLang,
  requestedLanguage,
  withLanguageDirective,
} from "@/lib/agents/templates";
import { apiFetch } from "@/lib/calling/remote-store";
import { useEngine } from "@/lib/engine/store";

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

/* Turn-taking timings. Chrome finalizes a fragment at every small pause, so
   end-of-speech is decided here, not by the recognizer. */
const SILENCE_MS = 1200; // silence that ends a turn
const SILENCE_DONE_MS = 600; // …shorter when the fragment already looks finished
const MERGE_AFTER_REPLY_MS = 1500; // a reply just started → late words still belong to the same turn
const BARGE_MIN_CHARS = 4; // interim speech this long interrupts the agent
const ECHO_MIN_CHARS = 8; // …unless it is this much of the agent's own words coming back
const ECHO_TAIL_MS = 1200; // after playback ends, the mic's echo of it may still be finalizing

const normalizeSpeech = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
/** True when the fragment ends on a sentence boundary — safe to answer sooner. */
const looksComplete = (value: string) => /[.?!。？！।॥…]\s*$/.test(value.trim());

/** Sentence groups for TTS. The first chunk is kept short so its audio starts
    playing while the rest of the reply is still being synthesized. */
function splitForTts(text: string): string[] {
  const clean = (text || "").trim();
  if (!clean) return [];
  if (clean.length <= 110) return [clean];
  const sentences = clean.split(/(?<=[.?!。？！।॥…])\s+/).filter(Boolean);
  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    const limit = chunks.length === 0 ? 90 : 220;
    if (current && (current + " " + sentence).length > limit) {
      chunks.push(current);
      current = sentence;
    } else {
      current = current ? current + " " + sentence : sentence;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

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
 * Mic → browser speech recognition → the managed Reyvoca engine → the agent's
 * chosen voice → playback, with auto turn-taking and barge-in. Falls back to
 * the browser's own voice when no Reyvoca voice is available.
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
  const { engine, ready: engineReady } = useEngine();
  // A Reyvoca voice is in play only when the engine has one and the agent has
  // picked it; the browser voice stays on the agent's configured languages.
  const reyvocaVoice = engine.voice && !!c.voiceId;
  // Languages the voice can actually speak. Only the engine voice can promise
  // multilingual output.
  const voiceLangs = reyvocaVoice ? engine.languages : [];
  const system = withLanguageDirective(instructions, c.primaryLanguage, c.secondaryLanguages, voiceLangs);
  const greeting = !c.skipWelcome && firstMessage.trim() ? firstMessage.trim() : "";
  const locale = SR_LOCALE[c.primaryLanguage] ?? "en-US";
  const SR: SpeechRecognitionCtor | null =
    typeof window !== "undefined"
      ? ((window as unknown as Record<string, unknown>).SpeechRecognition as SpeechRecognitionCtor) ??
        ((window as unknown as Record<string, unknown>).webkitSpeechRecognition as SpeechRecognitionCtor) ??
        null
      : null;
  const supported = !!SR;
  const noEngine = engineReady && !engine.intelligence;
  // The languages this agent may use; the call starts in primary and
  // auto-switches among these when the model answers in another one.
  const allowedLangs = allowedCallLanguages(c.primaryLanguage, c.secondaryLanguages, voiceLangs);

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
  const finalBufRef = useRef(""); // finalized speech fragments awaiting end-of-speech
  const endpointTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bargeArmedRef = useRef(false); // barge-in enabled a moment after speech starts (avoids self-echo)
  const callLangRef = useRef(c.primaryLanguage || "English");
  const turnRef = useRef(0); // generation of the turn in flight; a newer one voids an older reply
  const spokenTextRef = useRef(""); // what the agent is saying right now (to recognise its own echo)
  const speakStartRef = useRef(0); // when the current reply started playing
  const interruptedRef = useRef(false); // the caller cut the current reply off
  const speechStartRef = useRef(0); // when the caller's current run of speech began
  const speakEndRef = useRef(0); // when the agent's last reply finished playing
  const langHintRef = useRef(""); // allowed language the caller appears to have asked for

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
        speakEndRef.current = Date.now();
        if (activeRef.current && !thinkingRef.current && !mutedRef.current) setStatus("listening");
        resolve();
      };
      // Never let a stuck voice freeze the call.
      const watchdog = setTimeout(finish, Math.min(30000, 3000 + (text || "").length * 90));
      speakFinishRef.current = finish;
      speakingRef.current = true;
      spokenTextRef.current = text || "";
      speakStartRef.current = Date.now();
      interruptedRef.current = false;
      bargeArmedRef.current = false;
      // Let the voice get going before accepting barge-in (reduces the mic hearing the agent).
      setTimeout(() => {
        bargeArmedRef.current = true;
      }, 350);
      setStatus("speaking");

      void (async () => {
        try {
          if (reyvocaVoice) {
            const lang = callLangRef.current || c.primaryLanguage;
            // Pipelined synthesis: play the first short chunk as soon as it is
            // ready and fetch the next chunk while the current one plays, so
            // the caller hears the reply ~1s sooner on multi-sentence answers.
            const parts = splitForTts(text);
            const fetchPart = (value: string) =>
              apiFetch<{ audio?: string; mime?: string }>("/agents/speak", {
                method: "POST",
                body: JSON.stringify({ voiceId: c.voiceId, text: value, language: lang }),
              });
            const playPart = (audioB64: string, mime?: string) =>
              new Promise<boolean>((resolve) => {
                const audio = new Audio("data:" + (mime || "audio/mpeg") + ";base64," + audioB64);
                audioRef.current = audio;
                audio.onended = () => resolve(true);
                audio.onerror = () => resolve(false);
                audio.onpause = () => resolve(false); // barge-in pauses playback — unblock the loop
                audio.play().catch(() => resolve(false));
              });
            let pending = parts.length ? fetchPart(parts[0]) : null;
            let spoke = false;
            for (let i = 0; pending && i < parts.length; i++) {
              const d = await pending.catch(() => null);
              const upcoming = i + 1 < parts.length ? fetchPart(parts[i + 1]) : null;
              upcoming?.catch(() => {});
              pending = upcoming;
              if (done) return;
              if (!d?.audio) {
                if (!spoke) break; // engine down before any audio — browser voice takes over
                finish(); // tail chunk failed mid-reply: end here rather than repeat from the top
                return;
              }
              const played = await playPart(d.audio, d.mime);
              if (done) return;
              if (!played) {
                if (!spoke) break; // nothing has played yet (e.g. autoplay blocked) — browser voice
                finish();
                return;
              }
              spoke = true;
            }
            if (spoke) {
              finish();
              return;
            }
          }
        } catch {
          // Reyvoca voice unavailable — the browser voice keeps the call going.
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
    interruptedRef.current = true;
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

  /**
   * The mic hears the agent through the speakers. Anything that is literally a
   * run of the words the agent is saying right now is that echo, not the
   * caller — treating it as speech made the agent interrupt itself and reply to
   * its own sentence.
   */
  function isSelfEcho(heard: string) {
    const spoken = normalizeSpeech(spokenTextRef.current);
    const value = normalizeSpeech(heard);
    if (!spoken || value.length < ECHO_MIN_CHARS) return false;
    return spoken.includes(value);
  }

  async function askLLM(): Promise<string> {
    const conv = msgsRef.current.filter((m, i) => !(i === 0 && m.role === "assistant"));
    const hint = langHintRef.current;
    const sys = hint
      ? system +
        "\n\n[The caller's last message appears to ask you to speak " + hint +
        ". If so, reply in " + hint + " from this turn onward; otherwise continue in the current language.]"
      : system;
    const d = await apiFetch<{ reply?: string }>("/agents/preview", {
      method: "POST",
      body: JSON.stringify({ template: c.template, system: sys, messages: conv }),
    });
    return d.reply || "(no response)";
  }

  // End-of-speech detection: Chrome finalizes fragments at tiny pauses
  // (especially for Indian languages), which would split one sentence into
  // several turns. Collect fragments and send ONE combined turn only after a
  // real silence. Every new fragment — interim included — pushes the deadline
  // back, so a pause for thought mid-sentence no longer ends the turn.
  function scheduleEndpoint() {
    if (endpointTimerRef.current) clearTimeout(endpointTimerRef.current);
    else speechStartRef.current = Date.now(); // no timer yet → this run of speech just began
    const wait = looksComplete(finalBufRef.current) ? SILENCE_DONE_MS : SILENCE_MS;
    endpointTimerRef.current = setTimeout(() => {
      endpointTimerRef.current = null;
      const text = finalBufRef.current.trim();
      finalBufRef.current = "";
      if (!text || !activeRef.current || mutedRef.current) return;
      setPartial("");
      // The caller carried on before they could have heard the answer — they
      // were still finishing one sentence. Fold the rest into the turn already
      // in flight and answer the whole thing, instead of replying twice to its
      // two halves. Speech that starts well into a reply is a real new turn.
      const beforeAnswerLanded = speechStartRef.current < speakStartRef.current + MERGE_AFTER_REPLY_MS;
      const unheard =
        thinkingRef.current || ((speakingRef.current || interruptedRef.current) && beforeAnswerLanded);
      if (unheard && extendTurn(text)) return;
      startTurn(text);
    }, wait);
  }

  /** Append `text` to the user turn awaiting a reply and ask again. */
  function extendTurn(text: string) {
    const all = msgsRef.current;
    let at = -1;
    for (let i = all.length - 1; i >= 0; i--) {
      if (all[i].role === "user") {
        at = i;
        break;
      }
    }
    if (at === -1) return false;
    stopSpeaking();
    const content = (all[at].content + " " + text).trim();
    noteLanguageRequest(content);
    // Drop the reply to the half sentence — it is about to be re-asked in full.
    const next: Msg[] = [...all.slice(0, at), { role: "user", content }];
    msgsRef.current = next;
    setMsgs(next);
    void runTurn(++turnRef.current);
    return true;
  }

  // One continuous recognizer runs the whole call so the caller can talk any
  // time — including over the agent (barge-in). Chrome ends recognition
  // periodically, so restart it while the call is active.
  function startRecognition() {
    if (!activeRef.current || !SR) return;
    // Retire the previous recognizer *before* aborting it: its own onend fires
    // after abort and would restart it, leaving two recognizers on the mic —
    // which duplicates and drops the caller's words, and keeps listening after
    // the call ends.
    const previous = recRef.current;
    if (previous) {
      previous.onresult = null;
      previous.onerror = null;
      previous.onend = null;
      recRef.current = null;
      try {
        previous.abort();
      } catch {}
    }
    let rec: SpeechRecognitionLike;
    try {
      rec = new SR();
    } catch {
      return;
    }
    recRef.current = rec;
    // Chrome can re-deliver a result that is already final; keyed on slot +
    // text so a repeat is ignored but genuinely new speech never is.
    const seenFinals = new Set<string>();
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
      let heardFinal = false;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const text = (result[0].transcript || "").trim();
          if (!text) continue;
          const key = i + "\u0000" + text;
          if (seenFinals.has(key)) continue;
          seenFinals.add(key);
          if (speakingRef.current) {
            if (isSelfEcho(text)) continue; // the mic heard the agent, not the caller
            stopSpeaking(); // caller spoke over the agent → cut it off
          } else if (Date.now() - speakEndRef.current < ECHO_TAIL_MS && isSelfEcho(text)) {
            continue; // tail of the agent's own reply, finalized just after playback ended
          }
          finalBufRef.current = (finalBufRef.current + " " + text).trim();
          heardFinal = true;
        } else {
          interim += result[0].transcript;
        }
      }
      if (heardFinal) {
        setPartial(finalBufRef.current);
        scheduleEndpoint();
      }
      const live = interim.trim();
      if (live && !(speakingRef.current && isSelfEcho(live))) {
        setPartial((finalBufRef.current + " " + live).trim());
        scheduleEndpoint(); // still talking — hold the turn open
        // Interrupt as soon as the caller clearly starts talking (after the arm delay).
        if (speakingRef.current && bargeArmedRef.current && live.length >= BARGE_MIN_CHARS) stopSpeaking();
      }
    };
    rec.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setErr("Microphone was blocked. Allow mic access and start the call again.");
        hangup();
      }
    };
    rec.onend = () => {
      // Keep whatever is still buffered on screen — the turn has not ended.
      setPartial(finalBufRef.current);
      // Chrome resets result slots to 0 on restart, so keys from the previous
      // run would collide with new speech — repeating a phrase said earlier in
      // the call would be dropped as a "duplicate".
      seenFinals.clear();
      if (activeRef.current && recRef.current === rec) {
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

  /** Notices "speak X" asked in any script and primes the next LLM turn. */
  function noteLanguageRequest(text: string) {
    const want = requestedLanguage(text, allowedLangs, callLangRef.current);
    if (want) langHintRef.current = want;
  }

  function startTurn(text: string) {
    noteLanguageRequest(text);
    addMsg("user", text);
    void runTurn(++turnRef.current);
  }

  /**
   * One agent turn. `turn` is its generation: if the caller keeps talking and
   * extendTurn re-asks with the fuller sentence, this reply is stale and is
   * dropped instead of being spoken on top of the newer one.
   */
  async function runTurn(turn: number) {
    setStatus("thinking");
    thinkingRef.current = true;
    let reply: string;
    try {
      reply = await askLLM();
    } catch (cause) {
      if (turn !== turnRef.current) return;
      thinkingRef.current = false;
      setPartial("");
      if (activeRef.current && !mutedRef.current) setStatus("listening");
      setErr((cause as Error).message || "Something went wrong.");
      return;
    }
    if (turn !== turnRef.current) return; // superseded by a fuller sentence
    thinkingRef.current = false;
    langHintRef.current = ""; // the request (if any) has been answered
    if (!activeRef.current) return;
    setErr("");
    // Auto-switch: detect the language the model answered in (among the agent's
    // allowed languages) and move the voice + recognizer to it for next turns.
    // Latin replies while in a non-Latin language mean the caller switched back.
    const detected =
      detectLang(reply, allowedLangs) || latinFallbackLang(callLangRef.current, allowedLangs);
    if (detected && detected !== callLangRef.current) {
      callLangRef.current = detected;
      setCallLang(detected);
      startRecognition(); // re-arm the recognizer in the new language
    }
    addMsg("assistant", reply);
    await speak(reply);
  }

  async function startCall() {
    setErr("");
    if (noEngine) {
      setErr("The Reyvoca engine is not switched on for this workspace yet.");
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
    interruptedRef.current = false;
    spokenTextRef.current = "";
    speakStartRef.current = 0;
    langHintRef.current = "";
    finalBufRef.current = "";
    if (endpointTimerRef.current) clearTimeout(endpointTimerRef.current);
    endpointTimerRef.current = null;
    turnRef.current++;
    setPartial("");
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
    interruptedRef.current = false;
    spokenTextRef.current = "";
    speakFinishRef.current = null;
    finalBufRef.current = "";
    turnRef.current++; // void any reply still in flight
    if (endpointTimerRef.current) clearTimeout(endpointTimerRef.current);
    endpointTimerRef.current = null;
    const rec = recRef.current;
    recRef.current = null;
    if (rec) {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null; // do not let it restart itself after the call ends
      try {
        rec.abort();
      } catch {}
    }
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
    finalBufRef.current = "";
    if (endpointTimerRef.current) clearTimeout(endpointTimerRef.current);
    endpointTimerRef.current = null;
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
              {reyvocaVoice ? c.voiceName || "Reyvoca voice" : "Browser voice"} · {callLang}
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
          {noEngine && (
            <p className="rounded-lg border border-line bg-surface-muted px-3 py-2.5 text-xs leading-relaxed text-ink-muted">
              The Reyvoca engine is not switched on for this workspace yet, so calls cannot run. Support can enable it.
            </p>
          )}
          {!supported && !noEngine && (
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

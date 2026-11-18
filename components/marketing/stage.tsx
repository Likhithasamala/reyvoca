"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Check, Pause, Phone, PhoneCall, Play } from "lucide-react";
import { routes } from "@/config/site";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/cn";
import { CallScene, type SceneState } from "./call-scene";
import {
  CONNECT_AT,
  STAGE_CALLS,
  activeLineIndex,
  capturedCount,
  lastLineIndex,
  reachedStepIndex,
  spokenWords,
  voiceLevel,
  type StageCall,
} from "./stage-script";

const BARS = 148;
/** The timeline opens before the call connects, so the phone can ring first. */
const START = -1.8;
const EASE = [0.16, 1, 0.3, 1] as const;

type Phase = "ringing" | "live" | "ended";

function clock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * The visitor's motion preference, read without breaking hydration: the server
 * and the first client render both assume motion is fine, then React swaps in
 * the real answer.
 */
function useReduced() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(REDUCED_QUERY);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
}

/** Each headline line rises from behind its own baseline — the one loud move. */
function MaskedLine({ text, delay }: { text: string; delay: number }) {
  const reduced = useReduced();
  return (
    <span className="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
      <motion.span
        className="block"
        initial={reduced ? false : { y: "110%" }}
        animate={{ y: 0 }}
        transition={{ duration: 1, delay, ease: EASE }}
      >
        {text}
      </motion.span>
    </span>
  );
}

/**
 * The homepage stage: one call, happening now, drawn rather than photographed.
 *
 * There is a single clock. It drives the room behind the type (two lights,
 * one per voice), the waveform, the words as they are spoken, the four states
 * the agent moves through, and the fields it pulls out of the conversation
 * while the conversation is still running. Nothing on this screen is a loop
 * playing to its own timer: everything you see move is the call progressing.
 *
 * Only the things that genuinely change identity — the spoken line, the step,
 * the number of captured fields, the phase — go through React state. The
 * clock, the waveform, the caller's pulse and the word-by-word caption are
 * written straight to the DOM from the animation frame, so the page is not
 * re-rendering sixty times a second.
 */
export function Stage() {
  const reduced = useReduced();

  const [callIndex, setCallIndex] = useState(0);
  const call: StageCall = STAGE_CALLS[callIndex];

  // The visitor's last play/pause choice; playback also stops at the end.
  const [intent, setIntent] = useState(true);
  const [view, setView] = useState({
    line: -1,
    last: -1,
    step: -1,
    fields: 0,
    outcome: false,
    phase: "ringing" as Phase,
  });

  const timeRef = useRef(0);
  const viewRef = useRef(view);
  const frameRef = useRef(0);
  const waveRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<HTMLSpanElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const pulseRef = useRef<HTMLSpanElement>(null);
  const sceneRef = useRef<SceneState>({ agent: 0, caller: 0, time: 0, captures: 0, phase: "ringing" });

  const playing = intent && view.phase !== "ended" && !reduced;

  const commit = useCallback((time: number, forCall: StageCall) => {
    const phase: Phase = time >= forCall.end ? "ended" : time < CONNECT_AT ? "ringing" : "live";
    const next = {
      line: activeLineIndex(forCall, time),
      last: lastLineIndex(forCall, time),
      step: reachedStepIndex(forCall, time),
      fields: capturedCount(forCall, time),
      outcome: time >= forCall.outcome.at,
      phase,
    };
    const prev = viewRef.current;
    if (
      next.line !== prev.line ||
      next.last !== prev.last ||
      next.step !== prev.step ||
      next.fields !== prev.fields ||
      next.outcome !== prev.outcome ||
      next.phase !== prev.phase
    ) {
      viewRef.current = next;
      setView(next);
    }
  }, []);

  const seek = useCallback(
    (time: number) => {
      timeRef.current = Math.max(START, time);
      if (clockRef.current) clockRef.current.textContent = clock(Math.min(timeRef.current, call.end));
      commit(timeRef.current, call);
    },
    [call, commit],
  );

  // Switching scenario rewinds the timeline; reduced motion holds the finished
  // call instead of playing it. `playing` already accounts for the preference.
  useEffect(() => {
    timeRef.current = reduced ? call.end : START;
    viewRef.current = { line: -1, last: -1, step: -1, fields: 0, outcome: false, phase: "ringing" };
    commit(timeRef.current, call);
  }, [call, reduced, commit]);

  // One animation frame drives the clock, the waveform, the caption and the room.
  useEffect(() => {
    let last = 0;
    const step = (now: number) => {
      const delta = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;

      if (playing) {
        timeRef.current = Math.min(timeRef.current + delta, call.end);
        if (clockRef.current) {
          clockRef.current.textContent = clock(Math.max(0, timeRef.current - CONNECT_AT));
        }
        commit(timeRef.current, call);
      }

      const time = timeRef.current;
      const agent = voiceLevel(call, time, "agent");
      const caller = voiceLevel(call, time, "caller");

      const scene = sceneRef.current;
      scene.agent = agent;
      scene.caller = caller;
      scene.time = time;
      scene.captures = viewRef.current.fields;
      scene.phase = viewRef.current.phase;

      // A live line is never perfectly silent: a little room tone keeps the
      // waveform a line rather than a row of dots between the words.
      const tone = viewRef.current.phase === "live" ? 0.07 : 0;
      paintWave(waveRef.current, Math.max(agent, caller, tone), time);
      paintWords(wordsRef.current, call, time);
      paintPulse(pulseRef.current, caller, viewRef.current.phase, now);

      frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [playing, call, commit]);

  // The caption holds the last thing said until the next voice starts, so the
  // panel never blanks between lines the way a naive "is anyone talking" would.
  const line = view.last >= 0 ? call.lines[view.last] : null;
  const previous = view.last > 0 ? call.lines[view.last - 1] : null;
  const voice = line?.s ?? "none";
  const connected = view.phase !== "ringing";
  const showOutcome = view.outcome;

  return (
    <>
      {/* The bar belongs to the dark frame, so the stage runs full bleed. */}
      <header className="relative z-10 bg-night">
        <div className="mx-auto flex w-full max-w-[82rem] items-center justify-between gap-6 px-5 py-4 sm:px-6 lg:px-10">
          <Logo href={routes.home} inverse />
          <nav aria-label="Main" className="flex items-center gap-5 sm:gap-7">
            <Link
              href={routes.docs}
              className="hidden text-[0.9375rem] font-medium text-night-text transition-colors hover:text-white sm:inline"
            >
              Docs
            </Link>
            <Link
              href={routes.signIn}
              className="text-[0.9375rem] font-medium text-night-text transition-colors hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href={routes.bookDemo}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-[0.9375rem] font-semibold text-ink transition-colors hover:bg-canvas"
            >
              Book a demo
            </Link>
          </nav>
        </div>
      </header>

      <section
        aria-labelledby="stage-heading"
        className="relative isolate flex min-h-[calc(100svh-5rem)] flex-col overflow-hidden bg-night"
      >
        <CallScene state={sceneRef} reduced={reduced} />
        <div aria-hidden="true" className="stage-grain absolute inset-0 z-[1]" />

        <div className="relative z-[2] flex flex-1 flex-col justify-center px-5 pt-8 pb-6 sm:px-6 lg:px-10 lg:pt-14">
          <div className="mx-auto grid w-full max-w-[82rem] grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,27rem)] lg:gap-16">
            {/* The claim */}
            <div className="max-w-[34rem]">
              <h1
                id="stage-heading"
                className="text-[clamp(2.25rem,4.6vw,4rem)] leading-[1.03] font-semibold tracking-[-0.038em] text-white"
              >
                <MaskedLine text="The phone rings." delay={0.05} />
                <MaskedLine text="Reyvoca answers." delay={0.16} />
              </h1>

              <motion.div
                initial={reduced ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
              >
                <p className="mt-6 max-w-[38ch] text-[1.0625rem] leading-relaxed text-night-text">
                  Every call answered, every lead qualified, every meeting booked, so the business keeps growing while
                  your team gets on with the work.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-6">
                  <Link
                    href={routes.bookDemo}
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-6 text-[0.9375rem] font-semibold text-ink transition-[background-color,transform] hover:-translate-y-px hover:bg-canvas"
                  >
                    Book a demo
                  </Link>
                  <Link
                    href={routes.signIn}
                    className="min-h-11 content-center text-[0.9375rem] font-medium text-white underline decoration-white/35 underline-offset-[6px] transition-colors hover:decoration-white"
                  >
                    Sign in
                  </Link>
                </div>

                <p className="mt-8 hidden max-w-[36ch] text-[1.0625rem] leading-relaxed text-night-text sm:block">
                  Watch one run its course. Not a video, not a screenshot — the call is being played out and read right
                  here, beat by beat.
                </p>
              </motion.div>
            </div>

            {/* The proof: the call, as it happens */}
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.38, ease: EASE }}
              className="rounded-[1.25rem] bg-[#221d19]/85 p-5 backdrop-blur-xl sm:p-6"
            >
              {/* Status, clock, transport */}
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2.5 text-[0.9375rem] font-medium">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-2 rounded-full transition-colors",
                      view.phase === "live" ? "bg-accent" : view.phase === "ringing" ? "bg-white" : "bg-night-line",
                      view.phase !== "ended" && !reduced && "animate-[dot_1.2s_ease-in-out_infinite]",
                    )}
                  />
                  <span className={cn(view.phase === "ended" ? "text-night-muted" : "text-white")}>
                    {view.phase === "ringing"
                      ? call.direction === "Inbound"
                        ? "Incoming call"
                        : "Dialling"
                      : view.phase === "live"
                        ? "Live call"
                        : "Call ended"}
                  </span>
                  <span className="text-night-muted">{call.desk}</span>
                </p>
                <div className="flex items-center gap-2.5">
                  <span ref={clockRef} className="text-[0.9375rem] text-night-text tabular-nums">
                    00:00
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (view.phase === "ended") seek(START);
                      setIntent((value) => (view.phase === "ended" ? true : !value));
                    }}
                    aria-label={playing ? "Pause the call" : "Play the call"}
                    className="inline-flex size-8 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
                  >
                    {playing ? (
                      <Pause className="size-3.5 fill-current" />
                    ) : (
                      <Play className="size-3.5 translate-x-px fill-current" />
                    )}
                  </button>
                </div>
              </div>

              {/* What the agent is doing, right now */}
              <div className="mt-5">
                <ol aria-label="What the agent is doing" className="grid grid-cols-4 gap-1.5">
                  {call.steps.map((step, index) => {
                    const reachedHere = index <= view.step;
                    const current = reachedHere && index === view.step && view.phase !== "ended";
                    return (
                      <li
                        key={step.label}
                        className={cn(
                          "h-[3px] rounded-full transition-colors duration-500",
                          reachedHere ? "bg-accent" : "bg-white/15",
                        )}
                      >
                        <span className="sr-only">
                          {step.label}
                          {current ? " (in progress)" : reachedHere ? " (done)" : " (pending)"}
                        </span>
                      </li>
                    );
                  })}
                </ol>
                <p className="mt-2.5 flex items-baseline justify-between gap-4 text-[0.9375rem]">
                  <span className={cn(view.phase === "ended" ? "text-night-text" : "text-accent-glow")}>
                    {view.step >= 0 ? call.steps[view.step].label : "Connecting the call"}
                  </span>
                  <span className="shrink-0 text-night-muted tabular-nums">
                    Step {Math.max(1, view.step + 1)} of {call.steps.length}
                  </span>
                </p>
              </div>

              {/* Who is on the line */}
              <div className="mt-5 flex items-center gap-3.5 rounded-xl bg-white/[0.04] p-3">
                <span className="relative grid size-11 shrink-0 place-items-center">
                  <span
                    ref={pulseRef}
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full border border-white/25"
                  />
                  <span className="grid size-11 place-items-center rounded-full bg-white/10 text-[0.9375rem] font-semibold text-white">
                    {call.caller.initials ?? <Phone className="size-4" aria-hidden="true" />}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.9375rem] font-medium text-white">{call.caller.title}</span>
                  <span className="block text-[0.9375rem] text-night-muted">
                    {call.caller.sub}
                    {" · "}
                    <span className={cn("transition-colors duration-500", connected && "text-accent-glow")}>
                      {connected ? call.pickup : "ringing"}
                    </span>
                  </span>
                </span>
              </div>

              {/* The words, as they are spoken */}
              <div className="mt-5">
                <div className="min-h-[7.5rem]">
                  <p className="h-[1.45rem] truncate text-[0.9375rem] text-night-muted" aria-hidden="true">
                    {previous ? `${previous.s === "agent" ? "Agent" : "Caller"} · ${previous.t}` : ""}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-[0.9375rem] font-medium",
                      voice === "agent" ? "text-accent-glow" : "text-night-text",
                    )}
                    aria-hidden="true"
                  >
                    {line ? (line.s === "agent" ? "Reyvoca agent" : "Caller") : view.phase === "ended" ? "Ended" : " "}
                  </p>
                  <p
                    aria-live="polite"
                    className="mt-1 text-[1.0625rem] leading-[1.42] tracking-[-0.01em] text-white"
                  >
                    {line ? (
                      <span key={`${call.id}-${view.last}`} className="block">
                        <span className="sr-only">{line.s === "agent" ? "Agent: " : "Caller: "}</span>
                        <span ref={wordsRef} aria-hidden="true">
                          {line.t.split(" ").map((word, i) => (
                            <span key={i} className="transition-[opacity,filter] duration-200">
                              {word}{" "}
                            </span>
                          ))}
                        </span>
                        <span className="sr-only">{line.t}</span>
                      </span>
                    ) : view.phase === "ringing" ? (
                      <span className="block text-night-muted">
                        {call.direction === "Inbound" ? "The phone is ringing…" : "Dialling out…"}
                      </span>
                    ) : (
                      <span className="block text-night-muted">Picking up…</span>
                    )}
                  </p>
                </div>
              </div>

              {/* What the call became */}
              <div className="mt-5">
                <p className="flex items-baseline justify-between gap-4 text-[0.9375rem]">
                  <span className="text-night-muted">Captured from the conversation</span>
                  <span className="shrink-0 text-night-text tabular-nums">
                    {view.fields} of {call.fields.length}
                  </span>
                </p>

                <ul className="mt-2 grid gap-px">
                  {call.fields.map((field, index) => {
                    const got = index < view.fields;
                    return (
                      <li
                        key={field.label}
                        className="flex items-center justify-between gap-4 py-[7px] text-[0.9375rem]"
                      >
                        <span className={cn("shrink-0 transition-colors", got ? "text-night-text" : "text-night-muted")}>
                          {field.label}
                        </span>
                        {got ? (
                          <motion.span
                            initial={reduced ? false : { opacity: 0, y: 7, filter: "blur(3px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            transition={{ duration: 0.45, ease: EASE }}
                            className="truncate font-medium text-white"
                          >
                            {field.value}
                          </motion.span>
                        ) : (
                          <span
                            aria-hidden="true"
                            className={cn(
                              "h-[7px] w-20 rounded-full bg-white/10",
                              view.phase === "live" && !reduced && "animate-pulse",
                            )}
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-3 min-h-[4rem]">
                  {showOutcome ? (
                    <motion.p
                      initial={reduced ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.55, ease: EASE }}
                      className="flex items-start gap-2.5 rounded-xl bg-accent/15 px-3.5 py-3"
                    >
                      <Check className="mt-0.5 size-4 shrink-0 text-accent-glow" aria-hidden="true" />
                      <span className="text-[0.9375rem] leading-snug">
                        <span className="font-semibold text-white">{call.outcome.title}</span>{" "}
                        <span className="text-night-text">{call.outcome.detail}</span>
                      </span>
                    </motion.p>
                  ) : (
                    <p className="flex items-start gap-2.5 px-3.5 py-3 text-[0.9375rem] leading-snug text-night-muted">
                      <PhoneCall className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      Still on the line — the outcome is written the moment it is agreed.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* The line itself, running the full width of the frame. It is flat
            when nobody is speaking, because nobody is speaking. */}
        <div
          ref={waveRef}
          aria-hidden="true"
          className="relative z-[2] flex h-9 items-center justify-between px-5 sm:px-6 lg:px-10"
        >
          {Array.from({ length: BARS }, (_, i) => (
            <i
              key={i}
              className={cn(
                "h-[3px] w-[3px] shrink-0 rounded-full transition-colors duration-500",
                // A phone shows every other bar, so the line never overruns it.
                i % 2 === 1 && "hidden sm:block",
                voice === "agent" ? "bg-accent" : voice === "caller" ? "bg-night-text" : "bg-white/15",
              )}
            />
          ))}
        </div>

        {/* The close of the frame */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9, ease: EASE }}
          className="relative z-[2] mx-auto grid w-full max-w-[82rem] grid-cols-1 gap-3 px-5 pb-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-baseline lg:gap-8 lg:px-10 lg:pb-8"
        >
          <div role="group" aria-label="Choose a scenario" className="flex flex-wrap items-baseline gap-x-5 gap-y-3">
            <span className="text-[0.9375rem] text-night-muted">Hear another call:</span>
            {STAGE_CALLS.map((option, index) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={index === callIndex}
                onClick={() => {
                  setCallIndex(index);
                  setIntent(true);
                }}
                className={cn(
                  "text-[0.9375rem] font-medium transition-colors",
                  index === callIndex
                    ? "text-white underline decoration-accent decoration-2 underline-offset-[6px]"
                    : "text-night-text hover:text-white",
                )}
              >
                {option.tab}
              </button>
            ))}
          </div>
          <p className="text-[0.9375rem] text-night-muted lg:text-right">
            A scripted demonstration of a Reyvoca agent, drawn in the browser. No real customer, call or recording.
          </p>
        </motion.div>
      </section>
    </>
  );
}

/**
 * A deterministic, speech-shaped envelope: the bars mean "someone is talking",
 * not "decoration is happening".
 */
function paintWave(node: HTMLDivElement | null, level: number, time: number) {
  if (!node) return;
  const bars = node.children;
  for (let i = 0; i < bars.length; i++) {
    const centre = 1 - Math.abs(i - BARS / 2) / (BARS / 1.5);
    const wobble =
      Math.sin(time * 8.2 + i * 0.55) * 0.5 + Math.sin(time * 15.7 + i * 1.33) * 0.3 + Math.sin(time * 3.1 + i * 2.1) * 0.2;
    const height = 3 + Math.max(0, level * centre * (0.55 + wobble * 0.75)) * 26;
    (bars[i] as HTMLElement).style.height = `${height.toFixed(1)}px`;
  }
}

/** Words arrive as they are spoken; the rest of the line waits, dimmed. */
function paintWords(node: HTMLSpanElement | null, call: StageCall, time: number) {
  if (!node) return;
  const index = lastLineIndex(call, time);
  if (index < 0) return;
  const line = call.lines[index];
  const words = node.children;
  const said = time >= line.until ? words.length : spokenWords(line, time, words.length);
  for (let i = 0; i < words.length; i++) {
    const element = words[i] as HTMLElement;
    const out = i < said;
    element.style.opacity = out ? "1" : "0.22";
    element.style.filter = out ? "none" : "blur(1.2px)";
  }
}

/** The caller's ring breathes while they speak, and knocks while it rings. */
function paintPulse(node: HTMLSpanElement | null, callerLevel: number, phase: Phase, now: number) {
  if (!node) return;
  if (phase === "ringing") {
    const beat = (now % 1150) / 1150;
    node.style.transform = `scale(${(1 + (1 - beat) * 0.45).toFixed(3)})`;
    node.style.opacity = (1 - beat).toFixed(3);
    return;
  }
  node.style.transform = `scale(${(1 + callerLevel * 0.3).toFixed(3)})`;
  node.style.opacity = (0.18 + callerLevel * 0.6).toFixed(3);
}

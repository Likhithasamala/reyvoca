"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Flame, MessageSquare, Pause, PhoneCall, Play } from "lucide-react";
import { LogoMark } from "@/components/ui/logo";
import { cn } from "@/lib/cn";
import { useReduced } from "./opening";
import {
  CALLS,
  HOLD,
  activeLineIndex,
  capturedCount,
  lastLineIndex,
  reachedStepIndex,
  scoreAt,
  spokenWords,
  voiceLevel,
  type CallScript,
} from "./call-script";

const EASE = [0.16, 1, 0.3, 1] as const;
const BARS = 18;
/** How many turns of the conversation stay on screen at once. */
const WINDOW = 2;

type Phase = "enquiry" | "dialling" | "live" | "done";

function clock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * The example call: the whole product in one card, sitting beside the claim.
 *
 * Somebody asks a question in a chat window, which is where most enquiries
 * actually start and where most of them then sit. Reyvoca turns that message
 * into a phone call — the turns below the message are voice, not chat — holds
 * the conversation, pulls the facts out of it, and grades the lead at the end.
 *
 * One clock drives all of it. React re-renders only when a step, a turn or a
 * captured field actually changes; the timer, the live waveform, the spoken
 * words and the score are written straight to the DOM from the frame loop.
 *
 * It is built to sit on a dark ground, so the surrounding type is light and
 * the card itself is the one bright surface.
 */
export function CallCard() {
  const reduced = useReduced();

  const [callIndex, setCallIndex] = useState(0);
  const call = CALLS[callIndex];

  const [intent, setIntent] = useState(true);
  const [onScreen, setOnScreen] = useState(false);
  const [view, setView] = useState({ step: -1, turn: -1, active: -1, fields: 0, phase: "enquiry" as Phase });

  const timeRef = useRef(0);
  const viewRef = useRef(view);
  const frameRef = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const waveRef = useRef<HTMLSpanElement>(null);
  const wordsRef = useRef<HTMLSpanElement>(null);

  const playing = intent && onScreen && !reduced;

  const commit = useCallback((time: number, forCall: CallScript) => {
    const phase: Phase =
      time >= forCall.end ? "done" : time < forCall.dialAt ? "enquiry" : time < forCall.connectAt ? "dialling" : "live";
    const next = {
      step: reachedStepIndex(forCall, time),
      turn: lastLineIndex(forCall, time),
      active: activeLineIndex(forCall, time),
      fields: capturedCount(forCall, time),
      phase,
    };
    const prev = viewRef.current;
    if (
      next.step !== prev.step ||
      next.turn !== prev.turn ||
      next.active !== prev.active ||
      next.fields !== prev.fields ||
      next.phase !== prev.phase
    ) {
      viewRef.current = next;
      setView(next);
    }
  }, []);

  // Only run while the card is actually on screen.
  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => setOnScreen(entries[0]?.isIntersecting ?? false), {
      threshold: 0.2,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Switching scenario rewinds; reduced motion holds the finished card.
  useEffect(() => {
    timeRef.current = reduced ? call.end : 0;
    viewRef.current = { step: -1, turn: -1, active: -1, fields: 0, phase: "enquiry" };
    commit(timeRef.current, call);
  }, [call, reduced, commit]);

  useEffect(() => {
    let last = 0;
    const step = (now: number) => {
      const delta = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;

      if (playing) {
        // The finished card is held for a beat, then the call runs again.
        timeRef.current = timeRef.current >= call.end + HOLD ? 0 : timeRef.current + delta;
        commit(timeRef.current, call);
      }

      const time = timeRef.current;
      if (clockRef.current) clockRef.current.textContent = clock(Math.max(0, time - call.connectAt));
      if (scoreRef.current) scoreRef.current.textContent = String(scoreAt(call, time));
      paintWave(waveRef.current, Math.max(voiceLevel(call, time, "agent"), voiceLevel(call, time, "contact")), time);
      paintWords(wordsRef.current, call, time);

      frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [playing, call, commit]);

  const visible = call.lines
    .map((line, index) => ({ line, index }))
    .filter(({ index }) => index <= view.turn)
    .slice(-WINDOW);
  const graded = view.phase === "done" || view.step >= call.steps.length - 1;

  return (
    <div className="w-full">
      {/* Which business is on the line */}
      <div
        role="group"
        aria-label="Choose an example"
        className="mb-7 flex w-full max-w-fit gap-0.5 rounded-full bg-white/10 p-1 sm:gap-1"
      >
        {CALLS.map((option, index) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={index === callIndex}
            onClick={() => {
              setCallIndex(index);
              setIntent(true);
            }}
            className={cn(
              "min-h-9 flex-1 rounded-full px-2.5 text-[1rem] font-medium whitespace-nowrap transition-colors sm:flex-none sm:px-3.5",
              index === callIndex ? "bg-white text-ink" : "text-night-text hover:text-white",
            )}
          >
            {option.tab}
          </button>
        ))}
      </div>

      <div ref={cardRef} className="relative">
        <span className="absolute -top-3 left-4 z-10 rounded-full bg-white px-3 py-1 text-[0.8125rem] font-semibold tracking-[0.04em] text-ink uppercase">
          Example call
        </span>

        <div className="overflow-hidden rounded-[1.25rem] bg-surface">
          {/* Who is calling whom */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5 bg-night px-4 py-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent/20">
              <LogoMark inverse className="size-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[1rem] font-semibold text-white">
                {call.agent} <span className="text-night-muted">→</span> {call.contact.name}
              </span>
              <span className="block text-[1rem] text-night-muted">Outbound · placed {call.source.after}</span>
            </span>
            <span className="flex w-full items-center justify-between gap-2.5 sm:w-auto">
              <span ref={clockRef} className="rounded-lg bg-night-raised px-2.5 py-1 text-[1rem] text-white tabular-nums">
                00:00
              </span>
              <button
                type="button"
                onClick={() => setIntent((value) => !value)}
                aria-label={playing ? "Pause the example" : "Play the example"}
                className="inline-flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                {playing ? (
                  <Pause className="size-4 fill-current" />
                ) : (
                  <Play className="size-4 translate-x-px fill-current" />
                )}
              </button>
            </span>
          </div>

          <div className="grid lg:grid-cols-[13.5rem_1fr]">
            {/* What Reyvoca did, in order */}
            <ol aria-label="What the agent did" className="bg-surface-muted px-4 py-4">
              {call.steps.map((item, index) => {
                const reachedHere = index <= view.step;
                const current = reachedHere && index === view.step;
                const lastRow = index === call.steps.length - 1;
                const done = index < view.step || (current && lastRow && graded);
                return (
                  <li key={item.label} className="relative flex gap-3 pb-3.5 last:pb-0">
                    {!lastRow && (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute top-6 bottom-0.5 left-[0.59375rem] w-0.5 rounded-full transition-colors duration-500",
                          index < view.step ? "bg-accent" : "bg-line",
                        )}
                      />
                    )}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "relative grid size-5 shrink-0 place-items-center rounded-full text-[0.6875rem] font-semibold transition-colors duration-500",
                        done
                          ? "bg-accent text-white"
                          : current
                            ? "bg-accent-wash text-accent-strong ring-2 ring-accent/40"
                            : "bg-line text-ink-subtle",
                      )}
                    >
                      {done ? <Check className="size-3" /> : index + 1}
                    </span>
                    <span className="min-w-0 -mt-0.5">
                      <span
                        className={cn(
                          "block text-[1rem] leading-snug font-medium transition-colors duration-500",
                          reachedHere ? "text-ink" : "text-ink-subtle",
                        )}
                      >
                        {item.label}
                      </span>
                      <span className="block text-[1rem] leading-snug text-ink-subtle">{item.detail}</span>
                    </span>
                    <span className="sr-only">{current ? " (in progress)" : reachedHere ? " (done)" : " (pending)"}</span>
                  </li>
                );
              })}
            </ol>

            {/* The message, then the voices */}
            <div className="flex min-h-[19rem] flex-col gap-3 px-4 py-4">
              <div className="flex items-start gap-2.5 rounded-2xl rounded-tl-md bg-surface-muted px-3.5 py-2.5">
                <MessageSquare className="mt-0.5 size-4 shrink-0 text-ink-subtle" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-[1rem] leading-snug text-ink">“{call.source.quote}”</span>
                  <span className="block text-[1rem] leading-snug text-ink-subtle">
                    {call.contact.name} · {call.source.channel} · {call.source.when}
                  </span>
                </span>
              </div>

              <p
                className={cn(
                  "flex items-center gap-2 text-[1rem] leading-snug font-medium transition-colors duration-500",
                  view.phase === "enquiry" ? "text-ink-subtle" : "text-accent-strong",
                )}
              >
                <PhoneCall className="size-4 shrink-0" aria-hidden="true" />
                {view.phase === "enquiry"
                  ? "Reyvoca is about to call back…"
                  : view.phase === "dialling"
                    ? "Calling back now — no one had to be free"
                    : "Reyvoca called back 41 seconds later"}
              </p>

              {/* Voice turns. These are spoken, not typed. */}
              <ul className="flex flex-1 flex-col justify-end gap-2.5">
                <AnimatePresence initial={false} mode="popLayout">
                  {visible.map(({ line, index }) => {
                    const live = index === view.active;
                    const mine = line.s === "agent";
                    return (
                      <motion.li
                        key={`${call.id}-${index}`}
                        layout={!reduced}
                        initial={reduced ? false : { opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduced ? undefined : { opacity: 0, y: -10 }}
                        transition={{ duration: 0.45, ease: EASE }}
                        className={cn("flex", mine ? "justify-start" : "justify-end")}
                      >
                        <span
                          className={cn(
                            "max-w-[30ch] rounded-2xl px-3.5 py-2.5",
                            mine ? "rounded-tl-md bg-accent-wash" : "rounded-tr-md bg-surface-muted",
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className={cn("text-[1rem] font-semibold", mine ? "text-accent-strong" : "text-ink-muted")}
                            >
                              {mine ? "Reyvoca" : call.contact.name}
                            </span>
                            <span
                              ref={live ? waveRef : undefined}
                              aria-hidden="true"
                              className="flex h-3.5 items-center gap-[2px]"
                            >
                              {Array.from({ length: BARS }, (_, i) => (
                                <i
                                  key={i}
                                  style={live ? undefined : { height: `${restingBar(index, i)}px` }}
                                  className={cn(
                                    "w-[2px] rounded-full",
                                    live ? "h-[2px]" : "opacity-45",
                                    mine ? "bg-accent" : "bg-ink-subtle",
                                  )}
                                />
                              ))}
                            </span>
                          </span>
                          <span className="mt-0.5 block text-[1rem] leading-snug text-ink">
                            <span className="sr-only">{line.t}</span>
                            <span ref={live ? wordsRef : undefined} aria-hidden="true">
                              {live
                                ? line.t.split(" ").map((word, i) => (
                                    <span key={i} className="transition-opacity duration-200">
                                      {word}{" "}
                                    </span>
                                  ))
                                : line.t}
                            </span>
                          </span>
                        </span>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            </div>
          </div>

          {/* What the call became */}
          <div className="bg-surface-muted px-4 py-4">
            <ul className="flex min-h-[3rem] flex-wrap content-start gap-2">
              <AnimatePresence initial={false}>
                {call.fields.slice(0, view.fields).map((field) => (
                  <motion.li
                    key={field.label}
                    initial={reduced ? false : { opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.4, ease: EASE }}
                    className="rounded-full bg-surface px-3 py-1.5 text-[1rem]"
                  >
                    <span className="text-ink-subtle">{field.label}</span>{" "}
                    <span className="font-medium text-ink">{field.value}</span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>

            <div className="mt-2 flex min-h-[3rem] flex-wrap items-center gap-2.5">
              {graded ? (
                <>
                  <motion.span
                    initial={reduced ? false : { opacity: 0, y: 10, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-3.5 py-2 text-[1rem] font-semibold text-white"
                  >
                    <Flame className="size-4" aria-hidden="true" />
                    {call.verdict.label}
                    <span className="rounded-full bg-white/20 px-2 py-0.5 tabular-nums">
                      <span ref={scoreRef}>0</span>
                      <span className="opacity-70">/100</span>
                    </span>
                  </motion.span>
                  <motion.span
                    initial={reduced ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.12, ease: EASE }}
                    className="inline-flex items-center gap-2 rounded-full bg-surface px-3.5 py-2 text-[1rem] text-ink"
                  >
                    <Check className="size-4 text-accent-strong" aria-hidden="true" />
                    {call.verdict.note}
                  </motion.span>
                </>
              ) : (
                <span className="text-[1rem] leading-snug text-ink-subtle">
                  The lead is graded the moment the call ends — then it is in your workspace, not in
                  someone&rsquo;s head.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-[1rem] text-night-muted">
        An example, played out in your browser. No real customer, call or recording.
      </p>
    </div>
  );
}

/** A finished turn keeps a still, deterministic waveform of its own. */
function restingBar(turn: number, bar: number) {
  const wobble = Math.sin((turn + 1) * 2.3 + bar * 1.7) * 0.5 + Math.sin((turn + 1) * 5.1 + bar * 0.9) * 0.5;
  return Math.round(3 + Math.abs(wobble) * 7);
}

/** The live turn's waveform: speech-shaped, written straight to the DOM. */
function paintWave(node: HTMLSpanElement | null, level: number, time: number) {
  if (!node) return;
  const bars = node.children;
  for (let i = 0; i < bars.length; i++) {
    const centre = 1 - Math.abs(i - BARS / 2) / (BARS / 1.4);
    const wobble =
      Math.sin(time * 8.2 + i * 0.55) * 0.5 + Math.sin(time * 15.7 + i * 1.33) * 0.3 + Math.sin(time * 3.1 + i * 2.1) * 0.2;
    const height = 2 + Math.max(0, level * centre * (0.55 + wobble * 0.75)) * 11;
    (bars[i] as HTMLElement).style.height = `${height.toFixed(1)}px`;
  }
}

/** Words arrive as they are spoken; the rest of the turn waits, dimmed. */
function paintWords(node: HTMLSpanElement | null, call: CallScript, time: number) {
  if (!node) return;
  const index = activeLineIndex(call, time);
  if (index < 0) return;
  const line = call.lines[index];
  const words = node.children;
  if (!words.length) return;
  const said = spokenWords(line, time, words.length);
  for (let i = 0; i < words.length; i++) {
    (words[i] as HTMLElement).style.opacity = i < said ? "1" : "0.25";
  }
}

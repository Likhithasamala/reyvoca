"use client";

import { ArrowRight, RotateCcw } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { Waveform } from "@/components/ui/waveform";
import { cn } from "@/lib/cn";
import { CONNECT_AT, SCENARIOS, type Scenario } from "./conversation-scenarios";

const TICK_MS = 200;

function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** Which speaker holds the floor at `elapsed`, for the waveform. */
function speakingNow(scenario: Scenario, elapsed: number) {
  let current: "agent" | "caller" | null = null;
  for (const m of scenario.messages) {
    if (elapsed >= m.at - 1) current = m.speaker;
  }
  return elapsed >= scenario.end ? null : current;
}

/**
 * The hero's working fragment: a scripted call playing out in the product's
 * own conversation UI — transcript, captured fields, outcome and the final
 * action. Clearly labelled as a simulation; no audio, no live data.
 */
export function ConversationDemo() {
  const reducedMotion = useReducedMotion();

  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const [ticks, setTicks] = useState(0);
  const [started, setStarted] = useState(false);

  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0];

  // Reduced motion shows the completed call, no playback.
  const elapsed = reducedMotion ? scenario.end : (ticks * TICK_MS) / 1000;
  const finished = elapsed >= scenario.end;
  const connected = elapsed >= CONNECT_AT;

  useEffect(() => {
    if (!started || reducedMotion || finished) return;
    const t = setTimeout(() => setTicks((v) => v + 1), TICK_MS);
    return () => clearTimeout(t);
  }, [started, reducedMotion, finished, ticks]);

  const selectScenario = (id: string) => {
    setScenarioId(id);
    setTicks(0);
    setStarted(true);
  };

  const speaker = started ? speakingNow(scenario, elapsed) : null;
  const shownFields = scenario.fields.filter((f) => elapsed >= f.at);
  const outcomeShown = elapsed >= scenario.outcome.at;
  const actionShown = elapsed >= scenario.action.at;

  return (
    <motion.figure
      onViewportEnter={() => setStarted(true)}
      viewport={{ amount: 0.4, once: true }}
      className="w-full"
    >
      <div data-ui className="overflow-hidden rounded-2xl border border-line bg-surface">
        {/* Scenario switch */}
        <div className="flex items-center justify-between gap-3 bg-surface-muted px-3 py-2.5 sm:px-4">
          <div role="tablist" aria-label="Demo scenario" className="flex min-w-0 overflow-x-auto rounded-lg bg-line/60 p-0.5">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                role="tab"
                aria-selected={s.id === scenarioId}
                onClick={() => selectScenario(s.id)}
                className={cn(
                  "rounded-md px-2 py-1.5 text-[12px] font-medium whitespace-nowrap transition-colors sm:px-3 sm:text-[13px]",
                  s.id === scenarioId ? "bg-surface text-ink" : "text-ink-muted hover:text-ink",
                )}
              >
                {s.tab}
              </button>
            ))}
          </div>
          <span className="shrink-0 text-[12px] font-medium text-ink-subtle">Simulated</span>
        </div>

        {/* Call header */}
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full",
                speaker === "agent" ? "bg-brand text-accent-glow" : "bg-surface-muted text-ink-subtle",
              )}
            >
              <Waveform active={speaker === "agent"} bars={4} className="h-3.5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold text-ink">{scenario.agent}</p>
              <p className="truncate text-[13px] text-ink-muted">
                {scenario.direction} · {scenario.counterpart}
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[13px] font-medium text-ink">
              {finished ? "Call ended" : connected && started ? (
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-accent" />
                  {speaker === "agent" ? "Agent speaking" : speaker === "caller" ? "Caller speaking" : "Connected"}
                </span>
              ) : started ? "Dialing" : "Ready"}
            </p>
            <p className="text-[13px] text-ink-subtle tabular-nums">
              {connected && started ? formatClock(Math.min(elapsed, scenario.end) - CONNECT_AT) : "00:00"}
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-[minmax(0,1fr)_200px]">
          {/* Transcript */}
          <div className="min-h-[300px] space-y-2.5 px-4 py-4 sm:px-5" aria-label="Transcript">
            <AnimatePresence mode="popLayout" initial={false}>
              {scenario.messages
                .filter((m) => elapsed >= m.at)
                .map((m) => (
                  <motion.div
                    key={`${scenario.id}-${m.at}`}
                    initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                    className={cn("flex", m.speaker === "agent" ? "justify-start" : "justify-end")}
                  >
                    <p
                      className={cn(
                        "max-w-[88%] rounded-xl px-3 py-2 text-[13px] leading-snug",
                        m.speaker === "agent"
                          ? "rounded-tl-sm bg-surface-muted text-ink"
                          : "rounded-tr-sm bg-brand text-white",
                      )}
                    >
                      <span className={cn("mb-0.5 block text-[11px] font-semibold", m.speaker === "agent" ? "text-accent-strong" : "text-night-muted")}>
                        {m.speaker === "agent" ? "Agent" : "Caller"}
                      </span>
                      {m.text}
                    </p>
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>

          {/* Captured fields */}
          <aside
            aria-label="What the agent captured"
            className="border-t border-line bg-surface-muted/60 px-4 py-4 sm:border-t-0 sm:border-l sm:px-4"
          >
            <p className="text-[12px] font-semibold text-ink">Captured</p>
            <dl className="mt-2.5 space-y-2.5">
              {scenario.fields.map((f) => {
                const captured = shownFields.includes(f);
                return (
                  <div key={f.label}>
                    <dt className="text-[12px] text-ink-subtle">{f.label}</dt>
                    <dd className="text-[13px] font-medium text-ink">
                      {captured ? (
                        <motion.span
                          initial={reducedMotion ? false : { opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="inline-block"
                        >
                          {f.value}
                        </motion.span>
                      ) : (
                        <span aria-hidden="true" className="text-ink-subtle/60">—</span>
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
            <div className="mt-3.5 border-t border-line pt-3">
              <dt className="text-[12px] text-ink-subtle">Outcome</dt>
              <dd className="mt-1 text-[13px]">
                {outcomeShown ? (
                  <motion.span
                    initial={reducedMotion ? false : { opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex rounded px-1.5 py-0.5 text-[12px] font-semibold"
                    style={{ background: "var(--color-success-soft)", color: "var(--color-success)" }}
                  >
                    {scenario.outcome.label}
                  </motion.span>
                ) : (
                  <span aria-hidden="true" className="text-ink-subtle/60">—</span>
                )}
              </dd>
            </div>
          </aside>
        </div>

        {/* The action */}
        <div className="flex min-h-[58px] items-center justify-between gap-3 border-t border-line px-4 py-3 sm:px-5">
          {actionShown ? (
            <motion.p
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex min-w-0 items-center gap-2.5 text-[13px]"
            >
              <ArrowRight className="size-4 shrink-0 text-accent-strong" aria-hidden="true" />
              <span className="min-w-0">
                <span className="font-semibold text-ink">{scenario.action.label}</span>
                <span className="text-ink-muted"> — {scenario.action.detail}</span>
              </span>
            </motion.p>
          ) : (
            <p className="text-[13px] text-ink-subtle">The action lands here when the call ends.</p>
          )}
          {finished && !reducedMotion && (
            <button
              type="button"
              onClick={() => setTicks(0)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Replay
            </button>
          )}
        </div>
      </div>

      <figcaption className="mt-3 text-sm text-ink-subtle">
        A scripted demonstration of a Reyvoca agent — not a live call or real customer data.
      </figcaption>
    </motion.figure>
  );
}

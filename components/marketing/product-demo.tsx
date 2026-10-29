"use client";

import { Check, CircleCheck, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Waveform } from "@/components/ui/waveform";
import { cn } from "@/lib/cn";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import {
  CONNECTED_AT,
  DEMO_END,
  TYPING_LEAD,
  demoAgent,
  demoMessages,
  demoOutcomes,
  demoSteps,
} from "./product-demo-script";

const TICK_MS = 200;

function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

/** Simulated live AI call shown in the hero. Illustrative only. */
export function ProductDemo() {
  const reducedMotion = useReducedMotion();
  const [ticks, setTicks] = useState(0);

  // Reduced motion: show the finished call with no animation.
  const elapsed = reducedMotion ? DEMO_END : (ticks * TICK_MS) / 1000;
  const finished = elapsed >= DEMO_END;

  useEffect(() => {
    if (finished) return;
    const timeout = setTimeout(() => setTicks((value) => value + 1), TICK_MS);
    return () => clearTimeout(timeout);
  }, [ticks, finished]);

  const connected = elapsed >= CONNECTED_AT;
  const activeStep = demoSteps.findLastIndex((step) => elapsed >= step.at);
  const typingIndex = demoMessages.findIndex((m) => elapsed >= m.at - TYPING_LEAD && elapsed < m.at);
  const speaking = connected && !finished;

  return (
    <figure
      aria-label="Example of a Reyvoca AI voice agent qualifying a lead and booking a demo"
      className="relative mx-auto w-full max-w-[560px]"
    >
      {/* Back plate for depth */}
      <div
        aria-hidden="true"
        className="absolute inset-x-6 -bottom-3 top-6 rounded-[28px] border border-line bg-surface-muted"
      />

      <div className="relative overflow-hidden rounded-3xl border border-line bg-surface shadow-float">
        {/* Call header */}
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-brand text-accent-glow">
              {speaking && <span aria-hidden="true" className="absolute inset-0 animate-ping-soft rounded-full bg-accent" />}
              <Waveform active={speaking} bars={4} className="relative h-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{demoAgent.name}</p>
              <p className="truncate text-sm text-ink-subtle">
                {demoAgent.direction} · {demoAgent.contact}
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6875rem] font-semibold tracking-[0.08em] uppercase",
                speaking ? "border-accent-soft bg-accent-wash text-accent-strong" : "border-line bg-surface-muted text-ink-muted",
              )}>
              <span
                aria-hidden="true"
                className={cn("size-1.5 rounded-full", speaking ? "animate-pulse bg-accent" : "bg-ink-subtle")}
              />
              {finished ? "Call ended" : connected ? "Live AI call" : "Calling"}
            </p>
            <p className="mt-1 font-mono text-sm text-ink-muted tabular-nums">
              {connected ? formatDuration(elapsed - CONNECTED_AT) : "Dialing…"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[164px_minmax(0,1fr)]">
          {/* Progress — vertical on sm+, compact bar on mobile */}
          <div className="border-b border-line px-5 py-3 sm:hidden">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-ink">{demoSteps[activeStep]?.label}</span>
              <span className="text-ink-subtle">
                Step {activeStep + 1} of {demoSteps.length}
              </span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-ink transition-[width] duration-500"
                style={{ width: `${((activeStep + 1) / demoSteps.length) * 100}%` }}
              />
            </div>
          </div>

          <ol className="hidden border-r border-line bg-surface-muted px-5 py-6 sm:block" aria-label="Call progress">
            {demoSteps.map((step, index) => {
              const done = index < activeStep || (finished && index === activeStep);
              const current = index === activeStep && !finished;
              return (
                <li key={step.label} className="relative flex gap-3 pb-6 last:pb-0">
                  {index < demoSteps.length - 1 && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute top-6 bottom-1 left-[9px] w-px",
                        index < activeStep ? "bg-ink" : "bg-line-strong",
                      )}
                    />
                  )}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "relative z-10 flex size-[19px] shrink-0 items-center justify-center rounded-full border transition-colors duration-300",
                      done && "border-ink bg-ink text-white",
                      current && "border-accent bg-surface",
                      !done && !current && "border-line-strong bg-surface",
                    )}
                  >
                    {done && <Check className="size-3" strokeWidth={3} />}
                    {current && <span className="size-2 animate-pulse rounded-full bg-accent" />}
                  </span>
                  <span
                    className={cn(
                      "pt-px text-[0.8125rem] leading-tight transition-colors",
                      done || current ? "font-medium text-ink" : "text-ink-subtle",
                    )}
                  >
                    {step.label}
                    <span className="sr-only">{done ? " (complete)" : current ? " (in progress)" : ""}</span>
                  </span>
                </li>
              );
            })}
          </ol>

          {/* Transcript — every slot reserves its space so nothing shifts */}
          <div className="space-y-3 px-5 py-5 sm:px-5 sm:py-6">
            {demoMessages.map((message, index) => {
              const shown = elapsed >= message.at;
              const typing = typingIndex === index;
              const isAgent = message.speaker === "agent";
              return (
                <div key={index} className={cn("relative flex", isAgent ? "justify-start" : "justify-end")}>
                  <p
                    aria-hidden={!shown}
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[0.8125rem] leading-snug transition-[opacity,transform] duration-500",
                      isAgent ? "rounded-tl-md border border-line bg-surface-muted text-ink" : "rounded-tr-md bg-ink text-white",
                      shown ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
                    )}
                  >
                    <span
                      className={cn(
                        "mb-0.5 block text-[0.6875rem] font-semibold tracking-wide uppercase",
                        isAgent ? "text-accent-strong" : "text-night-muted",
                      )}
                    >
                      {isAgent ? "AI agent" : "Customer"}
                    </span>
                    {message.text}
                  </p>
                  {typing && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute top-0 inline-flex gap-1 rounded-full px-3 py-2.5",
                        isAgent ? "left-0 bg-surface-muted" : "right-0 bg-line",
                      )}
                    >
                      {[0, 1, 2].map((dot) => (
                        <span
                          key={dot}
                          className={cn("size-1.5 animate-dot rounded-full", isAgent ? "bg-accent" : "bg-ink-subtle")}
                          style={{ animationDelay: `${dot * 0.15}s` }}
                        />
                      ))}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Captured outcomes */}
        <div className="flex flex-wrap items-center gap-2 border-t border-line bg-surface px-5 py-4 sm:px-6">
          {demoOutcomes.map((outcome) => {
            const captured = elapsed >= outcome.at;
            return (
              <span
                key={outcome.label}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-500",
                  captured
                    ? "border-line-strong bg-surface text-ink"
                    : "border-dashed border-line-strong text-ink-subtle",
                )}
              >
                <CircleCheck className={cn("size-3.5", captured ? "text-accent-strong" : "opacity-40")} aria-hidden="true" />
                {outcome.label}
                <span className="sr-only">{captured ? " — captured" : " — pending"}</span>
              </span>
            );
          })}
          {finished && !reducedMotion && (
            <button
              type="button"
              onClick={() => setTicks(0)}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium text-ink-subtle transition-colors hover:text-ink"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Replay
            </button>
          )}
        </div>
      </div>

      <figcaption className="sr-only">
        A simulated outbound call: the agent confirms the customer wants to automate inbound calls, qualifies the lead,
        schedules a demo and updates the CRM.
      </figcaption>
    </figure>
  );
}

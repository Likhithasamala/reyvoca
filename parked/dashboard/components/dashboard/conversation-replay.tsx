"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Waveform } from "@/components/ui/waveform";
import { cn } from "@/lib/cn";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { CONNECT_AT, SCENARIOS, type Scenario } from "@/components/marketing/conversation-scenarios";

const TICK_MS = 150;

function clock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Replays a scripted conversation with a scrubber. No real call audio or
 * transcripts exist yet, so this plays a clearly-labelled sample script —
 * the shape the real replay will take once calls are recorded.
 */
export function ConversationReplay({ direction }: { direction?: "Inbound" | "Outbound" }) {
  const scenario: Scenario = useMemo(
    () => SCENARIOS.find((s) => s.direction === direction) ?? SCENARIOS[0],
    [direction],
  );
  // Keying by scenario resets the player state when the scenario changes.
  return <ReplayPlayer key={scenario.id} scenario={scenario} />;
}

function ReplayPlayer({ scenario }: { scenario: Scenario }) {
  const reducedMotion = useReducedMotion();
  const [elapsed, setElapsed] = useState(0);
  const [intent, setIntent] = useState(false); // the user's last play/pause choice
  const transcriptRef = useRef<HTMLDivElement>(null);

  const finished = elapsed >= scenario.end;
  const playing = intent && !finished;

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setElapsed((v) => Math.min(v + TICK_MS / 1000, scenario.end)), TICK_MS);
    return () => clearTimeout(t);
  }, [playing, elapsed, scenario.end]);

  // Follow the newest line while playing.
  useEffect(() => {
    if (!playing || reducedMotion) return;
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [elapsed, playing, reducedMotion]);

  const shown = scenario.messages.filter((m) => elapsed >= m.at);
  const current = shown[shown.length - 1];

  return (
    <div>
      {/* Player row */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => (finished ? (setElapsed(0), setIntent(true)) : setIntent((v) => !v))}
          aria-label={finished ? "Replay from the start" : playing ? "Pause replay" : "Play replay"}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand-hover"
        >
          {finished ? (
            <RotateCcw className="size-4" aria-hidden="true" />
          ) : playing ? (
            <Pause className="size-4" aria-hidden="true" />
          ) : (
            <Play className="size-4 translate-x-px" aria-hidden="true" />
          )}
        </button>

        <input
          type="range"
          min={0}
          max={scenario.end}
          step={0.1}
          value={elapsed}
          onChange={(e) => setElapsed(Number(e.target.value))}
          aria-label="Replay position"
          className="h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-line accent-(--color-accent-strong)"
        />

        <span className="shrink-0 text-xs text-ink-muted tabular-nums">
          {clock(Math.min(elapsed, scenario.end))} / {clock(scenario.end)}
        </span>
      </div>

      {/* Who is speaking */}
      <div className="mt-3 flex items-center gap-2 text-xs text-ink-muted">
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-full",
            playing && current?.speaker === "agent" ? "bg-brand text-accent-glow" : "bg-surface-muted text-ink-subtle",
          )}
        >
          <Waveform active={playing && !finished} bars={3} className="h-2" />
        </span>
        {elapsed < CONNECT_AT
          ? "Dialing"
          : finished
            ? `Call ended · outcome: ${scenario.outcome.label}`
            : current
              ? `${current.speaker === "agent" ? "Agent" : "Caller"} speaking`
              : "Connected"}
      </div>

      {/* Transcript follows the playhead */}
      <div
        ref={transcriptRef}
        className="mt-3 max-h-56 space-y-2 overflow-y-auto rounded-lg bg-surface-muted/60 p-3"
        aria-label="Replay transcript"
      >
        {shown.length === 0 ? (
          <p className="text-xs text-ink-subtle">Press play to replay the conversation.</p>
        ) : (
          shown.map((m) => (
            <p
              key={m.at}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-[13px] leading-snug",
                m.speaker === "agent" ? "mr-6 bg-surface text-ink" : "ml-6 bg-brand text-white",
                m === current && playing && "outline-1 outline-accent-soft",
              )}
            >
              <span className={cn("mr-1.5 text-[11px] font-semibold", m.speaker === "agent" ? "text-accent-strong" : "text-night-muted")}>
                {m.speaker === "agent" ? "Agent" : "Caller"}
              </span>
              {m.text}
            </p>
          ))
        )}
      </div>

      <p className="mt-2.5 text-xs leading-relaxed text-ink-subtle">
        Simulated replay of a sample script — not this contact&rsquo;s call. Real replays arrive with call recording.
      </p>
    </div>
  );
}

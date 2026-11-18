"use client";

import { useState } from "react";
import { inboundLine } from "@/config/marketing";
import { Waveform } from "@/components/ui/waveform";
import { cn } from "@/lib/cn";

/**
 * The product's one switch, blown up. Everything inside the control is sized
 * in em so one font-size scales it to poster height; it stays a real,
 * keyboard-operable switch. Flipping it swaps the field between paper and
 * night and changes one word of the heading.
 */
export function InboundLine() {
  const [on, setOn] = useState(true);

  return (
    <section
      id={inboundLine.id}
      aria-labelledby="inbound-heading"
      className={cn(
        "relative min-h-[86svh] overflow-hidden transition-colors duration-500 lg:min-h-[92svh]",
        on ? "bg-night" : "bg-surface-muted",
      )}
    >
      <div className="mx-auto max-w-7xl px-6 pt-20 lg:px-10 lg:pt-28">
        <h2
          id="inbound-heading"
          className={cn(
            "max-w-[16ch] text-[1.75rem] leading-tight font-semibold transition-colors duration-500 sm:text-[clamp(28px,2.6vw,40px)]",
            on ? "text-white" : "text-ink",
          )}
        >
          Your line, {on ? "answering" : "paused"}
        </h2>
        <p
          className={cn(
            "mt-4 max-w-[46ch] text-[17px] leading-relaxed transition-colors duration-500",
            on ? "text-night-text" : "text-ink-muted",
          )}
        >
          {inboundLine.sentence}
        </p>
      </div>

      {/* The control, scaled by font-size; the track's far end is cropped by
          the right edge while its label and value stay fully visible. */}
      <div
        data-ui
        className="relative mx-6 mt-16 pb-16 text-[clamp(44px,9svh,120px)] lg:absolute lg:right-0 lg:bottom-[9svh] lg:mx-0 lg:mt-0 lg:translate-x-[0.45em] lg:pb-0"
      >
        <div className="flex flex-col items-start gap-[0.22em]">
          <span
            className={cn(
              "text-[0.26em] font-semibold tracking-normal transition-colors duration-500",
              on ? "text-night-muted" : "text-ink-muted",
            )}
          >
            Inbound line
          </span>
          <div className="flex items-center gap-[0.3em]">
            <span
              className={cn(
                "text-[0.42em] leading-none font-semibold transition-colors duration-500",
                on ? "text-white" : "text-ink",
              )}
            >
              {on ? "Answering" : "Paused"}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={on}
              aria-label={`Inbound line ${on ? "answering" : "paused"}`}
              onClick={() => setOn((v) => !v)}
              className={cn(
                "relative h-[1.3em] w-[2.5em] rounded-full transition-colors duration-500 focus-visible:outline-4 focus-visible:outline-offset-8",
                on ? "bg-accent" : "bg-line-strong",
              )}
            >
              <span
                className={cn(
                  "absolute top-[0.1em] flex h-[1.1em] w-[1.1em] items-center justify-center rounded-full bg-white transition-[left] duration-500",
                  on ? "left-[1.3em]" : "left-[0.1em]",
                )}
              >
                <Waveform
                  active={on}
                  bars={4}
                  className="h-[0.42em] gap-[0.045em]"
                  barClassName={cn("w-[0.05em]", on ? "text-accent" : "text-ink-subtle")}
                />
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

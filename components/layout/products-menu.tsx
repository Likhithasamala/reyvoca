"use client";

import Link from "next/link";
import { Layers, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { leadModeHref, leadModes, type LeadModeSlug } from "@/config/lead-modes";
import { cn } from "@/lib/cn";

const ICONS: Record<LeadModeSlug, typeof Zap> = {
  "instant-leads": Zap,
  "bulk-leads": Layers,
};

/**
 * The Products menu: the two ways a call can start, and the mark beside them.
 *
 * The left column is the menu proper — one line each, which is all either mode
 * needs. The right panel is the brand, not a second menu: the mark animated as
 * the waveform it already is, with a call timer running under it, so the thing
 * Reyvoca does is on screen rather than described. It does not change when you
 * point at a product; the products are the links.
 */
export function ProductsMenu({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[minmax(0,19rem)_minmax(0,17rem)] sm:gap-3">
      <ul className="space-y-1">
        {leadModes.map((item) => {
          const Icon = ICONS[item.slug];
          return (
            <li key={item.slug}>
              <Link
                href={leadModeHref(item.slug)}
                onClick={onNavigate}
                className="group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-night-raised"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-night-text transition-colors group-hover:bg-accent/20 group-hover:text-accent-glow"
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.9375rem] font-medium text-white">{item.label}</span>
                  <span className="mt-0.5 block text-sm leading-snug text-night-muted">{item.menuDescription}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Only worth drawing once there is a column to draw it in. Black, not
          the warm night surface: against the menu's own near-black the warm
          one reads brown, and the ember belongs to the mark alone. */}
      <div aria-hidden="true" className="hidden min-h-[13.5rem] rounded-xl bg-black p-4 sm:block">
        <CallPanel />
      </div>
    </div>
  );
}

/**
 * The mark, lit and moving, under a call that is counting on.
 *
 * The clock sits at the top and the mark fills the room below it — who is
 * speaking first, then the speaking — rather than the clock hanging off the
 * bottom of the logo.
 */
function CallPanel() {
  return (
    <div className="flex h-full flex-col items-center">
      <CallStatus />
      <span className="relative my-auto inline-flex items-center justify-center">
        <span
          className="absolute size-32 rounded-full blur-2xl"
          style={{ background: "radial-gradient(closest-side, #ff5b14b8, #ff7a2e5c 55%, #ff7a2e00 76%)" }}
        />
        <WaveMark className="relative size-[4.5rem]" />
      </span>
    </div>
  );
}

/**
 * The Reyvoca mark with its bars moving, which is what the mark is a picture
 * of. Same geometry as <LogoMark/>; only the motion is added, so the brand is
 * never redrawn in two places. Each bar scales about its own centre, and the
 * delays run outside-in so the movement reads as one voice, not five.
 */
const BARS = [
  { x: 1, y: 12.87, w: 3.92, h: 7.22, r: 1.96, delay: "0ms" },
  { x: 7.25, y: 6.9, w: 4.23, h: 18.46, r: 2.12, delay: "140ms" },
  { x: 13.94, y: 2.25, w: 4.23, h: 27.45, r: 2.12, delay: "280ms", accent: true },
  { x: 20.47, y: 7.04, w: 4.23, h: 18.36, r: 2.12, delay: "140ms" },
  { x: 27.06, y: 12.8, w: 3.92, h: 7.29, r: 1.96, delay: "0ms" },
];

function WaveMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("shrink-0", className)}>
      {BARS.map((bar, index) => (
        <rect
          key={index}
          x={bar.x}
          y={bar.y}
          width={bar.w}
          height={bar.h}
          rx={bar.r}
          className={cn("animate-wave motion-reduce:animate-none", bar.accent ? "fill-accent-glow" : "fill-white")}
          style={{
            // scaleY needs a box and an origin, or SVG scales about the canvas.
            transformBox: "fill-box",
            transformOrigin: "center",
            animationDelay: bar.delay,
          }}
        />
      ))}
    </svg>
  );
}

/** Where the call started, so it opens mid-conversation rather than at zero. */
const OPENS_AT = 46;

/**
 * A call clock: m:ss, rolling 0:59 → 1:00 → 1:59 → 2:00 as a real one does.
 * It starts the moment the menu opens, so the number is always moving while
 * anybody is looking at it. Nothing here claims a real call is in progress —
 * the row says so.
 */
function CallStatus() {
  const [seconds, setSeconds] = useState(OPENS_AT);

  useEffect(() => {
    const tick = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(tick);
  }, []);

  const label = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm">
      <span className="size-1.5 shrink-0 rounded-full bg-accent-glow motion-safe:animate-ping-soft" />
      <span className="font-semibold text-white">Reyvoca</span>
      <span className="font-medium text-night-text tabular-nums">{label}</span>
    </p>
  );
}

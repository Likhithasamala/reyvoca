"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * The live state of the call, written every frame by the stage and read every
 * frame by the canvas. It is a mutable ref rather than props on purpose: the
 * room repaints sixty times a second and React never re-renders for it.
 */
export type SceneState = {
  /** 0–1 loudness of each voice right now. */
  agent: number;
  caller: number;
  /** Seconds into the call. */
  time: number;
  /** Bumps by one each time the agent captures a field; each bump sends a ring. */
  captures: number;
  phase: "ringing" | "live" | "ended";
};

/** Where the two voices sit in the room, in fractions of the frame. */
const CALLER = { x: 0.2, y: 0.62 };
const AGENT = { x: 0.76, y: 0.38 };

const PARTICLES = 120;

type Particle = { x: number; y: number; speed: number; size: number; drift: number; seed: number };

/**
 * The room the call happens in — drawn, not photographed.
 *
 * Two lights stand in for the two people: a cool one where the caller is and
 * an ember one where the agent is. Each swells while its voice holds the floor
 * and settles when it doesn't, so the whole frame breathes in time with the
 * conversation. Between them a current of particles carries the call from the
 * caller towards the agent, and every field the agent captures sends a ring
 * out across the room. Nothing here is stock imagery and nothing is a loop on
 * a timer: every movement is the timeline of the call you are reading.
 */
export function CallScene({ state, reduced }: { state: RefObject<SceneState>; reduced: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const random = seededRandom(20261105);
    const particles: Particle[] = Array.from({ length: PARTICLES }, () => ({
      x: random(),
      y: random(),
      speed: 0.008 + random() * 0.03,
      size: 0.4 + random() * 1.3,
      drift: (random() - 0.5) * 0.012,
      seed: random() * Math.PI * 2,
    }));

    // Rings are born when a field is captured, and when the line is ringing.
    const rings: { born: number; from: "caller" | "agent" }[] = [];
    let seenCaptures = state.current?.captures ?? 0;
    let nextRingAt = 0;

    let agentLevel = 0;
    let callerLevel = 0;
    let frame = 0;
    let previous = 0;

    // Coming back to the tab must not count the time away as one huge step.
    const onVisibility = () => {
      previous = 0;
    };
    document.addEventListener("visibilitychange", onVisibility);

    const paint = (now: number) => {
      const live = state.current ?? { agent: 0, caller: 0, time: 0, captures: 0, phase: "live" as const };
      const delta = previous ? Math.min((now - previous) / 1000, 0.05) : 0.016;
      previous = now;

      // Voices are smoothed so the light eases rather than flickers. With
      // reduced motion there is only this one frame, so the room is lit as if
      // the call were mid-sentence rather than left in the dark.
      const ease = reduced ? 1 : Math.min(1, delta * 6.5);
      agentLevel += ((reduced ? 0.5 : live.agent) - agentLevel) * ease;
      callerLevel += ((reduced ? 0.3 : live.caller) - callerLevel) * ease;

      if (live.captures !== seenCaptures) {
        seenCaptures = live.captures;
        rings.push({ born: now, from: "agent" });
      }
      // While the phone is ringing, the caller's side pulses on its own.
      if (live.phase === "ringing" && now >= nextRingAt) {
        rings.push({ born: now, from: "caller" });
        nextRingAt = now + 1150;
      }

      if (width && height) {
        const seconds = now / 1000;
        ctx.clearRect(0, 0, width, height);
        ctx.globalCompositeOperation = "lighter";

        const callerAt = {
          x: (CALLER.x + Math.sin(seconds * 0.13) * 0.012) * width,
          y: (CALLER.y + Math.cos(seconds * 0.09) * 0.02) * height,
        };
        const agentAt = {
          x: (AGENT.x + Math.sin(seconds * 0.11 + 2) * 0.012) * width,
          y: (AGENT.y + Math.cos(seconds * 0.07 + 1) * 0.02) * height,
        };
        const reach = Math.max(width, height);

        glow(ctx, callerAt.x, callerAt.y, reach * (0.34 + callerLevel * 0.1), "214,208,199", 0.09 + callerLevel * 0.16);
        glow(ctx, agentAt.x, agentAt.y, reach * (0.36 + agentLevel * 0.12), "228,80,28", 0.12 + agentLevel * 0.26);
        glow(ctx, agentAt.x, agentAt.y, reach * (0.14 + agentLevel * 0.06), "242,137,92", 0.05 + agentLevel * 0.16);

        drawParticles(ctx, particles, width, height, delta, seconds, callerLevel, agentLevel, live.phase);
        drawRings(ctx, rings, now, callerAt, agentAt, reach);

        // A dark edge so the type always has somewhere quiet to sit.
        ctx.globalCompositeOperation = "source-over";
        const vignette = ctx.createRadialGradient(
          width * 0.5,
          height * 0.5,
          Math.min(width, height) * 0.2,
          width * 0.5,
          height * 0.5,
          reach * 0.78,
        );
        vignette.addColorStop(0, "rgba(22,19,16,0)");
        vignette.addColorStop(1, "rgba(16,13,11,0.58)");
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, width, height);
      }

      // Reduced motion gets one still frame of the room and nothing more.
      if (!reduced) frame = requestAnimationFrame(paint);
    };

    frame = requestAnimationFrame(paint);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [state, reduced]);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full" />;
}

function glow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, rgb: string, alpha: number) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(${rgb},${alpha.toFixed(3)})`);
  gradient.addColorStop(0.45, `rgba(${rgb},${(alpha * 0.34).toFixed(3)})`);
  gradient.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

/** The current of the call: it runs faster and brighter while someone speaks. */
function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  width: number,
  height: number,
  delta: number,
  seconds: number,
  callerLevel: number,
  agentLevel: number,
  phase: SceneState["phase"],
) {
  const energy = Math.max(callerLevel, agentLevel);
  const flow = (0.25 + energy * 1.5) * (phase === "ended" ? 0.3 : 1);

  for (const particle of particles) {
    particle.x += particle.speed * flow * delta;
    particle.y += particle.drift * delta + Math.sin(seconds * 0.5 + particle.seed) * 0.00018;
    if (particle.x > 1.02) particle.x = -0.02;
    if (particle.y > 1.02) particle.y = -0.02;
    if (particle.y < -0.02) particle.y = 1.02;

    // Towards the agent the current takes on the ember; behind it stays cool.
    const warmth = Math.min(1, Math.max(0, (particle.x - 0.34) / 0.5));
    const r = Math.round(214 + (228 - 214) * warmth);
    const g = Math.round(208 + (137 - 208) * warmth);
    const b = Math.round(199 + (92 - 199) * warmth);
    const twinkle = 0.55 + Math.sin(seconds * 1.6 + particle.seed * 3) * 0.45;
    const alpha = (0.09 + energy * 0.36) * twinkle * (phase === "ended" ? 0.45 : 1);

    ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(particle.x * width, particle.y * height, particle.size * (1 + energy * 0.6), 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Each ring is one real event: a phone ringing, or a field being captured. */
function drawRings(
  ctx: CanvasRenderingContext2D,
  rings: { born: number; from: "caller" | "agent" }[],
  now: number,
  callerAt: { x: number; y: number },
  agentAt: { x: number; y: number },
  reach: number,
) {
  const life = 1700;
  for (let i = rings.length - 1; i >= 0; i--) {
    const age = (now - rings[i].born) / life;
    if (age >= 1) {
      rings.splice(i, 1);
      continue;
    }
    const origin = rings[i].from === "agent" ? agentAt : callerAt;
    const eased = 1 - Math.pow(1 - age, 2.4);
    const radius = reach * 0.02 + eased * reach * 0.17;
    const alpha = (1 - age) * 0.17;
    ctx.strokeStyle =
      rings[i].from === "agent" ? `rgba(242,137,92,${alpha.toFixed(3)})` : `rgba(214,208,199,${(alpha * 0.8).toFixed(3)})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(origin.x, origin.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/** Deterministic placement, so the room looks the same on server and client. */
function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

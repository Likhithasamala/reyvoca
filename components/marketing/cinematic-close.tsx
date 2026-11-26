"use client";

import Link from "next/link";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef, type ReactNode } from "react";
import { useReduced } from "@/components/marketing/opening";
import { Container } from "@/components/ui/container";

/**
 * The stage palette. These are the Ink & Ember values tuned for a surface that
 * travels: ivory warm enough to sit under the glow without going grey, an
 * orange with enough body to carry white display type, and a dark that is
 * brown-black rather than neutral so the orange does not cool as it fades.
 *
 * DARK is mirrored in app/globals.css, which carries the same night under the
 * footer so the page ends on one ground.
 */
const IVORY = "#F6F0E4"; /* --color-cream: the scene opens on the page's own band */
const ORANGE = "#F04B0A";
const ORANGE_DEEP = "#E94709";
const DARK = "#160E09";
const LIGHT = "#FFFAF4";
const INK = "#171310";

/**
 * Scroll positions, as a fraction of the headline's runway. Everything below
 * reads from this one map, which is what keeps the glow, the type and the
 * buttons on a single timeline instead of five that drift apart.
 *
 * The ordering matters more than the exact numbers: the orange has to be
 * substantially there (FILL_IN..FILL_OUT) *before* the white line is revealed
 * (LINE2_IN), because white on ivory is the one state that can never happen.
 */
const GLOW_IN = 0.04;
const GLOW_OUT = 0.32;
const FILL_IN = 0.22;
const FILL_OUT = 0.46;
const LINE2_IN = 0.44;
const LINE2_OUT = 0.6;
const DARK_IN = 0.62;
const DARK_OUT = 0.88;
/** The headline clears the frame as the section below it arrives. */
const EXIT_IN = 0.9;

export type CinematicCloseProps = {
  /** The line that starts dark on ivory and fades out as the dark arrives. */
  line1: string;
  /** The line that is revealed in white once the orange is behind it. */
  line2: string;
  note: string;
  cta: { label: string; href: string };
  secondary: { label: string; href: string };
  /** Labels the section for assistive tech; the heading carries the id. */
  headingId?: string;
  /**
   * Whatever rides the same night below the headline — on the homepage, the
   * booking section. It is laid over the scene's own background, so anything
   * passed here must be transparent and lit for a dark ground.
   */
  children?: ReactNode;
};

/**
 * A scroll-driven closing scene: ivory, a rising ember, full orange, then
 * night — and the night then *stays* for everything below it.
 *
 * The whole scene is one element with a single pinned background inside it, so
 * the ground is continuous from "Your next enquiry" to the last line of the
 * footer: the headline and the booking form are two moments on one surface,
 * not two sections that happen to be adjacent. The `data-night-close` hook on
 * the root is what tells globals.css to carry the same dark under the footer.
 *
 * Every value is a pure function of scroll position, which makes the sequence
 * reversible for free — scrolling back up plays it backwards exactly, because
 * nothing is driven by time or by a one-shot trigger.
 *
 * Only opacity, transform and colour are animated, so the browser can keep the
 * work on the compositor; no layout property moves.
 *
 * Readers who ask for reduced motion get the static composition instead, which
 * is a designed state in its own right rather than a stripped one.
 */
export function CinematicClose({
  line1,
  line2,
  note,
  cta,
  secondary,
  headingId = "cta-heading",
  children,
}: CinematicCloseProps) {
  const runwayRef = useRef<HTMLDivElement>(null);
  const reduced = useReduced();

  // The headline's runway: from its top meeting the viewport's top to its
  // bottom meeting the bottom — exactly the span the sticky child is pinned.
  const { scrollYProgress } = useScroll({ target: runwayRef, offset: ["start start", "end end"] });

  // --- the ground -------------------------------------------------------
  const glowOpacity = useTransform(scrollYProgress, [GLOW_IN, GLOW_OUT], [0, 1]);
  const glowScale = useTransform(scrollYProgress, [GLOW_IN, 0.5], [0.55, 1.45]);
  const glowY = useTransform(scrollYProgress, [GLOW_IN, 0.5], ["26%", "0%"]);
  const fillOpacity = useTransform(scrollYProgress, [FILL_IN, FILL_OUT], [0, 1]);
  const darkOpacity = useTransform(scrollYProgress, [DARK_IN, DARK_OUT], [0, 1]);

  // --- the type ---------------------------------------------------------
  const line1Opacity = useTransform(scrollYProgress, [DARK_IN, 0.8], [1, 0]);
  const line2Opacity = useTransform(scrollYProgress, [LINE2_IN, LINE2_OUT], [0, 1]);
  const line2Y = useTransform(scrollYProgress, [LINE2_IN, LINE2_OUT], [34, 0]);
  const line2Scale = useTransform(scrollYProgress, [LINE2_IN, LINE2_OUT], [0.985, 1]);
  const headY = useTransform(scrollYProgress, [DARK_IN, 1], [0, -28]);
  const stageOpacity = useTransform(scrollYProgress, [EXIT_IN, 1], [1, 0]);

  // Small text goes ink on the orange — white would fail there — and only
  // turns light once the ground is actually dark.
  const softColor = useTransform(scrollYProgress, [DARK_IN, DARK_OUT], [INK, LIGHT]);
  const buttonBg = useTransform(scrollYProgress, [DARK_IN, DARK_OUT], [INK, LIGHT]);
  const buttonFg = useTransform(scrollYProgress, [DARK_IN, DARK_OUT], [LIGHT, INK]);

  if (reduced) {
    return (
      <StaticClose line1={line1} line2={line2} note={note} cta={cta} secondary={secondary} headingId={headingId}>
        {children}
      </StaticClose>
    );
  }

  return (
    <div data-night-close className="relative isolate">
      {/* The ground, pinned for the whole scene — headline and form alike. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
        <div className="sticky top-0 h-[100svh] overflow-hidden" style={{ backgroundColor: IVORY }}>
          {/* The glow, anchored to the floor and growing up out of it. */}
          <motion.div
            style={{ opacity: glowOpacity, scale: glowScale, y: glowY }}
            className="absolute inset-x-0 top-[-40%] bottom-0 origin-bottom will-change-transform"
          >
            <div
              className="size-full"
              style={{
                background: `radial-gradient(72% 56% at 50% 100%, ${ORANGE} 0%, ${ORANGE}d9 26%, ${ORANGE}8c 48%, ${ORANGE}33 66%, ${ORANGE}00 82%)`,
              }}
            />
          </motion.div>

          {/* The orange closing over the whole frame. */}
          <motion.div style={{ opacity: fillOpacity, backgroundColor: ORANGE_DEEP }} className="absolute inset-0" />

          {/* And the night closing over that — and staying. Nothing warm is
              laid back over it: orange at low alpha on this dark reads as
              maroon, so below the headline the ground is black, and orange
              is left to do its job as a signal in the content instead. */}
          <motion.div style={{ opacity: darkOpacity, backgroundColor: DARK }} className="absolute inset-0" />
        </div>
      </div>

      <div className="relative z-10">
        {/* The runway. Shorter on a phone: the same story, less thumb. */}
        <div ref={runwayRef} className="h-[168svh] md:h-[215svh]">
          <motion.div style={{ opacity: stageOpacity }} className="sticky top-0 flex h-[100svh] flex-col justify-center">
            <Container>
              <motion.h2
                id={headingId}
                style={{ y: headY }}
                className="text-[clamp(2.125rem,6.4vw,7rem)] leading-[1.0] font-semibold tracking-[-0.03em] text-balance"
              >
                <motion.span style={{ opacity: line1Opacity, color: INK }} className="block">
                  {line1}
                </motion.span>
                <motion.span
                  style={{ opacity: line2Opacity, y: line2Y, scale: line2Scale, color: LIGHT }}
                  className="block origin-left will-change-transform"
                >
                  {line2}
                </motion.span>
              </motion.h2>

              <div className="mt-12 grid gap-8 lg:mt-16 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center lg:gap-14">
                <div className="flex flex-wrap items-center gap-6">
                  <motion.span style={{ backgroundColor: buttonBg, color: buttonFg }} className="inline-block rounded-full">
                    <Link href={cta.href} className="block px-9 py-4 text-lg leading-none font-semibold text-current">
                      {cta.label}
                    </Link>
                  </motion.span>

                  <motion.span style={{ color: softColor }}>
                    <Link
                      href={secondary.href}
                      className="text-lg font-semibold text-current underline decoration-current/40 underline-offset-[6px] transition-[text-decoration-color] hover:decoration-current"
                    >
                      {secondary.label}
                    </Link>
                  </motion.span>
                </div>

                <motion.p style={{ color: softColor }} className="max-w-[46ch] text-base leading-relaxed">
                  {note}
                </motion.p>
              </div>
            </Container>
          </motion.div>
        </div>

        {/* Everything that stays in the night: the booking section. */}
        {children}
      </div>
    </div>
  );
}

/**
 * The reduced-motion composition: the same words at the same scale, lit once
 * and held. Ink on ivory for the first line, white on ember for the second —
 * and whatever rides below still sits on the night it would have arrived at.
 */
function StaticClose({
  line1,
  line2,
  note,
  cta,
  secondary,
  headingId,
  children,
}: Required<Omit<CinematicCloseProps, "children">> & { children?: ReactNode }) {
  return (
    <div data-night-close>
      <section
        aria-labelledby={headingId}
        className="relative isolate overflow-hidden py-20 lg:py-24"
        style={{
          background: `linear-gradient(to bottom, ${IVORY} 0%, ${IVORY} 18%, ${ORANGE} 42%, ${ORANGE_DEEP} 84%, ${DARK} 100%)`,
        }}
      >
        <Container>
          <h2
            id={headingId}
            className="text-[clamp(2.125rem,6.4vw,7rem)] leading-[1.0] font-semibold tracking-[-0.03em] text-balance"
          >
            <span className="block" style={{ color: INK }}>
              {line1}
            </span>
            <span className="block" style={{ color: LIGHT }}>
              {line2}
            </span>
          </h2>

          <div className="mt-12 grid gap-8 lg:mt-16 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center lg:gap-14">
            <div className="flex flex-wrap items-center gap-6">
              <Link
                href={cta.href}
                className="inline-block rounded-full px-9 py-4 text-lg leading-none font-semibold"
                style={{ backgroundColor: INK, color: LIGHT }}
              >
                {cta.label}
              </Link>
              <Link
                href={secondary.href}
                className="text-lg font-semibold underline decoration-current/40 underline-offset-[6px]"
                style={{ color: INK }}
              >
                {secondary.label}
              </Link>
            </div>
            <p className="max-w-[46ch] text-base leading-relaxed" style={{ color: INK }}>
              {note}
            </p>
          </div>
        </Container>
      </section>

      <div style={{ backgroundColor: DARK }}>{children}</div>
    </div>
  );
}

/** Keeps `MotionValue` referenced for consumers reading the exported types. */
export type { MotionValue };

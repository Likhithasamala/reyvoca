"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { routes } from "@/config/site";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Who is on the other end of the call. The line reads for all of them. */
const CALLERS = ["buyer", "patient", "candidate", "tenant", "client", "customer"];

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

/** The motion preference, read without breaking hydration. */
export function useReduced() {
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

/**
 * The opening: one claim, centred on flat cream.
 *
 * The colour does the work — full ink type on a warm ground, with ember kept
 * for the single word that changes and nothing else. The only moving part is
 * the person on the other end of the line, because the promise holds for all
 * of them.
 */
export function Opening() {
  const reduced = useReduced();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const timer = setInterval(() => setIndex((value) => (value + 1) % CALLERS.length), 2300);
    return () => clearInterval(timer);
  }, [reduced]);

  return (
    <section aria-labelledby="opening-heading" className="opening relative isolate overflow-hidden">
      <div aria-hidden="true" className="opening-grain absolute inset-0 z-[1]" />

      <div className="relative z-[2] mx-auto flex min-h-[min(86svh,42rem)] w-full max-w-[64rem] flex-col items-center justify-center px-5 pt-28 pb-12 text-center sm:px-6 lg:pt-32 lg:pb-14">
        <h1
          id="opening-heading"
          className="text-[clamp(2.25rem,6.4vw,5rem)] leading-[1.02] font-semibold tracking-[-0.04em] text-ink"
        >
          <MaskedLine text="Never miss a call" delay={0.08} />
          <span className="flex flex-wrap items-baseline justify-center gap-x-[0.28em]">
            <MaskedLine text="from a" delay={0.18} />
            <RotatingCaller word={CALLERS[index]} reduced={reduced} />
          </span>
        </h1>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55, ease: EASE }}
          className="flex flex-col items-center"
        >
          <p className="mt-7 max-w-[44ch] text-[1.0625rem] leading-relaxed text-ink sm:text-[1.125rem]">
            An enquiry lands at nine at night. Your AI voice agent calls back in seconds, qualifies it in their
            language, and books the next step before morning.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={routes.bookDemo}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-6 text-[1rem] font-semibold text-cream transition-[background-color,transform] hover:-translate-y-px hover:bg-brand-hover"
            >
              Book a demo
            </Link>
            <Link
              href={routes.howItWorks}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent-wash px-6 text-[1rem] font-semibold text-accent-strong transition-colors hover:bg-accent-soft"
            >
              How it works
              <ArrowDown className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <p className="mt-7 text-[1rem] text-ink-muted">
            We build the first agent with you on the call.{" "}
            <Link
              href={routes.signIn}
              className="font-medium text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ink"
            >
              Already with us? Sign in
            </Link>
            .
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/** Each headline line rises from behind its own baseline. */
function MaskedLine({ text, delay }: { text: string; delay: number }) {
  const reduced = useReduced();
  return (
    <span className="inline-block overflow-hidden pt-[0.14em] -mt-[0.14em] pb-[0.1em] -mb-[0.1em] align-baseline">
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
 * The one word that changes. The span animates its own width so the line
 * re-centres itself instead of jumping, and the ember rule under it follows.
 */
function RotatingCaller({ word, reduced }: { word: string; reduced: boolean }) {
  return (
    <motion.span
      layout={!reduced}
      transition={{ duration: 0.5, ease: EASE }}
      className="relative inline-flex overflow-hidden pt-[0.14em] -mt-[0.14em] pb-[0.1em] -mb-[0.1em] text-accent"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={word}
          initial={reduced ? false : { y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduced ? undefined : { y: "-100%", opacity: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="block whitespace-nowrap"
        >
          {word}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}

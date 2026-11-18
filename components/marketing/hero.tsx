"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { hero } from "@/config/marketing";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ConversationDemo } from "./conversation-demo";

/** Each headline line rises from behind its own baseline — the one loud move. */
function MaskedLine({ text, delay }: { text: string; delay: number }) {
  const reducedMotion = useReducedMotion();
  return (
    <span className="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
      <motion.span
        className="block"
        initial={reducedMotion ? false : { y: "110%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {text}
      </motion.span>
    </span>
  );
}

export function Hero() {
  const reducedMotion = useReducedMotion();

  return (
    <section aria-labelledby="hero-heading" className="bg-canvas">
      <Container className="grid grid-cols-1 items-start gap-12 pt-14 pb-24 lg:grid-cols-[1fr_1.02fr] lg:gap-12 lg:pt-24 lg:pb-32">
        <div className="max-w-xl lg:pt-6">
          <h1
            id="hero-heading"
            className="text-[clamp(2.4rem,4.3vw,3.9rem)] leading-[1.04] tracking-[-0.035em] font-semibold text-ink"
          >
            <MaskedLine text={hero.line1} delay={0.05} />
            <MaskedLine text={hero.line2} delay={0.16} />
          </h1>

          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
          >
            <p className="mt-7 max-w-[34rem] text-lead text-ink-muted">{hero.subtitle}</p>

            <div className="mt-9 flex flex-wrap items-center gap-5">
              <ButtonLink href={hero.primaryCta.href} size="lg">
                {hero.primaryCta.label}
              </ButtonLink>
              <Link
                href={hero.secondaryCta.href}
                className="text-base font-medium text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ink"
              >
                {hero.secondaryCta.label}
              </Link>
            </div>

            <p className="mt-8 text-sm text-ink-subtle">{hero.note}</p>
          </motion.div>
        </div>

        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
        >
          <ConversationDemo />
        </motion.div>
      </Container>
    </section>
  );
}

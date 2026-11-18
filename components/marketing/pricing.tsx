"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { pricing } from "@/config/marketing";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/cn";

/**
 * Plans as an index: the names are the heading, the stage shows whichever is
 * selected. Figures are honest — no invented prices while pricing is
 * unannounced. The middle plan is selected on load.
 */
export function Pricing() {
  const reducedMotion = useReducedMotion();
  const [selected, setSelected] = useState(1);
  const tier = pricing.tiers[selected];

  return (
    <section id={pricing.id} aria-labelledby="pricing-heading" className="bg-surface py-28 lg:py-36">
      <h2 id="pricing-heading" className="sr-only">
        Pricing
      </h2>
      <Container className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
        {/* Plan names */}
        <div className="lg:col-span-6" role="tablist" aria-label="Plans">
          {pricing.tiers.map((t, index) => {
            const active = index === selected;
            return (
              <div key={t.name}>
                <button
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelected(index)}
                  onFocus={() => setSelected(index)}
                  className={cn(
                    "flex items-center gap-4 py-2 text-left text-[clamp(2.5rem,5vw,4.25rem)] leading-[1.1] font-semibold transition-colors",
                    active ? "text-ink" : "text-ink-subtle hover:text-ink-muted",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn("size-[0.3em] shrink-0 rounded-full transition-opacity", active ? "bg-accent opacity-100" : "opacity-0")}
                  />
                  {t.name}
                </button>

                {/* Phone: the stage opens under the selected name */}
                <AnimatePresence initial={false}>
                  {active && (
                    <motion.div
                      key={`stage-m-${t.name}`}
                      initial={reducedMotion ? false : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={reducedMotion ? undefined : { opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden lg:hidden"
                    >
                      <PlanStage tier={t} className="pt-4 pb-16 pl-[0.9em]" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          <p className="mt-8 text-sm text-ink-subtle">{pricing.note}</p>
        </div>

        {/* Desktop stage: fixed position, contents crossfade */}
        <div className="hidden lg:col-span-6 lg:block">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tier.name}
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reducedMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <PlanStage tier={tier} />
            </motion.div>
          </AnimatePresence>
        </div>
      </Container>
    </section>
  );
}

function PlanStage({ tier, className }: { tier: (typeof pricing.tiers)[number]; className?: string }) {
  return (
    <div className={cn("flex flex-col items-start gap-6", className)}>
      <p className="flex items-baseline gap-4">
        <span className="text-[clamp(3.5rem,8vw,7rem)] leading-none font-semibold text-ink">{tier.figure}</span>
        <span className="text-[17px] text-ink-muted">{tier.period}</span>
      </p>
      {/* On the phone the paragraph closes the stage so no short label sits
          above the next plan name; on desktop the button closes it. */}
      <p className="order-3 max-w-[42ch] text-[17px] leading-relaxed text-ink lg:order-2">{tier.description}</p>
      <Link
        href={tier.cta.href}
        className="order-2 block w-full rounded-xl bg-brand px-6 py-3.5 text-center text-base font-medium text-white transition-colors hover:bg-brand-hover lg:order-3 lg:inline-block lg:w-auto"
      >
        {tier.cta.label}
      </Link>
    </div>
  );
}

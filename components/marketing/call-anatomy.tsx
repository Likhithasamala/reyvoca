"use client";

import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { anatomy } from "@/config/marketing";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/cn";
import { SCENARIOS } from "./conversation-scenarios";

type StageKind = (typeof anatomy.steps)[number]["stage"];

const call = SCENARIOS[0]; // the real-estate call, reused across all three states

/** The same call, shown as the live transcript. */
function TranscriptState() {
  return (
    <div className="space-y-2.5 p-4 sm:p-5">
      {call.messages.slice(0, 4).map((m) => (
        <div key={m.at} className={cn("flex", m.speaker === "agent" ? "justify-start" : "justify-end")}>
          <p
            className={cn(
              "max-w-[85%] rounded-xl px-3 py-2 text-[13px] leading-snug",
              m.speaker === "agent" ? "rounded-tl-sm bg-surface-muted text-ink" : "rounded-tr-sm bg-brand text-white",
            )}
          >
            <span className={cn("mb-0.5 block text-[11px] font-semibold", m.speaker === "agent" ? "text-accent-strong" : "text-night-muted")}>
              {m.speaker === "agent" ? "Agent" : "Caller"}
            </span>
            {m.text}
          </p>
        </div>
      ))}
    </div>
  );
}

/** The same call, as the fields the agent extracted. */
function IntentState() {
  return (
    <div className="p-4 sm:p-5">
      <p className="text-[12px] font-semibold text-ink">Captured during the call</p>
      <dl className="mt-3 space-y-3">
        {call.fields.map((f) => (
          <div key={f.label} className="flex items-baseline justify-between gap-4 border-b border-line pb-2.5">
            <dt className="text-[13px] text-ink-muted">{f.label}</dt>
            <dd className="text-[13px] font-semibold text-ink">{f.value}</dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-4 pt-1">
          <dt className="text-[13px] text-ink-muted">Outcome</dt>
          <dd>
            <span
              className="inline-flex rounded px-1.5 py-0.5 text-[12px] font-semibold"
              style={{ background: "var(--color-success-soft)", color: "var(--color-success)" }}
            >
              {call.outcome.label}
            </span>
          </dd>
        </div>
      </dl>
    </div>
  );
}

/** The same call, filed in the workspace with its next action. */
function WorkspaceState() {
  return (
    <div className="p-4 sm:p-5">
      <p className="text-[12px] font-semibold text-ink">Conversations</p>
      <div className="mt-3 space-y-px">
        <div className="rounded-lg bg-surface-muted px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 truncate text-[13px] font-semibold text-ink">Harper St enquiry</p>
            <span
              className="shrink-0 rounded px-1.5 py-0.5 text-[12px] font-semibold"
              style={{ background: "var(--color-success-soft)", color: "var(--color-success)" }}
            >
              Qualified
            </span>
          </div>
          <p className="mt-0.5 text-[12px] text-ink-muted">Inbound · Listings desk · 00:24</p>
          <p className="mt-2 text-[13px] leading-snug text-ink">
            Caller asked about the 2-bed on Harper St; budget $2,400/mo, moving within 2 months. Viewing booked.
          </p>
        </div>
        <div className="flex items-center gap-2.5 px-3 pt-3">
          <ArrowRight className="size-4 shrink-0 text-accent-strong" aria-hidden="true" />
          <p className="text-[13px]">
            <span className="font-semibold text-ink">Next action</span>
            <span className="text-ink-muted"> — confirm Saturday 11:00 viewing</span>
          </p>
        </div>
      </div>
    </div>
  );
}

const STAGES: Record<StageKind, () => React.ReactNode> = {
  transcript: TranscriptState,
  intent: IntentState,
  workspace: WorkspaceState,
};

function StageHeader() {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line bg-surface-muted px-4 py-2.5">
      <p className="text-[13px] font-semibold text-ink">Harper St enquiry</p>
      <p className="text-[12px] text-ink-subtle">Simulated call record</p>
    </div>
  );
}

/**
 * One call shown three ways: a sticky stage on the right changes state as the
 * three statements on the left scroll past. The fragments are HTML states of
 * the product UI, not screenshots.
 */
export function CallAnatomy() {
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState(0);

  return (
    <section id={anatomy.id} aria-labelledby="anatomy-heading" className="bg-cream py-20 lg:py-24">
      <Container>
        <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-accent-strong uppercase">
          {anatomy.eyebrow}
        </p>
        <h2 id="anatomy-heading" className="mt-5 text-h2 font-semibold text-ink">
          {anatomy.heading}
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:mt-6 lg:grid-cols-12 lg:gap-8">
          {/* Statements; on the phone each carries its own state card */}
          <div className="lg:col-span-5">
            {anatomy.steps.map((step, index) => (
              <motion.div
                key={step.statement}
                onViewportEnter={() => setActive(index)}
                viewport={{ amount: 0.5, margin: "-25% 0px -25% 0px" }}
                className="flex flex-col justify-center py-8 lg:min-h-[64vh] lg:py-10"
              >
                <p
                  className={cn(
                    "max-w-[22ch] text-[1.75rem] leading-tight font-semibold transition-colors duration-300 sm:text-[2rem]",
                    active === index ? "text-ink" : "text-ink lg:text-ink-muted",
                  )}
                >
                  {step.statement}
                </p>
                <p className="mt-4 max-w-[44ch] text-base leading-relaxed text-ink-muted">{step.support}</p>

                <div data-ui className="mt-6 overflow-hidden rounded-2xl border border-line bg-surface lg:hidden">
                  <StageHeader />
                  {STAGES[step.stage]()}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Desktop: one sticky stage whose state follows the scroll */}
          <div className="hidden lg:col-span-7 lg:block">
            <div className="sticky top-[14vh]">
              <div data-ui className="min-h-[360px] overflow-hidden rounded-2xl border border-line bg-surface">
                <StageHeader />
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={anatomy.steps[active].stage}
                    initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                  >
                    {STAGES[anatomy.steps[active].stage]()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

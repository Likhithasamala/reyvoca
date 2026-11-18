"use client";

import { Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { build } from "@/config/marketing";
import { Container } from "@/components/ui/container";
import { Waveform } from "@/components/ui/waveform";
import { cn } from "@/lib/cn";

/* ----- Fragments: cropped pieces of the real interface, data-ui insides ----- */

function InstructionsFragment() {
  return (
    <div data-ui className="w-[115%] max-w-none rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-3.5 py-2">
        <p className="text-[12px] font-semibold text-ink">Instructions</p>
        <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[11px] font-medium text-ink-muted">Sales outreach</span>
      </div>
      <p className="px-3.5 py-3 text-[13px] leading-relaxed text-ink">
        You are a friendly sales agent for a home-services company. Confirm the lead&rsquo;s interest, ask about timing and
        budget, and offer the next available consultation. If they ask for a person, transfer politely.
      </p>
      <div className="flex justify-end border-t border-line px-3.5 py-2">
        <span className="rounded-md bg-brand px-3 py-1.5 text-[12px] font-medium text-white">Save agent</span>
      </div>
    </div>
  );
}

function VoiceFragment() {
  // Mirrors the real voice picker, which lists the voice and what it speaks —
  // never the vendor behind it.
  const voices = [
    { name: "Rachel", meta: "Female · English", selected: true },
    { name: "Swara", meta: "Female · Hindi", selected: false },
    { name: "Priya", meta: "Female · Multilingual", selected: false },
  ];
  return (
    <div data-ui className="w-[110%] max-w-none rounded-xl border border-line bg-surface p-2">
      {voices.map((v) => (
        <div
          key={v.name}
          className={cn(
            "flex items-center justify-between gap-3 rounded-lg px-2.5 py-2",
            v.selected && "bg-surface-muted",
          )}
        >
          <div className="flex items-center gap-2.5">
            <span className={cn("flex size-7 items-center justify-center rounded-full", v.selected ? "bg-brand text-accent-glow" : "bg-surface-muted text-ink-subtle")}>
              <Waveform active={v.selected} bars={3} className="h-2.5" />
            </span>
            <div>
              <p className="text-[13px] font-medium text-ink">{v.name}</p>
              <p className="text-[11px] text-ink-muted">{v.meta}</p>
            </div>
          </div>
          {v.selected && <Check className="size-4 text-accent-strong" aria-hidden="true" />}
        </div>
      ))}
    </div>
  );
}

function KnowledgeFragment() {
  const docs = [
    { name: "pricing-faq.md", size: "4 KB" },
    { name: "service-areas.pdf", size: "210 KB" },
    { name: "cancellation-policy.md", size: "2 KB" },
  ];
  return (
    <div data-ui className="w-[112%] max-w-none rounded-xl border border-line bg-surface">
      <div className="border-b border-line px-3.5 py-2">
        <p className="text-[12px] font-semibold text-ink">Knowledge</p>
      </div>
      <ul className="px-2 py-1.5">
        {docs.map((d) => (
          <li key={d.name} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2">
            <p className="truncate text-[13px] text-ink">{d.name}</p>
            <span className="flex shrink-0 items-center gap-2 text-[11px] text-ink-muted">
              {d.size}
              <span className="rounded px-1.5 py-0.5 font-medium" style={{ background: "var(--color-success-soft)", color: "var(--color-success)" }}>
                Indexed
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CampaignFragment() {
  const rows = [
    { name: "A. Mercer", phone: "…4821", status: "Completed", tone: "done" },
    { name: "L. Osei", phone: "…3307", status: "Calling", tone: "live" },
    { name: "R. Tanaka", phone: "…9112", status: "Queued", tone: "idle" },
  ];
  return (
    <div data-ui className="w-[115%] max-w-none rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-3.5 py-2">
        <p className="text-[12px] font-semibold text-ink">June follow-ups</p>
        <p className="text-[11px] text-ink-muted">3 of 48 leads</p>
      </div>
      <table className="w-full">
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-b border-line last:border-0">
              <td className="px-3.5 py-2 text-[13px] font-medium text-ink">{r.name}</td>
              <td className="px-2 py-2 text-[12px] text-ink-muted tabular-nums">{r.phone}</td>
              <td className="px-3.5 py-2 text-right">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 text-[12px] font-medium",
                    r.tone === "live" ? "text-accent-strong" : r.tone === "done" ? "text-ink" : "text-ink-subtle",
                  )}
                >
                  {r.tone === "live" && <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-accent" />}
                  {r.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LineFragment() {
  return (
    <div data-ui className="w-[112%] max-w-none rounded-xl border border-line bg-surface p-3.5">
      <p className="text-[12px] font-semibold text-ink">Inbound line</p>
      <div className="mt-2.5 rounded-lg border border-line bg-surface px-3 py-2">
        <p className="text-[11px] text-ink-muted">Number</p>
        <p className="text-[13px] font-medium text-ink tabular-nums">+1 (415) 555-0134</p>
      </div>
      <div className="mt-2 rounded-lg border border-line bg-surface px-3 py-2">
        <p className="text-[11px] text-ink-muted">Greeting</p>
        <p className="text-[13px] text-ink">&ldquo;Thanks for calling Cedar Dental — how can I help?&rdquo;</p>
      </div>
      <div className="mt-2.5 flex items-center justify-between px-0.5">
        <p className="text-[12px] text-ink-muted">Hand off to a person on request</p>
        <span className="relative h-4.5 w-8 rounded-full bg-brand">
          <span className="absolute top-0.5 right-0.5 size-3.5 rounded-full bg-white" />
        </span>
      </div>
    </div>
  );
}

function ResultsFragment() {
  // Calls per day, Mon–Fri. Today (Fri) = 8; the outcome chips below sum to it.
  const days = [
    { label: "Mon", value: 4 },
    { label: "Tue", value: 6 },
    { label: "Wed", value: 3 },
    { label: "Thu", value: 5 },
    { label: "Fri", value: 8, today: true },
  ];
  const max = 8;
  return (
    <div data-ui className="w-[112%] max-w-none rounded-xl border border-line bg-surface p-3.5">
      <div className="flex items-baseline justify-between">
        <p className="text-[12px] font-semibold text-ink">Calls this week</p>
        <p className="text-[12px] text-ink-muted"><span className="font-semibold text-ink tabular-nums">26</span> total</p>
      </div>
      <div className="mt-3 flex h-[72px] items-end gap-2" role="img" aria-label="Bar chart: calls per weekday, Monday 4, Tuesday 6, Wednesday 3, Thursday 5, Friday 8">
        {days.map((d) => (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={cn("w-full rounded-t-sm", d.today ? "bg-accent" : "bg-line-strong")}
              style={{ height: `${(d.value / max) * 56}px` }}
            />
            <span className="text-[10px] text-ink-subtle">{d.label}</span>
          </div>
        ))}
      </div>
      <p className="mt-2.5 border-t border-line pt-2 text-[12px] text-ink-muted">
        Today: <span className="font-medium text-ink">3 qualified · 2 callbacks · 3 no answer</span>
      </p>
    </div>
  );
}

const FRAGMENTS: Record<(typeof build.cells)[number]["fragment"], () => React.ReactNode> = {
  instructions: InstructionsFragment,
  voice: VoiceFragment,
  knowledge: KnowledgeFragment,
  campaign: CampaignFragment,
  line: LineFragment,
  results: ResultsFragment,
};

/**
 * Six filled cells, 8px gaps, no outlines. Text and fragment swap ends in a
 * checkerboard; fragments are cropped by their cell edge at true size.
 */
export function BuildGrid() {
  const reducedMotion = useReducedMotion();

  return (
    <section id={build.id} aria-labelledby="build-heading" className="bg-canvas py-28 lg:py-36">
      <Container>
        <h2 id="build-heading" className="text-h2 font-semibold text-ink">
          {build.heading}
        </h2>

        <div className="mt-14 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {build.cells.map((cell, index) => {
            const flip = index % 2 === 1; // fragment-first cells form the checkerboard
            const Fragment = FRAGMENTS[cell.fragment];
            return (
              <motion.div
                key={cell.title}
                initial={reducedMotion ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.55, delay: (index % 3) * 0.08 }}
                className={cn(
                  "flex min-h-[420px] flex-col overflow-hidden rounded-2xl bg-surface-muted",
                  flip ? "flex-col-reverse" : "",
                )}
              >
                <div className="p-6">
                  <h3 className="text-[17px] font-semibold text-ink">{cell.title}</h3>
                  <p className="mt-2 max-w-[38ch] text-base leading-relaxed text-ink-muted">{cell.body}</p>
                </div>
                <div
                  className={cn(
                    "flex flex-1 items-center overflow-hidden px-6",
                    flip ? "items-start pt-6" : "items-end pb-0",
                    index % 2 === 0 ? "justify-end pr-0" : "justify-start pl-0",
                  )}
                >
                  <Fragment />
                </div>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

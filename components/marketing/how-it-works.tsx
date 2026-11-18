import { howItWorks } from "@/config/marketing";
import { Container } from "@/components/ui/container";

/**
 * The five-step spine, set as a numbered rail.
 *
 * The numbers are information here, not decoration — this is a sequence, and
 * the reader needs the order. Ember marks only the numerals, which keeps the
 * accent in its ~5% budget while still carrying the eye down the list.
 */
export function HowItWorks() {
  return (
    <section
      id={howItWorks.id}
      aria-labelledby="how-it-works-heading"
      className="bg-canvas py-28 lg:py-36"
    >
      <Container>
        <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-accent-strong uppercase">
          {howItWorks.eyebrow}
        </p>
        <h2 id="how-it-works-heading" className="mt-5 max-w-[20ch] text-h2 font-semibold text-ink text-balance">
          {howItWorks.heading}
        </h2>
        <p className="mt-4 max-w-[46ch] text-lead text-ink-muted">{howItWorks.subheading}</p>

        <ol className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
          {howItWorks.steps.map((step) => (
            <li key={step.number} className="flex min-w-0 flex-col gap-3 bg-surface p-6 lg:p-7">
              <span className="font-mono text-sm font-semibold tracking-[0.1em] text-accent-strong tabular-nums">
                {step.number}
              </span>
              <h3 className="text-[0.9375rem] font-semibold text-ink text-balance">{step.title}</h3>
              <p className="text-sm leading-relaxed text-ink-muted">{step.detail}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

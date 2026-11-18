import { faq } from "@/config/marketing";
import { Container } from "@/components/ui/container";

/**
 * Filled-tile accordion: a sticky heading on the left, one tile open at a
 * time (shared <details> name). The open tile fills with ink — the brand's
 * primary — since ember is never used as a large fill.
 */
export function Faq() {
  return (
    <section id={faq.id} aria-labelledby="faq-heading" className="bg-canvas py-28 lg:py-36">
      <Container className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <h2 id="faq-heading" className="text-[clamp(2.25rem,4vw,3.5rem)] font-semibold text-ink lg:sticky lg:top-24">
            {faq.heading}
          </h2>
        </div>

        <div className="space-y-2 lg:col-span-8">
          {faq.items.map((item) => (
            <details key={item.question} name="faq" className="faq-item group rounded-xl bg-surface-muted open:bg-brand">
              <summary className="flex min-h-[72px] cursor-pointer list-none items-center justify-between gap-6 px-6 py-5 [&::-webkit-details-marker]:hidden">
                <span className="text-[17px] font-medium text-ink transition-colors group-open:text-white sm:text-[20px]">
                  {item.question}
                </span>
                <span aria-hidden="true" className="relative size-4 shrink-0">
                  <span className="absolute top-1/2 left-0 h-[3px] w-4 -translate-y-1/2 rounded-full bg-ink transition-colors group-open:bg-accent-glow" />
                  <span className="absolute top-1/2 left-1/2 h-4 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink transition-[transform,background-color] duration-300 group-open:rotate-90 group-open:bg-accent-glow" />
                </span>
              </summary>
              <p className="max-w-[52ch] px-6 pb-6 text-[17px] leading-relaxed text-ink group-open:text-night-text">{item.answer}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}

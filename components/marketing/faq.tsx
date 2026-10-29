import { Plus } from "lucide-react";
import { faq } from "@/config/marketing";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

/**
 * Accordion built on native <details>/<summary>: keyboard and screen-reader
 * accessible with zero client JavaScript. The shared `name` makes it
 * exclusive (opening one closes the others) in supporting browsers.
 */
export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-heading" className="bg-surface-muted py-24 lg:py-32">
      <Container className="grid grid-cols-1 gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <SectionHeading
          id="faq-heading"
          eyebrow={faq.eyebrow}
          title={faq.title}
          align="left"
          description="Reyvoca is in active development. Answers describe the platform we're building."
        />
        <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
          {faq.items.map((item) => (
            <details key={item.question} name="faq" className="faq-item group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-6 py-5 text-left text-base font-semibold text-ink transition-colors hover:text-ink-muted sm:text-[1.0625rem] [&::-webkit-details-marker]:hidden">
                {item.question}
                <span
                  aria-hidden="true"
                  className="flex size-7 shrink-0 items-center justify-center rounded-full border border-line text-ink-muted transition-[transform,background-color,color,border-color] duration-200 group-open:rotate-45 group-open:border-ink group-open:bg-ink group-open:text-white"
                >
                  <Plus className="size-4" />
                </span>
              </summary>
              <p className="px-6 pb-6 text-[0.9375rem] leading-relaxed text-ink-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}

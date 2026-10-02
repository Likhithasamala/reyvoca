import { howItWorks } from "@/config/marketing";
import { Container } from "@/components/ui/container";
import { IconTile } from "@/components/ui/icon-tile";
import { SectionHeading } from "@/components/ui/section-heading";

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-it-works-heading" className="py-24 lg:py-32">
      <Container>
        <SectionHeading
          id="how-it-works-heading"
          eyebrow={howItWorks.eyebrow}
          title={howItWorks.title}
          description={howItWorks.description}
        />

        <ol className="relative mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:mt-20 lg:grid-cols-4 lg:gap-0">
          {/* Horizontal connector (desktop) */}
          <span
            aria-hidden="true"
            className="absolute top-7 right-[12.5%] left-[12.5%] hidden h-px bg-linear-to-r from-brand-soft via-brand/40 to-brand-soft lg:block"
          />
          {howItWorks.steps.map((step, index) => (
            <li key={step.title} className="reveal relative flex gap-5 md:flex-col md:gap-0 lg:px-4 lg:text-center">
              {/* Vertical connector (mobile) */}
              {index < howItWorks.steps.length - 1 && (
                <span aria-hidden="true" className="absolute top-14 bottom-[-1.5rem] left-[27px] w-px bg-brand-soft md:hidden" />
              )}
              <div className="relative flex shrink-0 flex-col items-center lg:mx-auto">
                <span className="relative flex size-14 items-center justify-center rounded-2xl border border-line bg-white shadow-card">
                  <IconTile icon={step.icon} className="size-10 border-0" />
                </span>
              </div>
              <div className="pb-2 md:mt-6">
                <p className="font-mono text-xs font-semibold tracking-widest text-brand">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-ink">{step.title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-muted lg:mx-auto lg:max-w-[240px]">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

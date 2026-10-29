import { ArrowRight } from "lucide-react";
import { finalCta } from "@/config/marketing";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Waveform } from "@/components/ui/waveform";

export function FinalCta() {
  return (
    <section aria-labelledby="final-cta-heading" className="py-24 lg:py-28">
      <Container>
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-night px-6 py-16 text-center sm:px-12 lg:py-24">
          <div
            aria-hidden="true"
            className="night-glow absolute inset-0 -z-10"
          />
          <Waveform bars={7} active={false} className="h-8 text-accent-glow" />
          <h2 id="final-cta-heading" className="mx-auto mt-6 max-w-2xl text-h2 font-semibold text-white text-balance">
            {finalCta.title}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lead text-night-text text-pretty">{finalCta.description}</p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href={finalCta.primaryCta.href} variant="inverse" size="lg">
              {finalCta.primaryCta.label}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink
              href={finalCta.secondaryCta.href}
              variant="inverse-outline"
              size="lg"
            >
              {finalCta.secondaryCta.label}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}

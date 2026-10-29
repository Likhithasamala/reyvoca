import { ArrowRight, Check } from "lucide-react";
import { hero } from "@/config/marketing";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ProductDemo } from "./product-demo";

export function Hero() {
  const { heading } = hero;

  return (
    <section aria-labelledby="hero-heading" className="relative isolate overflow-hidden">
      <div aria-hidden="true" className="hero-backdrop absolute inset-0 -z-10" />
      <div aria-hidden="true" className="grid-lines absolute inset-0 -z-10" />

      <Container className="grid grid-cols-1 items-center gap-14 pt-12 pb-20 sm:pt-16 lg:grid-cols-[1.08fr_1fr] lg:gap-12 lg:pt-20 lg:pb-28 xl:gap-16">
        <div className="max-w-2xl">
          <Eyebrow>{hero.eyebrow}</Eyebrow>

          <h1 id="hero-heading" className="mt-6 text-display font-semibold text-ink text-balance">
            {heading.before} <span className="text-accent">{heading.highlight}</span>
            {heading.after && <> {heading.after}</>}
          </h1>

          <p className="mt-6 max-w-xl text-lead text-ink-muted text-pretty">{hero.subtitle}</p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={hero.primaryCta.href} size="lg">
              {hero.primaryCta.label}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href={hero.secondaryCta.href} size="lg" variant="secondary">
              {hero.secondaryCta.label}
            </ButtonLink>
          </div>

          <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-3">
            {hero.valuePoints.map((point) => (
              <li key={point} className="flex items-center gap-2 text-[0.9375rem] text-ink-muted">
                <span className="flex size-5 items-center justify-center rounded-full border border-line-strong bg-surface text-ink">
                  <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <ProductDemo />
      </Container>
    </section>
  );
}

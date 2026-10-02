import { whyReyvoca } from "@/config/marketing";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { FeatureCard } from "./feature-card";

export function WhyReyvoca() {
  return (
    <section id="why-reyvoca" aria-labelledby="why-reyvoca-heading" className="bg-surface-muted py-24 lg:py-32">
      <Container>
        <SectionHeading
          id="why-reyvoca-heading"
          eyebrow={whyReyvoca.eyebrow}
          title={whyReyvoca.title}
          description={whyReyvoca.description}
        />
        <ul className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4 lg:gap-5">
          {whyReyvoca.features.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </ul>
      </Container>
    </section>
  );
}

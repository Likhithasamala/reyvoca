import { pricing } from "@/config/marketing";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { PricingCard } from "./pricing-card";

export function Pricing() {
  return (
    <section id="pricing" aria-labelledby="pricing-heading" className="py-24 lg:py-32">
      <Container>
        <SectionHeading
          id="pricing-heading"
          eyebrow={pricing.eyebrow}
          title={pricing.title}
          description={pricing.description}
        />
        <ul className="mx-auto mt-16 grid max-w-md grid-cols-1 gap-6 lg:mt-20 lg:max-w-none lg:grid-cols-3">
          {pricing.tiers.map((tier) => (
            <PricingCard key={tier.name} tier={tier} />
          ))}
        </ul>
      </Container>
    </section>
  );
}

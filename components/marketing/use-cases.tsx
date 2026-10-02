import { useCases } from "@/config/marketing";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { UseCaseCard } from "./use-case-card";

export function UseCases() {
  return (
    <section id="use-cases" aria-labelledby="use-cases-heading" className="py-24 lg:py-32">
      <Container>
        <SectionHeading
          id="use-cases-heading"
          eyebrow={useCases.eyebrow}
          title={useCases.title}
          description={useCases.description}
        />
        <ul className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4 lg:gap-5">
          {useCases.items.map((useCase) => (
            <UseCaseCard key={useCase.title} useCase={useCase} />
          ))}
        </ul>
      </Container>
    </section>
  );
}

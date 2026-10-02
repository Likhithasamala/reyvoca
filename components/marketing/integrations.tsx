import { integrations } from "@/config/marketing";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

export function Integrations() {
  return (
    <section id="integrations" aria-labelledby="integrations-heading" className="bg-surface-muted py-24 lg:py-32">
      <Container>
        <SectionHeading
          id="integrations-heading"
          eyebrow={integrations.eyebrow}
          title={integrations.title}
          description={integrations.description}
        />
        <ul className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4 lg:gap-5">
          {integrations.groups.map((group) => (
            <li key={group.category} className="reveal rounded-2xl border border-line bg-white p-6">
              <h3 className="text-lg font-semibold tracking-tight text-ink">{group.category}</h3>
              <p className="mt-1 text-sm text-ink-subtle">{group.description}</p>
              <ul className="mt-5 flex flex-wrap gap-2" aria-label={`${group.category} providers`}>
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-lg border border-line bg-surface-muted px-3 py-1.5 text-sm font-medium text-ink"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-center text-sm text-ink-subtle">
          Product names are trademarks of their respective owners and are listed to indicate planned compatibility.
        </p>
      </Container>
    </section>
  );
}

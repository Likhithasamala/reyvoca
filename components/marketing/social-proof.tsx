import { socialProof } from "@/config/marketing";
import { Container } from "@/components/ui/container";

export function SocialProof() {
  return (
    <section aria-label="Industries" className="border-y border-line bg-surface-muted">
      <Container className="flex flex-col items-center gap-6 py-10 lg:flex-row lg:justify-between lg:gap-10">
        <p className="shrink-0 text-center text-sm font-medium text-ink-muted lg:text-left">{socialProof.statement}</p>
        <ul className="flex flex-wrap justify-center gap-x-8 gap-y-4 lg:justify-end">
          {socialProof.industries.map(({ label, icon: Icon }) => (
            <li key={label} className="flex items-center gap-2 text-[0.9375rem] font-semibold text-ink-muted">
              <Icon className="size-[18px] text-ink-subtle" strokeWidth={1.75} aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

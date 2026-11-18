import Link from "next/link";
import { finalCta } from "@/config/marketing";
import { Container } from "@/components/ui/container";

/**
 * The designed close: the invitation set large, the action ending the
 * sentence as a real button sized in em so it scales with the type.
 */
export function FinalCta() {
  return (
    <section aria-labelledby="cta-heading" className="bg-surface pt-28 pb-10 lg:pt-36">
      <Container>
        <h2
          id="cta-heading"
          className="text-[clamp(2rem,6vw,5.5rem)] leading-[1.05] font-semibold tracking-tight text-ink"
        >
          <span className="block">{finalCta.line1}</span>
          <span className="block">{finalCta.line2}</span>
        </h2>
        <div className="mt-10 flex flex-wrap items-center gap-6">
          <Link
            href={finalCta.cta.href}
            className="inline-block rounded-full bg-brand px-10 py-4 text-xl leading-none font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            {finalCta.cta.label}
          </Link>
          <p className="max-w-[40ch] text-base text-ink-muted">{finalCta.note}</p>
        </div>
      </Container>
    </section>
  );
}

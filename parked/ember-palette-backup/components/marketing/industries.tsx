import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { industriesSection } from "@/config/marketing";
import { industries } from "@/config/industries";
import { Container } from "@/components/ui/container";

/**
 * The industries the agent is sold into, each linking to its own page.
 *
 * Deliberately only the trades Reyvoca actually works with. A grid of thirty
 * generated pages would rank for nothing and promise what we cannot show.
 */
export function Industries() {
  return (
    <section
      id={industriesSection.id}
      aria-labelledby="industries-heading"
      className="ember-ground [--ember-from:#3d1505] [--ember-to:#5e2006] py-28 lg:py-36"
    >
      <Container>
        <div className="max-w-[52ch]">
          <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-accent-strong uppercase">
            {industriesSection.eyebrow}
          </p>
          <h2 id="industries-heading" className="mt-5 text-h2 font-semibold text-ink text-balance">
            {industriesSection.heading}
          </h2>
          <p className="mt-4 text-lead text-ink-muted">{industriesSection.body}</p>
        </div>

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
          {industries.map((industry) => (
            <li key={industry.slug} className="min-w-0">
              <Link
                href={`/industries/${industry.slug}`}
                className="group flex h-full flex-col gap-2 rounded-2xl border border-line bg-canvas p-6 transition-colors hover:border-line-strong hover:bg-surface-muted/60"
              >
                <h3 className="flex items-center gap-2 text-[1.0625rem] font-semibold text-ink">
                  {industry.name}
                  <ArrowRight
                    className="size-4 shrink-0 text-ink-subtle transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </h3>
                <p className="text-sm leading-relaxed text-ink-muted">{industry.tagline}</p>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-sm text-ink-subtle">
          Not on the list?{" "}
          <Link href="/#book-demo" className="font-medium text-accent-strong underline underline-offset-4">
            Tell us what your calls sound like
          </Link>{" "}
          and we will build the agent on the demo.
        </p>
      </Container>
    </section>
  );
}

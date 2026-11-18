import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { industries } from "@/config/industries";
import { callLanguages } from "@/config/languages";
import { Navbar } from "@/components/layout/navbar";
import { BookDemo } from "@/components/marketing/book-demo";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { routes } from "@/config/site";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "AI voice agents by industry",
  description:
    "How a Reyvoca voice agent handles calls for clinics, real estate, education, dealerships, insurance and retail — in 11 Indian languages.",
  path: "/industries",
});

export default function IndustriesPage() {
  return (
    <>
      <Navbar />
      <section className="bg-canvas pt-16 pb-24 lg:pt-20 lg:pb-32">
        <Container>
          <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-accent-strong uppercase">Industries</p>
          <h1 className="mt-5 max-w-[18ch] text-h2 font-semibold text-ink text-balance">
            Same agent. Every conversation you have.
          </h1>
          <p className="mt-5 max-w-[58ch] text-lead text-ink-muted">
            A clinic and a dealership ask completely different questions. The platform underneath is the same one — you
            write what the agent knows and how it should behave, and it holds that conversation in any of{" "}
            {callLanguages.length} languages.
          </p>

          <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:mt-16">
            {industries.map((industry) => (
              <li key={industry.slug} className="min-w-0">
                <Link
                  href={`/industries/${industry.slug}`}
                  className="group flex h-full flex-col gap-2.5 rounded-2xl border border-line bg-surface p-7 transition-colors hover:border-line-strong hover:bg-surface-muted/60"
                >
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-ink">
                    {industry.name}
                    <ArrowRight
                      className="size-4 shrink-0 text-ink-subtle transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </h2>
                  <p className="text-[0.9375rem] leading-relaxed text-ink-muted">{industry.tagline}</p>
                  <p className="mt-auto pt-3 text-xs text-ink-subtle">
                    Usually opens in {industry.languages.slice(0, 3).join(", ")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-14 rounded-2xl border border-line bg-surface p-7 lg:p-9">
            <h2 className="text-xl font-semibold text-ink text-balance">Your trade is not on this list</h2>
            <p className="mt-3 max-w-[60ch] text-[0.9375rem] leading-relaxed text-ink-muted">
              These are the industries we have written real agents for. The platform is not limited to them — if your
              business runs on phone calls, bring us the five questions your customers always ask and we will build the
              agent during the demo.
            </p>
            <ButtonLink href={routes.bookDemo} size="sm" className="mt-6">
              Book a demo
            </ButtonLink>
          </div>
        </Container>
      </section>
      <BookDemo />
    </>
  );
}

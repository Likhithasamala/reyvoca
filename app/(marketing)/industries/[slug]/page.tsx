import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getIndustry, industries } from "@/config/industries";
import { Navbar } from "@/components/layout/navbar";
import { BookDemo } from "@/components/marketing/book-demo";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { routes } from "@/config/site";
import { pageMetadata } from "@/lib/metadata";

/** Only the industries defined in config exist; anything else is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return industries.map((industry) => ({ slug: industry.slug }));
}

export async function generateMetadata({ params }: PageProps<"/industries/[slug]">): Promise<Metadata> {
  const industry = getIndustry((await params).slug);
  if (!industry) return {};
  return pageMetadata({
    title: `AI voice agent for ${industry.name.toLowerCase()}`,
    description: industry.tagline,
    path: `/industries/${industry.slug}`,
  });
}

export default async function IndustryPage({ params }: PageProps<"/industries/[slug]">) {
  const industry = getIndustry((await params).slug);
  if (!industry) notFound();

  return (
    <>
      <Navbar />

      <section className="bg-canvas pt-16 pb-24 lg:pt-20 lg:pb-28">
        <Container>
          <Link
            href="/industries"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            All industries
          </Link>

          <p className="mt-10 text-[0.6875rem] font-semibold tracking-[0.16em] text-accent-strong uppercase">
            {industry.name}
          </p>
          <h1 className="mt-5 max-w-[20ch] text-h2 font-semibold text-ink text-balance">{industry.headline}</h1>
          <p className="mt-6 max-w-[62ch] text-lead text-ink-muted">{industry.intro}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink href={routes.bookDemo} size="sm">
              Book a demo
            </ButtonLink>
            <p className="text-sm text-ink-subtle">
              Opens in {industry.languages.join(", ")} — and switches mid-call.
            </p>
          </div>
        </Container>
      </section>

      <section aria-labelledby="problems-heading" className="bg-surface py-20 lg:py-24">
        <Container>
          <h2 id="problems-heading" className="max-w-[24ch] text-h3 font-semibold text-ink text-balance">
            What this looks like today
          </h2>
          <ul className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
            {industry.problems.map((problem) => (
              <li key={problem} className="min-w-0 bg-canvas p-6">
                <p className="text-[0.9375rem] leading-relaxed text-ink-muted">{problem}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section aria-labelledby="handles-heading" className="bg-canvas py-20 lg:py-24">
        <Container>
          <h2 id="handles-heading" className="max-w-[24ch] text-h3 font-semibold text-ink text-balance">
            What the agent does on the call
          </h2>
          <ol className="mt-10 grid gap-10 sm:grid-cols-2">
            {industry.handles.map((item, index) => (
              <li key={item.title} className="min-w-0 border-t border-line pt-5">
                <span className="font-mono text-sm font-semibold text-accent-strong tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 text-[1.0625rem] font-semibold text-ink text-balance">{item.title}</h3>
                <p className="mt-2 max-w-[48ch] text-[0.9375rem] leading-relaxed text-ink-muted">{item.detail}</p>
              </li>
            ))}
          </ol>

          <p className="mt-14 max-w-[58ch] text-lead text-ink">{industry.close}</p>
          <ButtonLink href={routes.bookDemo} size="sm" className="mt-6">
            Book a demo
          </ButtonLink>
        </Container>
      </section>

      <BookDemo />
    </>
  );
}

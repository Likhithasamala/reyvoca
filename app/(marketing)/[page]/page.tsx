import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import { notFound } from "next/navigation";
import { getInfoPage, infoPages } from "@/config/info-pages";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

/** Only the pages defined in config exist; anything else is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return infoPages.map((page) => ({ page: page.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[page]">): Promise<Metadata> {
  const page = getInfoPage((await params).page);
  if (!page) return {};
  return pageMetadata({ title: page.title, description: page.description, path: `/${page.slug}` });
}

export default async function InfoPage({ params }: PageProps<"/[page]">) {
  const page = getInfoPage((await params).page);
  if (!page) notFound();

  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden="true" className="hero-backdrop absolute inset-0 -z-10" />
      <Container className="max-w-3xl py-20 lg:py-28">
        <h1 className="text-h2 font-semibold text-ink text-balance">{page.title}</h1>
        <p className="mt-4 text-lead text-ink-muted">{page.description}</p>
        <div className="mt-10 space-y-5 border-t border-line pt-10 text-[1.0625rem] leading-relaxed text-ink-muted">
          {page.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <ButtonLink href="/" variant="secondary" className="mt-12">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to home
        </ButtonLink>
      </Container>
    </section>
  );
}

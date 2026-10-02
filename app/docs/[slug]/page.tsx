import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { docHref, docPages, getDocPage } from "@/config/docs";
import { DocContent } from "@/components/docs/doc-content";
import { DocPager } from "@/components/docs/doc-pager";
import { pageMetadata } from "@/lib/metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return docPages.filter((page) => page.slug).map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: PageProps<"/docs/[slug]">): Promise<Metadata> {
  const page = getDocPage((await params).slug);
  if (!page) return {};
  return pageMetadata({ title: `${page.title} — Docs`, description: page.description, path: docHref(page.slug) });
}

export default async function DocPage({ params }: PageProps<"/docs/[slug]">) {
  const page = getDocPage((await params).slug);
  if (!page) notFound();
  return (
    <>
      <DocContent page={page} />
      <DocPager slug={page.slug} />
    </>
  );
}

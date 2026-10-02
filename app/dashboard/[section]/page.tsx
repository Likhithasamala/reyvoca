import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { dashboardNav } from "@/config/dashboard";

export const dynamicParams = false;

const sections = dashboardNav.filter((item) => item.slug);
const getSection = (slug: string) => sections.find((item) => item.slug === slug);

export function generateStaticParams() {
  return sections.map((item) => ({ section: item.slug }));
}

export async function generateMetadata({ params }: PageProps<"/dashboard/[section]">): Promise<Metadata> {
  const section = getSection((await params).section);
  return section ? { title: section.label } : {};
}

/** Placeholder for dashboard areas that will be built in later phases. */
export default async function DashboardSectionPage({ params }: PageProps<"/dashboard/[section]">) {
  const section = getSection((await params).section);
  if (!section) notFound();
  const { icon: Icon } = section;

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{section.label}</h1>
      <p className="mt-1 text-sm text-ink-muted">{section.description}</p>

      <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-line-strong bg-white px-6 py-20 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-softer text-brand">
          <Icon className="size-6" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-lg font-semibold text-ink">{section.label} is coming in a later phase</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
          This area of the Reyvoca workspace hasn&apos;t been built yet. The navigation is in place so the platform can grow
          into it.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-hover"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Back to overview
        </Link>
      </div>
    </div>
  );
}

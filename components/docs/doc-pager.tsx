import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { docHref, docNavLabel, docPages } from "@/config/docs";

const cardClass =
  "group rounded-xl border border-line p-4 transition-colors hover:border-brand-soft hover:bg-brand-softer";

/** Previous / next links at the bottom of each docs page. */
export function DocPager({ slug }: { slug: string }) {
  const index = docPages.findIndex((page) => page.slug === slug);
  const previous = docPages[index - 1];
  const next = docPages[index + 1];

  return (
    <nav aria-label="Docs pagination" className="mt-16 grid grid-cols-1 gap-4 border-t border-line pt-8 sm:grid-cols-2">
      {previous ? (
        <Link href={docHref(previous.slug)} className={cardClass}>
          <span className="flex items-center gap-1.5 text-xs text-ink-subtle">
            <ArrowLeft className="size-3.5" aria-hidden="true" /> Previous
          </span>
          <span className="mt-1 block font-medium text-ink group-hover:text-brand">{docNavLabel(previous)}</span>
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
      {next && (
        <Link href={docHref(next.slug)} className={`${cardClass} text-right`}>
          <span className="flex items-center justify-end gap-1.5 text-xs text-ink-subtle">
            Next <ArrowRight className="size-3.5" aria-hidden="true" />
          </span>
          <span className="mt-1 block font-medium text-ink group-hover:text-brand">{docNavLabel(next)}</span>
        </Link>
      )}
    </nav>
  );
}

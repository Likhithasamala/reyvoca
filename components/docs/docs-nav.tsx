"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { docHref, docNavLabel, docPages } from "@/config/docs";
import { cn } from "@/lib/cn";

function NavList() {
  const pathname = usePathname();
  return (
    <ul className="space-y-0.5">
      {docPages.map((page) => {
        const href = docHref(page.slug);
        const active = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "block rounded-lg px-3 py-2 text-[0.9375rem] transition-colors",
                active ? "bg-surface-muted font-medium text-ink shadow-[inset_2px_0_0_var(--color-accent)]" : "text-ink-muted hover:bg-surface-muted hover:text-ink",
              )}
            >
              {docNavLabel(page)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function DocsSidebar() {
  return (
    <nav aria-label="Documentation" className="sticky top-24 hidden max-h-[calc(100dvh-7rem)] self-start overflow-y-auto lg:block">
      <p className="px-3 pb-3 text-xs font-semibold tracking-[0.08em] text-ink-subtle uppercase">Documentation</p>
      <NavList />
    </nav>
  );
}

/** Collapsible docs navigation for small screens. Re-keyed per page so it closes after navigating. */
export function DocsMobileNav() {
  const pathname = usePathname();
  const current = docPages.find((page) => docHref(page.slug) === pathname);
  return (
    <details key={pathname} className="group rounded-xl border border-line bg-surface lg:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
        <span>
          <span className="text-ink-subtle">Docs / </span>
          {current ? docNavLabel(current) : "Menu"}
        </span>
        <ChevronDown className="size-4 text-ink-subtle transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <nav aria-label="Documentation (mobile)" className="border-t border-line p-2">
        <NavList />
      </nav>
    </details>
  );
}

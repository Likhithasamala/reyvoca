"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/logo";
import { activeAdminHref, adminNavItems } from "@/config/admin-nav";
import { cn } from "@/lib/cn";

/**
 * Operator panel frame.
 *
 * Same framed-sheet language as the rest of the product so it feels like
 * Reyvoca, with one deliberate difference: a standing "Operator" marker, so
 * it is never ambiguous which side of the product you are looking at.
 */
export function AdminShell({
  children,
  operator,
}: {
  children: ReactNode;
  /** Email of the signed-in operator, or null on an open development machine. */
  operator: string | null;
}) {
  const pathname = usePathname();
  const active = activeAdminHref(pathname);

  return (
    <div className="min-h-dvh bg-surface-muted lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col py-4 lg:flex">
        <div className="px-5">
          <Logo href="/admin" className="min-w-0" />
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-night px-2.5 py-1 text-[0.6875rem] font-medium text-white">
            <ShieldCheck className="size-3" aria-hidden="true" /> Operator
          </p>
        </div>

        <nav aria-label="Operator panel" className="mt-6 flex-1 px-3">
          <ul className="space-y-0.5">
            {adminNavItems.map(({ label, href, icon: Icon }) => {
              const current = active === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[0.8125rem] transition-colors",
                      current
                        ? "bg-line/70 font-medium text-ink"
                        : "text-ink-muted hover:bg-line/40 hover:text-ink",
                    )}
                  >
                    <Icon
                      className={cn("size-[17px] shrink-0", current ? "text-ink" : "text-ink-subtle")}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    <span className="truncate">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="px-3 pt-2">
          <p className="px-2.5 pb-2 text-[0.6875rem] leading-relaxed break-words text-ink-subtle">
            {operator ?? "Local development — no operator account signed in."}
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Mobile header: the rail collapses to one scrollable row. */}
        <header className="flex flex-col gap-3 px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <Logo href="/admin" className="min-w-0" />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-night px-2.5 py-1 text-[0.6875rem] font-medium text-white">
              <ShieldCheck className="size-3" aria-hidden="true" /> Operator
            </span>
          </div>
          <nav aria-label="Operator panel" className="-mx-1 flex gap-1 overflow-x-auto px-1">
            {adminNavItems.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={active === href ? "page" : undefined}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.8125rem] transition-colors",
                  active === href ? "bg-line/70 font-medium text-ink" : "text-ink-muted hover:bg-line/40",
                )}
              >
                <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" /> {label}
              </Link>
            ))}
          </nav>
        </header>

        <div className="flex min-w-0 flex-1 flex-col bg-surface lg:mt-2 lg:mr-2 lg:mb-2 lg:rounded-2xl lg:border lg:border-line">
          <main id="main" className="flex-1 px-4 py-6 sm:px-6 sm:py-7">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

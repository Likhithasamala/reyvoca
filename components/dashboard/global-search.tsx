"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useRef, useState } from "react";
import { dashboardNavItems } from "@/config/dashboard-nav";
import { cn } from "@/lib/cn";

/**
 * Jumps to a dashboard destination by name.
 *
 * Scoped to navigation on purpose: searching agents, calls and leads needs the
 * data layer, so this does not pretend to search records it cannot reach.
 */
export function GlobalSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const needle = query.trim().toLowerCase();
  const matches = needle
    ? dashboardNavItems.filter((item) => item.label.toLowerCase().includes(needle)).slice(0, 6)
    : [];

  function go(href: string) {
    setQuery("");
    setOpen(false);
    router.push(href);
  }

  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-subtle"
        aria-hidden="true"
      />
      <input
        type="search"
        value={query}
        role="combobox"
        aria-expanded={open && matches.length > 0}
        aria-controls="global-search-results"
        aria-label="Search dashboard sections"
        placeholder="Search agents, calls, leads…"
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        // Delayed so a click on a result lands before the list unmounts.
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && matches[0]) go(matches[0].href);
          if (event.key === "Escape") setOpen(false);
        }}
        className="h-9 w-full rounded-lg border border-line bg-surface-muted pr-3 pl-9 text-sm text-ink placeholder:text-ink-subtle transition-colors hover:border-line-strong focus:border-ink focus:bg-surface focus:ring-4 focus:ring-surface-muted focus:outline-none"
      />

      {open && needle.length > 0 && (
        <div
          id="global-search-results"
          className="absolute top-full left-0 z-40 mt-1.5 w-full overflow-hidden rounded-xl border border-line bg-surface p-1.5 shadow-lift"
        >
          {matches.length > 0 ? (
            <ul>
              {matches.map(({ label, href, icon: Icon }) => (
                <li key={href}>
                  <button
                    type="button"
                    onMouseDown={() => {
                      clearTimeout(blurTimer.current);
                      go(href);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
                  >
                    <Icon className="size-4 shrink-0 text-ink-subtle" strokeWidth={1.75} aria-hidden="true" />
                    <span className="truncate">{label}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-2.5 py-2 text-xs text-ink-subtle">
              No section matches “{query.trim()}”. Searching calls and leads needs the data layer.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

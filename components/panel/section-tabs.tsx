"use client";

import { cn } from "@/lib/cn";

/**
 * Tabs *inside* a page — agent detail, settings. These are intentionally not
 * sidebar entries: the global navigation stays fixed at thirteen items.
 */
export function SectionTabs({
  tabs,
  active,
  onChange,
  label,
}: {
  tabs: readonly string[];
  active: string;
  onChange: (tab: string) => void;
  label: string;
}) {
  return (
    <div className="-mx-1 overflow-x-auto">
      <div role="tablist" aria-label={label} className="flex min-w-max gap-1 border-b border-line px-1">
        {tabs.map((tab) => {
          const selected = tab === active;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(tab)}
              className={cn(
                "-mb-px border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                selected
                  ? "border-accent text-ink"
                  : "border-transparent text-ink-muted hover:border-line-strong hover:text-ink",
              )}
            >
              {tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}

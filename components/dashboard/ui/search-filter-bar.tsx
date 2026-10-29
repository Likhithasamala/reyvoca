"use client";

import { Search } from "lucide-react";
import { useId } from "react";
import { cn } from "@/lib/cn";

export type FilterConfig = {
  /** Stable key used as the filter's identity in page state. */
  key: string;
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
};

/**
 * Search box plus dropdown filters. Filtering runs on the client over the
 * rows already on the page — no request, so it works without a backend.
 */
export function SearchFilterBar({
  search,
  onSearchChange,
  placeholder = "Search…",
  filters = [],
  className,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  filters?: FilterConfig[];
  className?: string;
}) {
  const searchId = useId();
  return (
    <div className={cn("flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center", className)}>
      <div className="relative min-w-0 flex-1 sm:max-w-xs">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-subtle"
          aria-hidden="true"
        />
        <input
          id={searchId}
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-9 w-full rounded-lg border border-line-strong bg-surface pr-3 pl-9 text-sm text-ink placeholder:text-ink-subtle transition-colors hover:border-ink-subtle focus:border-ink focus:ring-4 focus:ring-surface-muted focus:outline-none"
        />
      </div>

      {filters.map((filter) => (
        <label key={filter.key} className="flex items-center gap-2 text-xs text-ink-subtle">
          <span className="sr-only sm:not-sr-only">{filter.label}</span>
          <select
            value={filter.value}
            onChange={(event) => filter.onChange(event.target.value)}
            aria-label={filter.label}
            className="h-9 rounded-lg border border-line-strong bg-surface px-2.5 pr-7 text-sm text-ink transition-colors hover:border-ink-subtle focus:border-ink focus:ring-4 focus:ring-surface-muted focus:outline-none"
          >
            {filter.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}

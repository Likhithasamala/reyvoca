import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Column<T> = {
  /** Stable key for React and for the column's identity. */
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** Hide on narrow screens so the table never forces page overflow. */
  hideBelow?: "sm" | "md" | "lg";
  align?: "left" | "right";
  /** Renders as a row header cell — use for the row's identifying column. */
  rowHeader?: boolean;
};

const hideClass = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
} as const;

/**
 * Table shell shared by every list in the dashboard. Scrolling is contained
 * inside the card, so wide tables never push the page sideways.
 */
export function DataTable<T extends { id: string }>({
  caption,
  columns,
  rows,
  footer,
  bare = false,
}: {
  caption: string;
  columns: Column<T>[];
  rows: T[];
  footer?: ReactNode;
  /** Drops the card chrome when the table already sits inside a SectionCard. */
  bare?: boolean;
}) {
  return (
    <div className={cn("overflow-hidden", !bare && "rounded-xl border border-line bg-surface")}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="border-b border-line bg-surface-muted text-ink-subtle">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    "px-4 py-2.5 text-xs font-medium whitespace-nowrap",
                    column.align === "right" && "text-right",
                    column.hideBelow && hideClass[column.hideBelow],
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-surface-muted/60">
                {columns.map((column) => {
                  const classes = cn(
                    "px-4 py-3 align-middle",
                    column.align === "right" && "text-right",
                    column.hideBelow && hideClass[column.hideBelow],
                    column.rowHeader ? "font-medium text-ink" : "text-ink-muted",
                  );
                  return column.rowHeader ? (
                    <th key={column.key} scope="row" className={classes}>
                      {column.render(row)}
                    </th>
                  ) : (
                    <td key={column.key} className={classes}>
                      {column.render(row)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer && <div className="border-t border-line bg-surface-muted px-4 py-2.5 text-xs text-ink-subtle">{footer}</div>}
    </div>
  );
}

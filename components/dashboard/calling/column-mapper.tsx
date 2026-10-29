"use client";

import { ArrowRight, CircleAlert } from "lucide-react";
import { CONTACT_FIELDS, CONTACT_FIELD_LABELS, type ContactField } from "@/lib/calling/csv";
import { StatusBadge } from "@/components/dashboard/ui/status-badge";

const UNMAPPED = "— Keep as metadata —";

/**
 * Maps the uploaded file's headers onto Reyvoca fields.
 *
 * A column left unmapped is not discarded: it is preserved on the contact as
 * metadata, so nothing the customer uploaded is silently lost.
 */
export function ColumnMapper({
  headers,
  mapping,
  sampleRow,
  onChange,
}: {
  headers: string[];
  mapping: Record<string, ContactField | "">;
  /** First data row, shown as an example value per column. */
  sampleRow?: string[];
  onChange: (mapping: Record<string, ContactField | "">) => void;
}) {
  const phoneMapped = Object.values(mapping).includes("phone");

  function assign(header: string, value: string) {
    const field = value === UNMAPPED ? "" : (value as ContactField);
    const next: Record<string, ContactField | ""> = { ...mapping };
    // A Reyvoca field can only come from one column.
    if (field) {
      for (const key of Object.keys(next)) {
        if (next[key] === field) next[key] = "";
      }
    }
    next[header] = field;
    onChange(next);
  }

  return (
    <div className="space-y-4">
      {!phoneMapped && (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-warning-line bg-warning-soft px-3.5 py-2.5 text-xs leading-relaxed text-warning"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Map a column to <span className="font-semibold">Phone</span>. Without a phone number no contact can be called.
        </p>
      )}

      <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
        {headers.map((header, index) => {
          const selectId = `map-${index}`;
          const sample = sampleRow?.[index]?.trim();
          return (
            <li key={header} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-3">
              <div className="min-w-0 sm:flex-1">
                <p className="truncate text-sm font-medium text-ink">{header || `Column ${index + 1}`}</p>
                {sample && <p className="mt-0.5 truncate text-xs text-ink-subtle">e.g. {sample}</p>}
              </div>

              <ArrowRight
                className="hidden size-4 shrink-0 text-ink-subtle sm:block"
                strokeWidth={1.75}
                aria-hidden="true"
              />

              <div className="sm:w-56">
                <label htmlFor={selectId} className="sr-only">
                  Reyvoca field for {header}
                </label>
                <select
                  id={selectId}
                  value={mapping[header] || UNMAPPED}
                  onChange={(event) => assign(header, event.target.value)}
                  className="h-9 w-full rounded-lg border border-line-strong bg-surface px-2.5 text-sm text-ink transition-colors hover:border-ink-subtle focus:border-ink focus:ring-4 focus:ring-surface-muted focus:outline-none"
                >
                  <option value={UNMAPPED}>{UNMAPPED}</option>
                  {CONTACT_FIELDS.map((field) => (
                    <option key={field} value={field}>
                      {CONTACT_FIELD_LABELS[field]}
                      {field === "phone" ? " (required)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-subtle">
        <StatusBadge status="Phone is required" tone={phoneMapped ? "positive" : "attention"} />
        <span>Unmapped columns are kept on each contact as metadata.</span>
      </div>
    </div>
  );
}

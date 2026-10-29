"use client";

import { Undo2, X } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/ui/status-badge";
import type { CampaignContact } from "@/types/calling";

/**
 * First rows of the uploaded list, so the mapping can be checked against real
 * values before anything is launched. Rows can be excluded here; invalid rows
 * are already blocked and show the reason instead of an exclude control.
 */
export function ContactPreviewTable({
  contacts,
  limit = 8,
  onToggleExclude,
}: {
  contacts: CampaignContact[];
  limit?: number;
  onToggleExclude?: (id: string) => void;
}) {
  const rows = contacts.slice(0, limit);

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Preview of uploaded contacts</caption>
          <thead className="border-b border-line bg-surface-muted text-ink-subtle">
            <tr>
              <th scope="col" className="px-4 py-2.5 text-xs font-medium whitespace-nowrap">Name</th>
              <th scope="col" className="px-4 py-2.5 text-xs font-medium whitespace-nowrap">Phone</th>
              <th scope="col" className="hidden px-4 py-2.5 text-xs font-medium whitespace-nowrap md:table-cell">Email</th>
              <th scope="col" className="hidden px-4 py-2.5 text-xs font-medium whitespace-nowrap lg:table-cell">Requirement</th>
              <th scope="col" className="px-4 py-2.5 text-xs font-medium whitespace-nowrap">Status</th>
              {onToggleExclude && <th scope="col" className="px-4 py-2.5 text-xs font-medium"><span className="sr-only">Actions</span></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((contact) => {
              const blocked = Boolean(contact.invalidReason);
              return (
                <tr key={contact.id} className={contact.excluded ? "opacity-50" : undefined}>
                  <th scope="row" className="px-4 py-3 font-medium text-ink">
                    {contact.name ?? "—"}
                  </th>
                  <td className="px-4 py-3 font-mono text-xs text-ink-muted tabular-nums">
                    {contact.phone || "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-ink-muted md:table-cell">{contact.email ?? "—"}</td>
                  <td className="hidden max-w-48 truncate px-4 py-3 text-ink-muted lg:table-cell">
                    {contact.requirement ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {blocked ? (
                      <StatusBadge status={contact.invalidReason!} tone="attention" />
                    ) : contact.excluded ? (
                      <StatusBadge status="Excluded" tone="neutral" />
                    ) : (
                      <StatusBadge status="Will be called" tone="positive" />
                    )}
                  </td>
                  {onToggleExclude && (
                    <td className="px-4 py-3 text-right">
                      {!blocked && (
                        <button
                          type="button"
                          onClick={() => onToggleExclude(contact.id)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
                        >
                          {contact.excluded ? (
                            <>
                              <Undo2 className="size-3.5" aria-hidden="true" /> Include
                            </>
                          ) : (
                            <>
                              <X className="size-3.5" aria-hidden="true" /> Exclude
                            </>
                          )}
                          <span className="sr-only">{contact.name ?? contact.phone}</span>
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {contacts.length > rows.length && (
        <p className="border-t border-line bg-surface-muted px-4 py-2.5 text-xs text-ink-subtle">
          Showing {rows.length} of {contacts.length} contacts.
        </p>
      )}
    </div>
  );
}

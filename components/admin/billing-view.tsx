"use client";

import { Clock, Coins, IndianRupee, Inbox, Percent, Plus, Server, Wallet, X } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Action } from "@/components/panel/action";
import { DataTable, type Column } from "@/components/panel/data-table";
import { MetricCard } from "@/components/panel/metric-card";
import { PageHeader } from "@/components/panel/page-header";
import { TextField } from "@/components/panel/field";
import { formatCredits, formatCreditsShort, formatRupees, parseRupeesToPaise } from "@/lib/billing/format";
import { apiFetch } from "@/lib/calling/remote-store";
import { cn } from "@/lib/cn";

type Pricing = {
  sarvamPerMinutePaise: number;
  marginPerMinutePaise: number;
  updatedAt: string;
  updatedBy?: string;
};

type WorkspaceRow = {
  workspaceId: string;
  name: string;
  email: string | null;
  balancePaise: number;
  minutes: number;
  revenuePaise: number;
  sarvamCostPaise: number;
};

type RequestRow = {
  id: string;
  workspaceId: string;
  workspaceName: string;
  email: string | null;
  amountPaise: number;
  createdAt: string;
};

type TopupRow = {
  id: string;
  workspaceId: string;
  type: string;
  amountPaise: number;
  note: string;
  createdBy?: string;
  createdAt: string;
};

type Billing = {
  pricing: Pricing;
  ratePaise: number;
  totals: { minutes: number; revenuePaise: number; sarvamCostPaise: number; marginPaise: number; creditsOutstandingPaise: number };
  workspaces: WorkspaceRow[];
  requests: RequestRow[];
  topups: TopupRow[];
};

/** What to credit, and optionally which customer request it fulfils. */
type CreditTarget = { workspaceId: string; name: string; amountPaise?: number; requestId?: string };

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/**
 * Operator billing: the one place Sarvam's rate and Reyvoca's margin are
 * visible. Customers see only the sum, as their per-minute price.
 */
export function AdminBillingView() {
  const [billing, setBilling] = useState<Billing | null>(null);
  const [error, setError] = useState("");
  const [target, setTarget] = useState<CreditTarget | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{ billing: Billing }>("/admin/billing");
      setBilling(data.billing);
      setError("");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not load billing.");
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(() => void load(), 0);
    const timer = setInterval(() => void load(), 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [load]);

  async function dismiss(id: string) {
    try {
      await apiFetch(`/admin/billing/requests/${id}`, { method: "DELETE" });
    } finally {
      void load();
    }
  }

  if (!billing) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader title="Billing" description="Prices, margin and customer credits." />
        {error ? (
          <p role="alert" className="rounded-xl border border-danger-line bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </p>
        ) : (
          <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((key) => (
              <div key={key} className="h-28 animate-pulse rounded-xl border border-line bg-surface-muted" />
            ))}
          </div>
        )}
      </div>
    );
  }

  const { totals } = billing;
  const workspaceColumns: Column<WorkspaceRow>[] = [
    {
      key: "name",
      header: "Workspace",
      rowHeader: true,
      render: (row) => (
        <span className="flex flex-col">
          <span>{row.name}</span>
          {row.email && <span className="text-xs font-normal text-ink-subtle">{row.email}</span>}
        </span>
      ),
    },
    {
      key: "balance",
      header: "Balance",
      align: "right",
      render: (row) => (
        <span className={cn("tabular-nums font-medium", row.balancePaise < 0 ? "text-danger" : "text-ink")}>
          {formatCredits(row.balancePaise)}
        </span>
      ),
    },
    { key: "minutes", header: "Minutes", align: "right", hideBelow: "sm", render: (row) => <span className="tabular-nums">{row.minutes}</span> },
    {
      key: "revenue",
      header: "Revenue",
      align: "right",
      hideBelow: "md",
      render: (row) => <span className="tabular-nums">{formatRupees(row.revenuePaise)}</span>,
    },
    {
      key: "margin",
      header: "Margin",
      align: "right",
      hideBelow: "lg",
      render: (row) => <span className="tabular-nums">{formatRupees(row.revenuePaise - row.sarvamCostPaise)}</span>,
    },
    {
      key: "action",
      header: "",
      align: "right",
      render: (row) => (
        <Action
          size="sm"
          variant="secondary"
          onClick={() => setTarget({ workspaceId: row.workspaceId, name: row.name })}
        >
          <Plus className="size-3.5" aria-hidden="true" /> Credits
        </Action>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        title="Billing"
        description="Customers pay Sarvam's rate plus your margin per started minute, from prepaid credits. Only operators see this split."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard metric={{ label: "Revenue", value: formatRupees(totals.revenuePaise), icon: IndianRupee, note: `${totals.minutes} ${totals.minutes === 1 ? "minute" : "minutes"} billed` }} />
        <MetricCard metric={{ label: "Sarvam cost", value: formatRupees(totals.sarvamCostPaise), icon: Server, note: "Excludes GST" }} />
        <MetricCard metric={{ label: "Margin earned", value: formatRupees(totals.marginPaise), icon: Percent }} />
        <MetricCard
          metric={{
            label: "Credits held",
            value: formatCredits(totals.creditsOutstandingPaise),
            icon: Wallet,
            note: "Prepaid, not yet used",
          }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <PricingForm pricing={billing.pricing} onSaved={() => void load()} />

        <section className="rounded-xl border border-line bg-surface">
          <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-ink">Credit requests</h2>
              <p className="mt-0.5 text-xs text-ink-muted">Add the credits once the customer has paid.</p>
            </div>
            <Inbox className="size-4 text-ink-subtle" aria-hidden="true" />
          </header>
          {billing.requests.length ? (
            <ul className="divide-y divide-line">
              {billing.requests.map((request) => (
                <li key={request.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {request.workspaceName}{" "}
                      <span className="font-semibold tabular-nums">· ₹{formatCreditsShort(request.amountPaise)}</span>
                    </p>
                    <p className="truncate text-xs text-ink-subtle">
                      {request.email ?? "No email"} · {when(request.createdAt)}
                    </p>
                  </div>
                  <Action
                    size="sm"
                    variant="primary"
                    onClick={() =>
                      setTarget({
                        workspaceId: request.workspaceId,
                        name: request.workspaceName,
                        amountPaise: request.amountPaise,
                        requestId: request.id,
                      })
                    }
                  >
                    Add credits
                  </Action>
                  <Action size="sm" variant="ghost" onClick={() => void dismiss(request.id)} aria-label="Dismiss request">
                    <X className="size-3.5" aria-hidden="true" />
                  </Action>
                </li>
              ))}
            </ul>
          ) : (
            <p className="flex items-center gap-2 px-5 py-8 text-sm text-ink-muted">
              <Clock className="size-4 text-ink-subtle" aria-hidden="true" /> No requests waiting.
            </p>
          )}
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-ink">Workspaces</h2>
        <DataTable caption="Workspace wallets" columns={workspaceColumns} rows={billing.workspaces.map((row) => ({ ...row, id: row.workspaceId }))} />
      </section>

      {billing.topups.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-ink">Recent top-ups</h2>
          <DataTable
            caption="Recent manual credit changes"
            rows={billing.topups}
            columns={[
              {
                key: "workspace",
                header: "Workspace",
                rowHeader: true,
                render: (row) => billing.workspaces.find((w) => w.workspaceId === row.workspaceId)?.name ?? "Unknown",
              },
              { key: "note", header: "Note", hideBelow: "md", render: (row) => row.note },
              { key: "by", header: "By", hideBelow: "lg", render: (row) => row.createdBy ?? "—" },
              { key: "when", header: "Date", hideBelow: "sm", render: (row) => when(row.createdAt) },
              {
                key: "amount",
                header: "Credits",
                align: "right",
                render: (row) => (
                  <span className={cn("tabular-nums font-medium", row.amountPaise > 0 ? "text-success" : "text-danger")}>
                    {row.amountPaise > 0 ? "+" : "−"}
                    {formatCredits(Math.abs(row.amountPaise))}
                  </span>
                ),
              },
            ]}
          />
        </section>
      )}

      {target && (
        <AddCreditsDialog
          target={target}
          onClose={() => setTarget(null)}
          onDone={() => {
            setTarget(null);
            void load();
          }}
        />
      )}
    </div>
  );
}

function PricingForm({ pricing, onSaved }: { pricing: Pricing; onSaved: () => void }) {
  const [sarvam, setSarvam] = useState((pricing.sarvamPerMinutePaise / 100).toFixed(2));
  const [margin, setMargin] = useState((pricing.marginPerMinutePaise / 100).toFixed(2));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const sarvamPaise = parseRupeesToPaise(sarvam);
  const marginPaise = parseRupeesToPaise(margin);
  const customer = sarvamPaise !== null && marginPaise !== null ? sarvamPaise + marginPaise : null;

  async function save(event: FormEvent) {
    event.preventDefault();
    if (sarvamPaise === null || marginPaise === null) {
      setMessage({ tone: "error", text: "Enter both amounts in rupees, e.g. 3.50." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await apiFetch("/admin/billing/pricing", {
        method: "PUT",
        body: JSON.stringify({ sarvamPerMinutePaise: sarvamPaise, marginPerMinutePaise: marginPaise }),
      });
      setMessage({ tone: "ok", text: "Saved. New calls use these prices; calls in progress keep theirs." });
      onSaved();
    } catch (failure) {
      setMessage({ tone: "error", text: failure instanceof Error ? failure.message : "Could not save." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="rounded-xl border border-line bg-surface p-5">
      <h2 className="text-sm font-semibold text-ink">Per-minute pricing</h2>
      <p className="mt-0.5 text-xs text-ink-muted">
        Sarvam pay-as-you-go is ₹3.50/min. Each call is rounded up to whole minutes.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <TextField id="price-sarvam" label="Sarvam rate (₹/min)" inputMode="decimal" value={sarvam} onChange={(e) => setSarvam(e.target.value)} />
        <TextField id="price-margin" label="Your margin (₹/min)" inputMode="decimal" value={margin} onChange={(e) => setMargin(e.target.value)} />
      </div>
      <div className="mt-4 flex items-baseline justify-between rounded-lg bg-surface-muted px-3.5 py-3">
        <span className="text-xs text-ink-muted">Customers pay</span>
        <span className="text-xl font-semibold tabular-nums text-ink">
          {customer === null ? "—" : `${formatRupees(customer)}`}
          <span className="ml-1 text-xs font-normal text-ink-muted">/ min</span>
        </span>
      </div>
      {message && (
        <p className={cn("mt-3 text-xs", message.tone === "ok" ? "text-success" : "text-danger")} role="status">
          {message.text}
        </p>
      )}
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[0.6875rem] text-ink-subtle">
          {pricing.updatedBy ? `Last changed by ${pricing.updatedBy}` : "Using default prices"}
        </p>
        <Action type="submit" size="sm" disabled={saving}>
          {saving ? "Saving…" : "Save prices"}
        </Action>
      </div>
    </form>
  );
}

function AddCreditsDialog({ target, onClose, onDone }: { target: CreditTarget; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState(target.amountPaise ? String(target.amountPaise / 100) : "");
  const [note, setNote] = useState(target.requestId ? "Payment received" : "");
  const [removing, setRemoving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    const paise = parseRupeesToPaise(amount);
    if (!paise) {
      setError("Enter an amount in rupees, e.g. 1000.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await apiFetch("/admin/billing/topups", {
        method: "POST",
        body: JSON.stringify({
          workspaceId: target.workspaceId,
          amountPaise: removing ? -paise : paise,
          note,
          requestId: target.requestId,
        }),
      });
      onDone();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not save.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-credits-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-float"
      >
        <h2 id="add-credits-title" className="flex items-center gap-2 text-base font-semibold text-ink">
          <Coins className="size-4 text-accent-strong" aria-hidden="true" />
          {removing ? "Remove credits" : "Add credits"}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">{target.name}</p>
        <div className="mt-5 space-y-3">
          <TextField
            id="credit-amount"
            label="Amount (₹ = credits)"
            inputMode="decimal"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <TextField
            id="credit-note"
            label="Note"
            hint="Shown to the customer in their credit history."
            placeholder="e.g. UPI ref 4821…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          {!target.requestId && (
            <label className="flex items-center gap-2 text-xs text-ink-muted">
              <input type="checkbox" checked={removing} onChange={(e) => setRemoving(e.target.checked)} />
              Remove credits instead (correction)
            </label>
          )}
        </div>
        {error && (
          <p role="alert" className="mt-3 text-xs text-danger">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2.5">
          <Action variant="ghost" onClick={onClose}>
            Cancel
          </Action>
          <Action type="submit" variant={removing ? "secondary" : "primary"} disabled={saving}>
            {saving ? "Saving…" : removing ? "Remove" : "Add credits"}
          </Action>
        </div>
      </form>
    </div>
  );
}

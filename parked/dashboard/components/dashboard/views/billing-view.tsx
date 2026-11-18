"use client";

import { Check, Clock, Coins, History, PhoneCall, Receipt, TriangleAlert, Wallet } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Action } from "@/components/panel/action";
import { DataTable, type Column } from "@/components/panel/data-table";
import { EmptyState } from "@/components/panel/empty-state";
import { MetricCard } from "@/components/panel/metric-card";
import { PageHeader } from "@/components/panel/page-header";
import { SectionTabs } from "@/components/panel/section-tabs";
import { StatusBadge, type StatusTone } from "@/components/panel/status-badge";
import { formatClock, formatCredits, formatCreditsShort, formatRupees } from "@/lib/billing/format";
import { apiFetch } from "@/lib/calling/remote-store";
import { cn } from "@/lib/cn";

type CallStatus = "live" | "ended" | "settled";

type CallUsage = {
  id: string;
  agent: string;
  startedAt: string;
  durationSeconds: number;
  minutes: number;
  creditsPaise: number;
  status: CallStatus;
};

type LedgerEntry = {
  id: string;
  type: "topup" | "call_charge" | "call_settlement" | "adjustment";
  amountPaise: number;
  balanceAfterPaise: number;
  note: string;
  createdAt: string;
};

type TopupRequest = { id: string; amountPaise: number; status: "pending" | "fulfilled" | "dismissed"; createdAt: string };

type Usage = {
  balancePaise: number;
  ratePaise: number;
  packsPaise: number[];
  requests: TopupRequest[];
  month: { minutes: number; creditsPaise: number; calls: number };
  live: (CallUsage & { elapsedSeconds: number })[];
  calls: CallUsage[];
  ledger: LedgerEntry[];
};

const TABS = ["Usage", "Credit history"] as const;
type Tab = (typeof TABS)[number];

/** Refresh quickly while a call is metering, slowly otherwise. */
const LIVE_POLL_MS = 5_000;
const IDLE_POLL_MS = 30_000;
/** Below this many minutes of talk time the wallet is flagged as low. */
const LOW_BALANCE_MINUTES = 10;

const STATUS: Record<CallStatus, { label: string; tone: StatusTone }> = {
  live: { label: "Live", tone: "positive" },
  ended: { label: "Finalising", tone: "attention" },
  settled: { label: "Final", tone: "neutral" },
};

const LEDGER_LABEL: Record<LedgerEntry["type"], string> = {
  topup: "Credits added",
  call_charge: "Call",
  call_settlement: "Call correction",
  adjustment: "Adjustment",
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Signed credit amount: "+500.00" / "−6.50". */
function signed(paise: number) {
  return `${paise > 0 ? "+" : "−"}${formatCredits(Math.abs(paise))}`;
}

/**
 * Usage & Billing — the customer's prepaid wallet.
 *
 * Calls are paid from credits (1 credit = ₹1) at one per-minute price; each
 * started minute is charged as it begins. The page shows the balance, calls
 * running right now with their meter, usage per call and every credit
 * movement. Credits are bought by requesting a pack; Reyvoca adds them once
 * payment is confirmed.
 */
export function BillingView() {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("Usage");
  const [buying, setBuying] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [loadedAt, setLoadedAt] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{ usage: Usage }>("/billing");
      setUsage(data.usage);
      setLoadedAt(Date.now());
      setError("");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not load usage.");
    }
  }, []);

  const hasLive = !!usage?.live.length;
  useEffect(() => {
    // Deferred a tick so the fetch's state updates land outside the effect body.
    const first = setTimeout(() => void load(), 0);
    const timer = setInterval(() => void load(), hasLive ? LIVE_POLL_MS : IDLE_POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [load, hasLive]);

  // A one-second clock so live call timers tick between refreshes.
  useEffect(() => {
    if (!hasLive) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [hasLive]);

  if (!usage) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader title="Usage & Billing" description="Prepaid credits for your agents' calls. 1 credit = ₹1." />
        {error ? (
          <div role="alert" className="rounded-xl border border-danger-line bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}{" "}
            <button type="button" onClick={() => void load()} className="font-semibold underline underline-offset-2">
              Try again
            </button>
          </div>
        ) : (
          <BillingSkeleton />
        )}
      </div>
    );
  }

  const minutesLeft = Math.floor(Math.max(0, usage.balancePaise) / usage.ratePaise);
  const low = minutesLeft < LOW_BALANCE_MINUTES;
  const pending = usage.requests.filter((request) => request.status === "pending");
  const sinceLoad = Math.max(0, Math.round((now - loadedAt) / 1000));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Usage & Billing"
        description="Prepaid credits for your agents' calls. 1 credit = ₹1."
        actions={
          <Action variant="accent" onClick={() => setBuying(true)}>
            <Coins className="size-4" aria-hidden="true" /> Add credits
          </Action>
        }
      />

      {/* Wallet first and widest: it is what every other number spends. */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
        <section
          aria-label="Credit balance"
          className={cn(
            "rounded-xl border bg-surface p-5 sm:p-6",
            low ? "border-warning-line" : "border-line",
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[0.8125rem] font-medium text-ink-muted">Credit balance</p>
            <Wallet className="size-4 text-ink-subtle" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <p
            className={cn(
              "mt-3 text-4xl font-semibold tracking-tight tabular-nums sm:text-[2.75rem]",
              usage.balancePaise < 0 ? "text-danger" : "text-ink",
            )}
          >
            {formatCredits(usage.balancePaise)}
          </p>
          <p className="mt-2 text-sm text-ink-muted">
            About <span className="font-semibold text-ink tabular-nums">{minutesLeft}</span> minutes of calls at{" "}
            {formatRupees(usage.ratePaise)} per minute
          </p>
          {low && (
            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-warning">
              <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
              {usage.balancePaise < usage.ratePaise
                ? "Not enough credits to start a call. Add credits to keep your agents calling."
                : "Credits are running low. Calls stop when the balance can't cover the next minute."}
            </p>
          )}
          {pending.length > 0 && (
            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
              <Clock className="mt-px size-3.5 shrink-0" aria-hidden="true" />
              {pending.length === 1
                ? `Your request for ${formatCreditsShort(pending[0].amountPaise)} credits is being processed.`
                : `${pending.length} credit requests are being processed.`}
            </p>
          )}
        </section>

        <MetricCard
          metric={{
            label: "Minutes this month",
            value: usage.month.minutes.toLocaleString("en-IN"),
            icon: Clock,
            note: `${usage.month.calls} ${usage.month.calls === 1 ? "call" : "calls"}`,
          }}
        />
        <MetricCard
          metric={{
            label: "Credits used this month",
            value: formatCredits(usage.month.creditsPaise),
            icon: Receipt,
            note: `${formatRupees(usage.ratePaise)} per started minute`,
          }}
        />
      </div>

      {usage.live.length > 0 && (
        <section aria-label="Calls in progress" className="rounded-xl border border-success-line bg-success-soft/40 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-success" />
            </span>
            {usage.live.length === 1 ? "1 call in progress" : `${usage.live.length} calls in progress`}
          </p>
          <ul className="mt-3 divide-y divide-success-line/60">
            {usage.live.map((call) => (
              <li key={call.id} className="flex items-center gap-4 py-2.5 text-sm">
                <PhoneCall className="size-4 shrink-0 text-success" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate font-medium text-ink">{call.agent}</span>
                <span className="tabular-nums text-ink-muted">{formatClock(call.elapsedSeconds + sinceLoad)}</span>
                <span className="w-28 text-right tabular-nums font-semibold text-ink">
                  {formatCredits(call.creditsPaise)} credits
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <SectionTabs tabs={TABS} active={tab} onChange={(next) => setTab(next as Tab)} label="Billing sections" />

      {tab === "Usage" ? <UsageTable calls={usage.calls} /> : <LedgerTable entries={usage.ledger} />}

      {buying && (
        <BuyCredits
          packs={usage.packsPaise}
          ratePaise={usage.ratePaise}
          onClose={() => setBuying(false)}
          onRequested={() => void load()}
        />
      )}
    </div>
  );
}

function UsageTable({ calls }: { calls: CallUsage[] }) {
  if (!calls.length) {
    return (
      <EmptyState
        icon={PhoneCall}
        title="No calls yet"
        description="Every call your agents take shows up here with its length and the credits it used, minute by minute."
      />
    );
  }
  const columns: Column<CallUsage>[] = [
    { key: "agent", header: "Agent", rowHeader: true, render: (call) => call.agent },
    { key: "when", header: "Started", hideBelow: "sm", render: (call) => formatWhen(call.startedAt) },
    {
      key: "duration",
      header: "Length",
      align: "right",
      render: (call) => <span className="tabular-nums">{formatClock(call.durationSeconds)}</span>,
    },
    {
      key: "minutes",
      header: "Billed min",
      align: "right",
      hideBelow: "md",
      render: (call) => <span className="tabular-nums">{call.minutes}</span>,
    },
    {
      key: "credits",
      header: "Credits",
      align: "right",
      render: (call) => <span className="tabular-nums font-medium text-ink">{formatCredits(call.creditsPaise)}</span>,
    },
    {
      key: "status",
      header: "Status",
      hideBelow: "sm",
      render: (call) => <StatusBadge status={STATUS[call.status].label} tone={STATUS[call.status].tone} />,
    },
  ];
  return (
    <div className="space-y-2">
      <DataTable caption="Calls and the credits they used" columns={columns} rows={calls} />
      <p className="text-xs leading-relaxed text-ink-subtle">
        Calls are billed per started minute. A call shows as Finalising for about a minute after it ends, while its
        exact length is confirmed; any difference is corrected automatically.
      </p>
    </div>
  );
}

function LedgerTable({ entries }: { entries: LedgerEntry[] }) {
  if (!entries.length) {
    return (
      <EmptyState
        icon={History}
        title="No credit activity"
        description="Credits you add and credits your calls use are listed here, with the balance after each change."
      />
    );
  }
  const columns: Column<LedgerEntry>[] = [
    {
      key: "what",
      header: "Description",
      rowHeader: true,
      render: (entry) => (
        <span className="flex flex-col">
          <span>{LEDGER_LABEL[entry.type]}</span>
          <span className="text-xs font-normal text-ink-subtle">{entry.note}</span>
        </span>
      ),
    },
    { key: "when", header: "Date", hideBelow: "sm", render: (entry) => formatWhen(entry.createdAt) },
    {
      key: "amount",
      header: "Credits",
      align: "right",
      render: (entry) => (
        <span className={cn("tabular-nums font-medium", entry.amountPaise > 0 ? "text-success" : "text-ink")}>
          {signed(entry.amountPaise)}
        </span>
      ),
    },
    {
      key: "balance",
      header: "Balance",
      align: "right",
      hideBelow: "sm",
      render: (entry) => <span className="tabular-nums">{formatCredits(entry.balanceAfterPaise)}</span>,
    },
  ];
  return <DataTable caption="Credit history" columns={columns} rows={entries} />;
}

function BuyCredits({
  packs,
  ratePaise,
  onClose,
  onRequested,
}: {
  packs: number[];
  ratePaise: number;
  onClose: () => void;
  onRequested: () => void;
}) {
  const [pack, setPack] = useState(packs[1] ?? packs[0]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function request() {
    setSending(true);
    setError("");
    try {
      await apiFetch("/billing/topup-requests", { method: "POST", body: JSON.stringify({ amountPaise: pack }) });
      setSent(true);
      onRequested();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not send the request. Try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="buy-credits-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-float"
      >
        {sent ? (
          <div className="text-center">
            <span className="mx-auto flex size-11 items-center justify-center rounded-full border border-success-line bg-success-soft text-success">
              <Check className="size-5" aria-hidden="true" />
            </span>
            <h2 id="buy-credits-title" className="mt-4 text-lg font-semibold text-ink">
              Request sent
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Our team will contact you with payment details for ₹{formatCreditsShort(pack)}. Your{" "}
              {formatCreditsShort(pack)} credits are added to this workspace as soon as payment is confirmed.
            </p>
            <Action className="mt-6 w-full" onClick={onClose}>
              Done
            </Action>
          </div>
        ) : (
          <>
            <h2 id="buy-credits-title" className="text-lg font-semibold text-ink">
              Add credits
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
              1 credit = ₹1. Calls use {formatCredits(ratePaise)} credits per started minute. Prices exclude GST.
            </p>

            <fieldset className="mt-5">
              <legend className="sr-only">Credit pack</legend>
              <div className="grid grid-cols-2 gap-2.5">
                {packs.map((amount) => {
                  const selected = amount === pack;
                  return (
                    <label
                      key={amount}
                      className={cn(
                        "cursor-pointer rounded-xl border px-4 py-3 transition-colors",
                        selected
                          ? "border-accent bg-accent-wash"
                          : "border-line hover:border-line-strong hover:bg-surface-muted",
                      )}
                    >
                      <input
                        type="radio"
                        name="credit-pack"
                        value={amount}
                        checked={selected}
                        onChange={() => setPack(amount)}
                        className="sr-only"
                      />
                      <span className="block text-base font-semibold tabular-nums text-ink">
                        ₹{formatCreditsShort(amount)}
                      </span>
                      <span className="block text-xs text-ink-muted tabular-nums">
                        ≈ {Math.floor(amount / ratePaise).toLocaleString("en-IN")} minutes
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {error && (
              <p role="alert" className="mt-4 rounded-lg border border-danger-line bg-danger-soft px-3 py-2 text-xs text-danger">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-2.5">
              <Action variant="ghost" onClick={onClose}>
                Cancel
              </Action>
              <Action variant="accent" onClick={() => void request()} disabled={sending}>
                {sending ? "Sending…" : `Request ${formatCreditsShort(pack)} credits`}
              </Action>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BillingSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div className="h-44 animate-pulse rounded-xl border border-line bg-surface-muted" />
        <div className="h-28 animate-pulse rounded-xl border border-line bg-surface-muted" />
        <div className="h-28 animate-pulse rounded-xl border border-line bg-surface-muted" />
      </div>
      <div className="h-64 animate-pulse rounded-xl border border-line bg-surface-muted" />
    </div>
  );
}

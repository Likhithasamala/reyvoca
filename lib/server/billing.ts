/**
 * Prepaid credits and per-minute metering for web calls.
 *
 * Reyvoca resells Sarvam minutes under its own brand. Every agent minute costs
 * the customer Sarvam's rate plus Reyvoca's margin, paid from a prepaid wallet
 * (1 credit = ₹1). Customers only ever see their own price; Sarvam's rate and
 * the margin are operator-only.
 *
 * Lifecycle of a billed call:
 *  1. `openCallBilling` — refuses the call unless one minute is affordable and
 *     freezes the prices for this call.
 *  2. `meterCall` — on connect and every ping from the browser, charges each
 *     minute as it starts (Sarvam rounds calls up to whole minutes) and says
 *     how long the wallet can keep the call going.
 *  3. `endCallBilling` — on hang-up, charges up to the final started minute.
 *  4. `settleCall` — once Sarvam's record is in, re-bills to Sarvam's own
 *     duration, refunding or charging the difference.
 *
 * Money is integer paise throughout. All functions taking `db` must run
 * inside `mutate`, which serialises writes.
 */
import {
  mutate,
  newId,
  read,
  type CallBilling,
  type Database,
  type StoredCall,
  type StoredLedgerEntry,
  type StoredPricing,
  type StoredTopupRequest,
} from "./db";
import { callTag, findInteraction, samvaadConfig } from "./samvaad";

/** Sarvam pay-as-you-go (₹3.50/min) + Reyvoca margin (₹3/min). */
export const DEFAULT_PRICING: Omit<StoredPricing, "updatedAt"> = {
  sarvamPerMinutePaise: 350,
  marginPerMinutePaise: 300,
};

const MINUTE_MS = 60_000;
/** A live call not pinged for this long is treated as ended. */
const STALE_METER_MS = 2 * MINUTE_MS;
/** Give up waiting for Sarvam's record after this; the metered charge stands. */
const SETTLE_GIVE_UP_MS = 2 * 60 * MINUTE_MS;

export function pricingOf(db: Database): StoredPricing {
  return db.pricing ?? { ...DEFAULT_PRICING, updatedAt: new Date(0).toISOString() };
}

/** What the customer pays per minute, in paise. */
export function customerRatePaise(pricing: Pick<StoredPricing, "sarvamPerMinutePaise" | "marginPerMinutePaise">) {
  return pricing.sarvamPerMinutePaise + pricing.marginPerMinutePaise;
}

const rateOf = (billing: CallBilling) => billing.sarvamPerMinutePaise + billing.marginPerMinutePaise;

export function balanceOf(db: Database, workspaceId: string): number {
  return db.wallets.find((wallet) => wallet.workspaceId === workspaceId)?.balancePaise ?? 0;
}

/** Applies one signed amount to a wallet and records it in the ledger. */
export function postLedger(
  db: Database,
  entry: Omit<StoredLedgerEntry, "id" | "balanceAfterPaise" | "createdAt">,
): StoredLedgerEntry {
  const now = new Date().toISOString();
  let wallet = db.wallets.find((row) => row.workspaceId === entry.workspaceId);
  if (!wallet) {
    wallet = { workspaceId: entry.workspaceId, balancePaise: 0, updatedAt: now };
    db.wallets.push(wallet);
  }
  wallet.balancePaise += entry.amountPaise;
  wallet.updatedAt = now;
  const row: StoredLedgerEntry = {
    ...entry,
    id: newId(),
    balanceAfterPaise: wallet.balancePaise,
    createdAt: now,
  };
  db.ledger.push(row);
  return row;
}

export type BillingRefusal = { refused: true; ratePaise: number; balancePaise: number };

/**
 * Prices a new call, or refuses it when the wallet cannot cover one minute —
 * a connected call is never billed for less than a minute.
 */
export function openCallBilling(db: Database, workspaceId: string): CallBilling | BillingRefusal {
  const pricing = pricingOf(db);
  const ratePaise = customerRatePaise(pricing);
  const balancePaise = balanceOf(db, workspaceId);
  if (balancePaise < ratePaise) return { refused: true, ratePaise, balancePaise };
  return {
    sarvamPerMinutePaise: pricing.sarvamPerMinutePaise,
    marginPerMinutePaise: pricing.marginPerMinutePaise,
    minutesCharged: 0,
    chargedPaise: 0,
    status: "live",
  };
}

/** Charges `call` up to `minutes` in total. */
function chargeUpTo(db: Database, call: StoredCall, billing: CallBilling, minutes: number) {
  const extra = minutes - billing.minutesCharged;
  if (extra <= 0) return;
  const amount = extra * rateOf(billing);
  postLedger(db, {
    workspaceId: call.userId,
    type: "call_charge",
    amountPaise: -amount,
    callId: call.id,
    note:
      extra === 1
        ? `${call.agent} · minute ${minutes}`
        : `${call.agent} · minutes ${billing.minutesCharged + 1}–${minutes}`,
  });
  billing.minutesCharged = minutes;
  billing.chargedPaise += amount;
}

export type MeterReading = {
  status: CallBilling["status"];
  minutesCharged: number;
  chargedPaise: number;
  ratePaise: number;
  balancePaise: number;
  /** Elapsed seconds on the server clock since audio connected. */
  elapsedSeconds: number;
  /** Epoch ms up to which the call is paid for (end of the last charged minute). */
  paidUntil: number | null;
  /** True when the wallet can pay for the next minute. */
  canContinue: boolean;
};

/**
 * Meters a live call. `connected` marks the moment audio connected; every
 * later call charges the minute in progress. A minute that has started is
 * charged even if it overdraws the wallet — Sarvam bills it either way — but
 * `canContinue` tells the browser to hang up before the next one starts.
 */
export function meterCall(db: Database, call: StoredCall, options: { connected?: boolean } = {}): MeterReading | null {
  const billing = call.billing;
  if (!billing) return null;
  const now = Date.now();

  if (billing.status === "live") {
    if (options.connected && !billing.connectedAt) billing.connectedAt = new Date(now).toISOString();
    if (billing.connectedAt) {
      billing.lastMeterAt = new Date(now).toISOString();
      const elapsed = now - Date.parse(billing.connectedAt);
      chargeUpTo(db, call, billing, Math.floor(elapsed / MINUTE_MS) + 1);
    }
  }
  return reading(db, call, billing, now);
}

function reading(db: Database, call: StoredCall, billing: CallBilling, now: number): MeterReading {
  const connectedAt = billing.connectedAt ? Date.parse(billing.connectedAt) : null;
  const balancePaise = balanceOf(db, call.userId);
  return {
    status: billing.status,
    minutesCharged: billing.minutesCharged,
    chargedPaise: billing.chargedPaise,
    ratePaise: rateOf(billing),
    balancePaise,
    elapsedSeconds: connectedAt ? Math.round(((billing.endedAt ? Date.parse(billing.endedAt) : now) - connectedAt) / 1000) : 0,
    paidUntil: connectedAt ? connectedAt + billing.minutesCharged * MINUTE_MS : null,
    canContinue: balancePaise >= rateOf(billing),
  };
}

/** Hang-up: charge through the final started minute and await settlement. */
export function endCallBilling(db: Database, call: StoredCall, endedAtMs = Date.now()) {
  const billing = call.billing;
  if (!billing || billing.status !== "live") return;
  if (billing.connectedAt) {
    const connectedAt = Date.parse(billing.connectedAt);
    const elapsed = Math.max(0, endedAtMs - connectedAt);
    chargeUpTo(db, call, billing, Math.max(1, Math.ceil(elapsed / MINUTE_MS)));
    call.durationSeconds = Math.round(elapsed / 1000);
  }
  billing.endedAt = new Date(endedAtMs).toISOString();
  billing.status = "ended";
}

/**
 * Re-bills a finished call to Sarvam's own duration (whole minutes, rounded
 * up; a call that never connected costs nothing). Idempotent.
 */
export function settleCall(db: Database, call: StoredCall, sarvamSeconds: number | null) {
  const billing = call.billing;
  if (!billing || billing.status === "settled") return;
  if (billing.status === "live") endCallBilling(db, call);

  if (sarvamSeconds !== null) {
    const minutes = sarvamSeconds > 0 ? Math.ceil(sarvamSeconds / 60) : 0;
    const diff = minutes - billing.minutesCharged;
    if (diff !== 0) {
      const amount = diff * rateOf(billing);
      postLedger(db, {
        workspaceId: call.userId,
        type: "call_settlement",
        amountPaise: -amount,
        callId: call.id,
        note:
          diff < 0
            ? `${call.agent} · refund, call was ${minutes} min`
            : `${call.agent} · call ran ${minutes} min`,
      });
      billing.minutesCharged = minutes;
      billing.chargedPaise += amount;
    }
    billing.sarvamMinutes = minutes;
    call.durationSeconds = Math.round(sarvamSeconds);
  }
  billing.status = "settled";
}

/**
 * Finishes calls the browser abandoned (tab closed mid-call) and settles
 * ended calls against Sarvam. Network lookups happen outside the write lock;
 * at most `limit` calls are looked up per run.
 */
export async function reconcileCalls(workspaceId?: string, limit = 5): Promise<void> {
  const now = Date.now();
  const config = samvaadConfig();

  // Close live calls that stopped pinging.
  await mutate((db) => {
    for (const call of db.calls) {
      const billing = call.billing;
      if (!billing || billing.status !== "live") continue;
      if (workspaceId && call.userId !== workspaceId) continue;
      const last = Date.parse(billing.lastMeterAt ?? billing.connectedAt ?? call.startedAt);
      if (now - last > STALE_METER_MS) endCallBilling(db, call, last);
    }
  });

  const pending = await read((db) =>
    db.calls
      .filter((call) => call.billing?.status === "ended" && (!workspaceId || call.userId === workspaceId))
      .slice(0, limit),
  );

  for (const call of pending) {
    let seconds: number | null | undefined;
    if (config) {
      try {
        const found = await findInteraction(config, callTag(call.id), new Date(call.startedAt));
        if (found) seconds = found.durationSeconds;
      } catch {
        // Sarvam unreachable: try again on the next run.
        continue;
      }
    }
    if (seconds === undefined) {
      // Sarvam has no record yet. Never connected → nothing to bill; otherwise
      // wait, and after a long while keep the metered charge as final.
      const neverConnected = !call.billing?.connectedAt;
      const tooOld = now - Date.parse(call.startedAt) > SETTLE_GIVE_UP_MS;
      if (neverConnected && tooOld) seconds = 0;
      else if (tooOld) seconds = null;
      else continue;
    }
    await mutate((db) => {
      const row = db.calls.find((entry) => entry.id === call.id);
      if (row) settleCall(db, row, seconds ?? null);
    });
  }
}

// ── Read models ────────────────────────────────────────────────────────────

export type CustomerCallUsage = {
  id: string;
  agent: string;
  startedAt: string;
  durationSeconds: number;
  minutes: number;
  creditsPaise: number;
  status: CallBilling["status"];
};

/** Credit packs a customer can ask for, in paise. */
export const CREDIT_PACKS_PAISE = [500_00, 1_000_00, 2_500_00, 5_000_00];

export type CustomerTopupRequest = Pick<StoredTopupRequest, "id" | "amountPaise" | "status" | "createdAt">;

export type CustomerUsage = {
  balancePaise: number;
  packsPaise: number[];
  requests: CustomerTopupRequest[];
  ratePaise: number;
  month: { minutes: number; creditsPaise: number; calls: number };
  live: (CustomerCallUsage & { elapsedSeconds: number })[];
  calls: CustomerCallUsage[];
  ledger: Omit<StoredLedgerEntry, "workspaceId" | "createdBy">[];
};

const startOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
};

const toCustomerCall = (call: StoredCall): CustomerCallUsage => ({
  id: call.id,
  agent: call.agent,
  startedAt: call.startedAt,
  durationSeconds: call.durationSeconds,
  minutes: call.billing?.minutesCharged ?? 0,
  creditsPaise: call.billing?.chargedPaise ?? 0,
  status: call.billing?.status ?? "settled",
});

/**
 * One workspace's wallet and usage. Customer-facing: carries the customer's
 * own per-minute price only, never Sarvam's rate or the margin.
 */
export async function customerUsage(workspaceId: string): Promise<CustomerUsage> {
  return read((db) => {
    const since = startOfMonth();
    const billed = db.calls
      .filter((call) => call.userId === workspaceId && call.billing)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    const thisMonth = billed.filter((call) => call.startedAt >= since);
    const now = Date.now();

    return {
      balancePaise: balanceOf(db, workspaceId),
      packsPaise: CREDIT_PACKS_PAISE,
      requests: db.topupRequests
        .filter((request) => request.workspaceId === workspaceId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 10)
        .map(({ id, amountPaise, status, createdAt }) => ({ id, amountPaise, status, createdAt })),
      ratePaise: customerRatePaise(pricingOf(db)),
      month: {
        minutes: thisMonth.reduce((sum, call) => sum + (call.billing?.minutesCharged ?? 0), 0),
        creditsPaise: thisMonth.reduce((sum, call) => sum + (call.billing?.chargedPaise ?? 0), 0),
        calls: thisMonth.length,
      },
      live: billed
        .filter((call) => call.billing?.status === "live" && call.billing.connectedAt)
        .map((call) => ({
          ...toCustomerCall(call),
          elapsedSeconds: Math.round((now - Date.parse(call.billing!.connectedAt!)) / 1000),
        })),
      calls: billed.slice(0, 100).map(toCustomerCall),
      ledger: db.ledger
        .filter((entry) => entry.workspaceId === workspaceId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 100)
        .map((entry) => ({
          id: entry.id,
          type: entry.type,
          amountPaise: entry.amountPaise,
          balanceAfterPaise: entry.balanceAfterPaise,
          callId: entry.callId,
          note: entry.note,
          createdAt: entry.createdAt,
        })),
    };
  });
}

export type WorkspaceBilling = {
  workspaceId: string;
  name: string;
  email: string | null;
  balancePaise: number;
  minutes: number;
  revenuePaise: number;
  sarvamCostPaise: number;
};

export type OperatorBilling = {
  pricing: StoredPricing;
  ratePaise: number;
  totals: { minutes: number; revenuePaise: number; sarvamCostPaise: number; marginPaise: number; creditsOutstandingPaise: number };
  workspaces: WorkspaceBilling[];
  topups: StoredLedgerEntry[];
  requests: (StoredTopupRequest & { workspaceName: string; email: string | null })[];
};

/** Operator-only: prices, margin earned and every wallet. */
export async function operatorBilling(devWorkspace: { id: string; name: string }): Promise<OperatorBilling> {
  return read((db) => {
    const pricing = pricingOf(db);
    const rows = new Map<string, WorkspaceBilling>();
    const row = (workspaceId: string): WorkspaceBilling => {
      let entry = rows.get(workspaceId);
      if (!entry) {
        const user = db.users.find((u) => u.id === workspaceId);
        entry = {
          workspaceId,
          name: user?.workspace ?? (workspaceId === devWorkspace.id ? devWorkspace.name : "Unknown workspace"),
          email: user?.email ?? null,
          balancePaise: balanceOf(db, workspaceId),
          minutes: 0,
          revenuePaise: 0,
          sarvamCostPaise: 0,
        };
        rows.set(workspaceId, entry);
      }
      return entry;
    };

    for (const user of db.users) row(user.id);
    for (const wallet of db.wallets) row(wallet.workspaceId);
    for (const call of db.calls) {
      if (!call.billing) continue;
      const entry = row(call.userId);
      entry.minutes += call.billing.minutesCharged;
      entry.revenuePaise += call.billing.chargedPaise;
      entry.sarvamCostPaise += call.billing.minutesCharged * call.billing.sarvamPerMinutePaise;
    }

    const workspaces = [...rows.values()].sort((a, b) => b.revenuePaise - a.revenuePaise || a.name.localeCompare(b.name));
    const sum = (pick: (w: WorkspaceBilling) => number) => workspaces.reduce((total, w) => total + pick(w), 0);
    const revenuePaise = sum((w) => w.revenuePaise);
    const sarvamCostPaise = sum((w) => w.sarvamCostPaise);

    return {
      pricing,
      ratePaise: customerRatePaise(pricing),
      totals: {
        minutes: sum((w) => w.minutes),
        revenuePaise,
        sarvamCostPaise,
        marginPaise: revenuePaise - sarvamCostPaise,
        creditsOutstandingPaise: sum((w) => Math.max(0, w.balancePaise)),
      },
      workspaces,
      requests: db.topupRequests
        .filter((request) => request.status === "pending")
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map((request) => ({
          ...request,
          workspaceName: row(request.workspaceId).name,
          email: row(request.workspaceId).email,
        })),
      topups: db.ledger
        .filter((entry) => entry.type === "topup" || entry.type === "adjustment")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 50),
    };
  });
}

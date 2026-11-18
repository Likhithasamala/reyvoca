/**
 * Minimal file-backed datastore for the local Reyvoca backend.
 *
 * Phase 2 runs on a JSON file so the backend works with `npm run dev` and no
 * database to install. The module exports only `read`/`mutate`, so swapping in
 * Postgres/Prisma later means rewriting this file alone.
 */
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Agent } from "@/lib/agents/types";
import type { Campaign, InstantSetup, Lead, WebhookEvent } from "@/types/calling";
import { PLATFORM_WORKSPACE_ID } from "./scope";

export type StoredUser = {
  id: string;
  fullName: string;
  /** Always stored lowercase; it is the unique key for an account. */
  email: string;
  workspace: string;
  passwordHash: string;
  /**
   * "admin" accounts reach the operator panel at `/admin`, where the provider
   * stack is configured. Absent means an ordinary customer account; see
   * `lib/server/admin.ts` for the full rule (an `REYVOCA_ADMIN_EMAILS` entry
   * also grants it, without touching stored rows).
   */
  role?: "admin" | "user";
  createdAt: string;
};

export type StoredSession = {
  /** SHA-256 of the cookie token — the raw token is never persisted. */
  tokenHash: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
};

export type StoredCall = {
  id: string;
  userId: string;
  customer: string;
  agent: string;
  /** Call length in seconds. */
  durationSeconds: number;
  outcome: string;
  startedAt: string;
  /** Reyvoca agent the call ran as, when known. */
  agentId?: string;
  /** How the call was placed; "web" is a browser call on Sarvam. */
  channel?: "web";
  /** Sarvam interaction id (`<YYYYMMDD>/<id>`), used to fetch the transcript. */
  interactionId?: string;
  /** Metering for a billed call; absent on calls that were never billed. */
  billing?: CallBilling;
};

/**
 * How one call is metered. Money is in paise (₹1 = 100 paise = 1 credit).
 *
 * Each started minute is charged as it begins, the way Sarvam rounds a call
 * up to whole minutes. When Sarvam's own record arrives the call is settled to
 * its duration, so what the customer pays always tracks what Sarvam bills.
 */
export type CallBilling = {
  /** Prices in force when the call started — later price changes never re-price it. */
  sarvamPerMinutePaise: number;
  marginPerMinutePaise: number;
  /** When audio connected (server clock); minutes are counted from here. */
  connectedAt?: string;
  /** Last time the browser reported the call still running. */
  lastMeterAt?: string;
  endedAt?: string;
  /** Minutes charged to the wallet so far. */
  minutesCharged: number;
  /** Total charged to the customer, in paise (minutes × customer price). */
  chargedPaise: number;
  /** "live" while metering, "ended" until settled with Sarvam, then "settled". */
  status: "live" | "ended" | "settled";
  /** Sarvam's billable minutes once settled. */
  sarvamMinutes?: number;
};

/**
 * Prepaid credits for one workspace. 1 credit = ₹1; held in paise.
 * May go slightly negative when a call settles longer than it was metered;
 * new calls are then refused until the wallet is topped up.
 */
export type StoredWallet = {
  workspaceId: string;
  balancePaise: number;
  updatedAt: string;
};

/** Every change to a wallet. The balance is always the sum of these. */
export type StoredLedgerEntry = {
  id: string;
  workspaceId: string;
  type: "topup" | "call_charge" | "call_settlement" | "adjustment";
  /** Signed: positive adds credits, negative spends them. */
  amountPaise: number;
  balanceAfterPaise: number;
  callId?: string;
  note: string;
  /** Operator email for manual entries. */
  createdBy?: string;
  createdAt: string;
};

/**
 * A customer asking for credits. Payment happens offline; an operator adds the
 * credits (which marks the request fulfilled) or dismisses it.
 */
export type StoredTopupRequest = {
  id: string;
  workspaceId: string;
  amountPaise: number;
  status: "pending" | "fulfilled" | "dismissed";
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
};

/** Platform-wide prices, set by an operator. */
export type StoredPricing = {
  /** What Sarvam charges Reyvoca per agent minute (pay-as-you-go: ₹3.50). */
  sarvamPerMinutePaise: number;
  /** Reyvoca's margin per minute on top. */
  marginPerMinutePaise: number;
  updatedAt: string;
  updatedBy?: string;
};

/**
 * Every workspace-scoped record carries its owner.
 *
 * With authentication the workspace is the signed-in account; without it (the
 * dashboard is open during development) everything belongs to one shared
 * development workspace. See `lib/server/workspace.ts`.
 */
type Owned<T> = T & { workspaceId: string };

export type StoredAgent = Owned<Agent>;
export type StoredLead = Owned<Lead>;
export type StoredCampaign = Owned<Campaign>;
export type StoredWebhookEvent = Owned<WebhookEvent>;
export type StoredInstantSetup = Owned<InstantSetup>;

/** A delivery key already accepted, so a retried webhook is not called twice. */
export type StoredIdempotencyKey = {
  workspaceId: string;
  key: string;
  leadId: string;
  seenAt: string;
};

/**
 * A saved provider API key (LLM / STT / TTS).
 *
 * The raw key never leaves the server: list responses carry `keyMasked` only,
 * and the key itself is read back solely to call the provider on the
 * workspace's behalf (test chat, web call, voice library).
 */
export type StoredProviderConfig = {
  id: string;
  workspaceId: string;
  providerType: "llm" | "stt" | "tts";
  providerName: string;
  label: string;
  apiKey: string;
  keyMasked: string;
  isValidated: boolean;
  /** Extra provider fields, e.g. the Azure region. */
  settings: Record<string, string>;
  createdAt: string;
};

/**
 * A "Book a demo" enquiry from the public site.
 *
 * Reyvoca is sold with a conversation, not self-serve: these are the people to
 * ring back, so the row carries everything needed to make that call and a
 * status to track whether it has happened.
 */
export type StoredDemoRequest = {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  message?: string;
  status: "new" | "contacted" | "booked" | "closed";
  createdAt: string;
};

export type Database = {
  users: StoredUser[];
  sessions: StoredSession[];
  demoRequests: StoredDemoRequest[];
  calls: StoredCall[];
  agents: StoredAgent[];
  leads: StoredLead[];
  campaigns: StoredCampaign[];
  webhookEvents: StoredWebhookEvent[];
  idempotencyKeys: StoredIdempotencyKey[];
  instantSetups: StoredInstantSetup[];
  providerConfigs: StoredProviderConfig[];
  wallets: StoredWallet[];
  ledger: StoredLedgerEntry[];
  topupRequests: StoredTopupRequest[];
  /** Null until an operator saves prices; the defaults in lib/server/billing apply. */
  pricing: StoredPricing | null;
};

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "reyvoca.json");

const emptyDatabase = (): Database => ({
  users: [],
  sessions: [],
  demoRequests: [],
  calls: [],
  agents: [],
  leads: [],
  campaigns: [],
  webhookEvents: [],
  idempotencyKeys: [],
  instantSetups: [],
  wallets: [],
  ledger: [],
  topupRequests: [],
  pricing: null,
  providerConfigs: [],
});

async function load(): Promise<Database> {
  try {
    const parsed = JSON.parse(await readFile(DATA_FILE, "utf8")) as Partial<Database>;
    // Each collection is defaulted, so a file written by an earlier version
    // loads cleanly instead of crashing on a missing key.
    const db = { ...emptyDatabase(), ...parsed };

    // Provider keys used to be saved per workspace, when every customer
    // connected their own. They are Reyvoca's now, configured once in the
    // operator panel, so keys written by an earlier version are adopted by the
    // platform workspace — otherwise they would be invisible to the only
    // screen that can still manage them. Idempotent, and persisted by the
    // next write.
    db.providerConfigs = db.providerConfigs.map((row) =>
      row.workspaceId === PLATFORM_WORKSPACE_ID ? row : { ...row, workspaceId: PLATFORM_WORKSPACE_ID },
    );

    return db;
  } catch {
    // Missing or unreadable file: start from an empty database.
    return emptyDatabase();
  }
}

async function save(db: Database): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  // Write to a temp file first so a crash mid-write cannot truncate the store.
  const temp = `${DATA_FILE}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(db, null, 2), "utf8");
  await rename(temp, DATA_FILE);
}

/**
 * Serialises every mutation. Route handlers can run concurrently, and
 * read-modify-write on a single file is not safe without this queue.
 */
let queue: Promise<unknown> = Promise.resolve();

export function read<T>(select: (db: Database) => T): Promise<T> {
  const run = queue.then(async () => select(await load()));
  queue = run.catch(() => {});
  return run;
}

/** Runs `change` against the current database and persists the result. */
export function mutate<T>(change: (db: Database) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const db = await load();
    const result = await change(db);
    await save(db);
    return result;
  });
  queue = run.catch(() => {});
  return run;
}

/**
 * Drops the internal workspace key before a record leaves the API.
 *
 * `workspaceId` is how rows are partitioned on the server; clients never see
 * it, so every response maps through this.
 */
export function publicRecord<T extends { workspaceId: string }>(row: T): Omit<T, "workspaceId"> {
  const copy: Partial<T> = { ...row };
  delete copy.workspaceId;
  return copy as Omit<T, "workspaceId">;
}

export { randomUUID as newId };

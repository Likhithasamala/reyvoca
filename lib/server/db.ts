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

export type StoredUser = {
  id: string;
  fullName: string;
  /** Always stored lowercase; it is the unique key for an account. */
  email: string;
  workspace: string;
  passwordHash: string;
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

export type Database = {
  users: StoredUser[];
  sessions: StoredSession[];
  calls: StoredCall[];
  agents: StoredAgent[];
  leads: StoredLead[];
  campaigns: StoredCampaign[];
  webhookEvents: StoredWebhookEvent[];
  idempotencyKeys: StoredIdempotencyKey[];
  instantSetups: StoredInstantSetup[];
  providerConfigs: StoredProviderConfig[];
};

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "reyvoca.json");

const emptyDatabase = (): Database => ({
  users: [],
  sessions: [],
  calls: [],
  agents: [],
  leads: [],
  campaigns: [],
  webhookEvents: [],
  idempotencyKeys: [],
  instantSetups: [],
  providerConfigs: [],
});

async function load(): Promise<Database> {
  try {
    const parsed = JSON.parse(await readFile(DATA_FILE, "utf8")) as Partial<Database>;
    // Each collection is defaulted, so a file written by an earlier version
    // loads cleanly instead of crashing on a missing key.
    return { ...emptyDatabase(), ...parsed };
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

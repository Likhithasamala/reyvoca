#!/usr/bin/env node
/**
 * Lift the local file store into Postgres (Neon).
 *
 * Both engines in lib/server/db.ts hold the same JSON document, so this is a
 * copy rather than a translation: read .data/reyvoca.json, write it into the
 * single `reyvoca_store` row, done.
 *
 * Usage, from the project root:
 *
 *   node --env-file=.env.local scripts/db-import.mjs
 *   node --env-file=.env.local scripts/db-import.mjs --force
 *   DATABASE_URL="postgresql://..." node scripts/db-import.mjs
 *
 * It refuses to run if the target already holds data, because that data came
 * from production and this file did not. `--force` overwrites it, and prints
 * what it is about to destroy first.
 *
 * Safe to run against an empty project: the table is created if missing, and
 * the app creates it on first request anyway.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { neon } from "@neondatabase/serverless";

const DATA_FILE = path.join(process.cwd(), ".data", "reyvoca.json");
const STORE_ID = 1;
const force = process.argv.includes("--force");

/** Collections worth naming in the summary; the rest are counted silently. */
const HEADLINE = ["users", "sessions", "demoRequests", "agents", "calls", "leads", "campaigns"];

function fail(message) {
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
  fail(
    "DATABASE_URL is not set.\n" +
      "  Pass it from your env file:  node --env-file=.env.local scripts/db-import.mjs\n" +
      "  or inline:                   DATABASE_URL='postgresql://...' node scripts/db-import.mjs",
  );
}

let document;
try {
  document = JSON.parse(await readFile(DATA_FILE, "utf8"));
} catch (error) {
  if (error.code === "ENOENT") {
    fail(
      `No local store at ${DATA_FILE}.\n` +
        "  There is nothing to import, which is fine for a fresh deploy:\n" +
        "  the app creates the table and an empty document on its first request.",
    );
  }
  fail(`Could not read ${DATA_FILE}: ${error.message}`);
}

const counts = Object.fromEntries(
  Object.entries(document).map(([key, value]) => [key, Array.isArray(value) ? value.length : value ? 1 : 0]),
);
const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

console.log(`\n  Source  ${DATA_FILE}`);
for (const key of HEADLINE) {
  if (counts[key] !== undefined) console.log(`    ${key.padEnd(14)} ${counts[key]}`);
}
const others = Object.keys(counts).filter((key) => !HEADLINE.includes(key) && counts[key] > 0);
if (others.length > 0) console.log(`    ${"other".padEnd(14)} ${others.join(", ")}`);
console.log(`    ${"total rows".padEnd(14)} ${total}`);

const sql = neon(url);

await sql`
  CREATE TABLE IF NOT EXISTS reyvoca_store (
    id         integer PRIMARY KEY,
    data       jsonb NOT NULL,
    version    bigint NOT NULL DEFAULT 1,
    updated_at timestamptz NOT NULL DEFAULT now()
  )
`;

const existing = await sql`
  SELECT version, updated_at, jsonb_array_length(COALESCE(data->'users', '[]'::jsonb)) AS users
    FROM reyvoca_store WHERE id = ${STORE_ID}
`;

if (existing.length > 0 && !force) {
  fail(
    "The target already holds a document.\n" +
      `    version     ${existing[0].version}\n` +
      `    updated at  ${existing[0].updated_at.toISOString()}\n` +
      `    users       ${existing[0].users}\n\n` +
      "  Importing would replace it. If that is what you want, re-run with --force.",
  );
}

if (existing.length > 0) {
  console.log(
    `\n  Overwriting existing document (version ${existing[0].version}, ${existing[0].users} users) because --force was given.`,
  );
}

const data = JSON.stringify(document);
await sql`
  INSERT INTO reyvoca_store (id, data, version) VALUES (${STORE_ID}, ${data}::jsonb, 1)
  ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, version = reyvoca_store.version + 1, updated_at = now()
`;

const [row] = await sql`
  SELECT version, jsonb_array_length(COALESCE(data->'users', '[]'::jsonb)) AS users
    FROM reyvoca_store WHERE id = ${STORE_ID}
`;

console.log(`\n  Imported. Document is now version ${row.version} with ${row.users} users.\n`);

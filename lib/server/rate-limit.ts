/**
 * Rate limiting and account lockout.
 *
 * Two different jobs, both served by one counter table:
 *
 *  - **quota** (`consumeQuota`) counts every attempt in a window and refuses
 *    once the limit is reached. This is what stops someone requesting a
 *    thousand password-reset emails for an address they do not own.
 *  - **failure counting** (`recordFailure` / `clearFailures`) counts only
 *    unsuccessful sign-ins, locks the key for a cooling-off period once there
 *    are too many, and resets the moment a correct password arrives. This is
 *    what makes guessing a password impractical without punishing the owner.
 *
 * Sign-in is limited on two keys at once — the email and the client IP — so
 * one attacker cannot lock every account out by guessing against each in
 * turn, and spreading guesses across many accounts still hits the IP ceiling.
 *
 * The counters live in the same JSON store as everything else, which is right
 * for one server. Behind several instances this wants Redis; `mutate` is the
 * only thing that would change.
 */
import { mutate, type StoredRateLimit } from "./db";

export type RateLimitVerdict =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSeconds: number };

type Rule = { limit: number; windowMs: number; lockoutMs?: number };

/** The rules, in one place so they can be read at a glance. */
export const RULES = {
  /** Failed sign-ins per email before a 15-minute pause. */
  signInEmail: { limit: 8, windowMs: 15 * 60_000, lockoutMs: 15 * 60_000 },
  /** Failed sign-ins from one IP — higher, because offices share an address. */
  signInIp: { limit: 30, windowMs: 15 * 60_000, lockoutMs: 15 * 60_000 },
  /** New accounts from one IP per hour. */
  signUpIp: { limit: 10, windowMs: 60 * 60_000 },
  /** Password-reset emails per address per hour. */
  passwordResetEmail: { limit: 5, windowMs: 60 * 60_000 },
  /** Verification emails re-sent per account per hour. */
  verifyResend: { limit: 5, windowMs: 60 * 60_000 },
  /** Attempts to redeem a reset link from one IP per hour. */
  tokenRedeemIp: { limit: 20, windowMs: 60 * 60_000 },
} satisfies Record<string, Rule>;

const secondsUntil = (iso: string): number =>
  Math.max(1, Math.ceil((new Date(iso).getTime() - Date.now()) / 1000));

/** Removes counters whose window has passed and whose lockout has lapsed. */
function prune(rows: StoredRateLimit[], rule: Rule, now: Date): StoredRateLimit[] {
  return rows.filter((row) => {
    if (row.lockedUntil && new Date(row.lockedUntil) > now) return true;
    return now.getTime() - new Date(row.windowStartedAt).getTime() < rule.windowMs;
  });
}

/**
 * Counts one attempt against `key` and says whether it may proceed.
 * Use for anything where even the attempt costs something (an email sent).
 */
export async function consumeQuota(key: string, rule: Rule): Promise<RateLimitVerdict> {
  const now = new Date();

  return mutate((db) => {
    db.rateLimits = prune(db.rateLimits, rule, now);
    const row = db.rateLimits.find((candidate) => candidate.key === key);

    if (!row) {
      db.rateLimits.push({ key, count: 1, windowStartedAt: now.toISOString() });
      return { ok: true, remaining: rule.limit - 1 } as const;
    }

    if (row.lockedUntil && new Date(row.lockedUntil) > now) {
      return { ok: false, retryAfterSeconds: secondsUntil(row.lockedUntil) } as const;
    }

    row.count += 1;
    if (row.count > rule.limit) {
      const until = new Date(now.getTime() + (rule.lockoutMs ?? rule.windowMs));
      row.lockedUntil = until.toISOString();
      return { ok: false, retryAfterSeconds: secondsUntil(row.lockedUntil) } as const;
    }

    return { ok: true, remaining: rule.limit - row.count } as const;
  });
}

/** True while `key` is locked out; cheap and does not count an attempt. */
export async function isLocked(key: string): Promise<RateLimitVerdict> {
  const now = new Date();
  return mutate((db) => {
    const row = db.rateLimits.find((candidate) => candidate.key === key);
    if (row?.lockedUntil && new Date(row.lockedUntil) > now) {
      return { ok: false, retryAfterSeconds: secondsUntil(row.lockedUntil) } as const;
    }
    return { ok: true, remaining: 0 } as const;
  });
}

/** Counts one *failure* against `key`, locking it once the rule is exceeded. */
export async function recordFailure(key: string, rule: Rule): Promise<RateLimitVerdict> {
  return consumeQuota(key, rule);
}

/** Clears the failure count for `key` — called on a successful sign-in. */
export async function clearFailures(key: string): Promise<void> {
  await mutate((db) => {
    db.rateLimits = db.rateLimits.filter((row) => row.key !== key);
  });
}

/**
 * The client's IP, as reported by whatever sits in front of the app.
 *
 * `x-forwarded-for` is a comma-separated chain; the first entry is the
 * client. Headers are spoofable, which is why the email key exists too —
 * on its own this is a speed bump, not a wall.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Phrases a wait in words, for the message the user actually reads. */
export function waitMessage(retryAfterSeconds: number): string {
  const minutes = Math.ceil(retryAfterSeconds / 60);
  if (minutes <= 1) return "Try again in a minute.";
  return `Try again in ${minutes} minutes.`;
}

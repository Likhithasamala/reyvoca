/**
 * Single-use, hashed, expiring tokens — the mechanism behind every link we
 * email: confirm your address, reset your password, confirm a new address.
 *
 * Three rules make these safe, and they are the same three every mature
 * service applies:
 *  - the raw token exists only inside the email link; the database keeps its
 *    SHA-256, so a stolen database cannot be replayed into an account;
 *  - a token is burned the first time it is redeemed, inside the same
 *    transaction that reads it, so a link cannot be used twice;
 *  - issuing a new token for a purpose invalidates the outstanding ones, so
 *    the most recent email is always the only live one.
 */
import { createHash, randomBytes } from "node:crypto";
import { mutate, newId, read, type StoredAuthToken, type TokenPurpose } from "./db";

/** How long each kind of link stays valid. */
const TTL_MINUTES: Record<TokenPurpose, number> = {
  // Long enough to survive "I'll check my email tonight".
  email_verify: 60 * 24,
  // Short: this one is the keys to the account.
  password_reset: 30,
  email_change: 60,
};

export const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

export type IssuedToken = {
  /** The secret that goes in the link — never stored, never logged. */
  token: string;
  expiresAt: string;
};

/**
 * Mints a token for `purpose` and voids any earlier unused one of the same
 * purpose for this user.
 */
export async function issueToken(
  userId: string,
  purpose: TokenPurpose,
  options: { pendingEmail?: string } = {},
): Promise<IssuedToken> {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TTL_MINUTES[purpose] * 60_000);

  await mutate((db) => {
    // Drop this user's earlier links of the same kind, plus anything expired,
    // so the table cannot grow without bound.
    db.authTokens = db.authTokens.filter((row) => {
      if (row.userId === userId && row.purpose === purpose) return false;
      return new Date(row.expiresAt) > now;
    });

    const row: StoredAuthToken = {
      id: newId(),
      userId,
      purpose,
      tokenHash: hashToken(token),
      pendingEmail: options.pendingEmail,
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
    };
    db.authTokens.push(row);
  });

  return { token, expiresAt: expiresAt.toISOString() };
}

export type ConsumeResult =
  | { ok: true; token: StoredAuthToken }
  | { ok: false; reason: "unknown" | "expired" | "used" };

/**
 * Checks a token *without* spending it.
 *
 * The reset page needs this: it has to know the link is good before showing
 * the "new password" form, but the token must still be live when the form is
 * submitted. Redeeming on page load would break the back button and hand a
 * dead link to anyone whose mail client prefetches URLs.
 */
export async function peekToken(raw: string, purpose: TokenPurpose): Promise<ConsumeResult> {
  if (!raw) return { ok: false, reason: "unknown" };
  const tokenHash = hashToken(raw);

  return read((db) => {
    const row = db.authTokens.find(
      (candidate) => candidate.tokenHash === tokenHash && candidate.purpose === purpose,
    );
    if (!row) return { ok: false, reason: "unknown" } as const;
    if (row.usedAt) return { ok: false, reason: "used" } as const;
    if (new Date(row.expiresAt) <= new Date()) return { ok: false, reason: "expired" } as const;
    return { ok: true, token: row } as const;
  });
}

/**
 * Redeems a token: validates it and marks it used in one atomic step, so two
 * simultaneous clicks on the same link cannot both succeed.
 */
export async function consumeToken(raw: string, purpose: TokenPurpose): Promise<ConsumeResult> {
  if (!raw) return { ok: false, reason: "unknown" };
  const tokenHash = hashToken(raw);

  return mutate((db) => {
    const row = db.authTokens.find(
      (candidate) => candidate.tokenHash === tokenHash && candidate.purpose === purpose,
    );
    if (!row) return { ok: false, reason: "unknown" } as const;
    if (row.usedAt) return { ok: false, reason: "used" } as const;
    if (new Date(row.expiresAt) <= new Date()) return { ok: false, reason: "expired" } as const;

    row.usedAt = new Date().toISOString();
    return { ok: true, token: row } as const;
  });
}

/** Human explanation for a link that did not work, shown on the page. */
export function tokenProblemMessage(
  reason: "unknown" | "expired" | "used",
  purpose: TokenPurpose,
): string {
  const thing = purpose === "password_reset" ? "reset link" : "confirmation link";
  if (reason === "expired") return `That ${thing} has expired. Request a new one below.`;
  if (reason === "used") return `That ${thing} has already been used. Request a new one below.`;
  return `That ${thing} is not valid. Request a new one below.`;
}

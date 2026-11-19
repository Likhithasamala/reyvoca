/**
 * Sessions: how Reyvoca remembers who you are between requests.
 *
 * The shape is the one most services settle on, and it is deliberately not a
 * JWT:
 *
 *  - the browser holds an **opaque random token** in an httpOnly cookie, so
 *    page scripts (and anything injected into them) cannot read it;
 *  - the database stores only the token's **SHA-256**, so a leaked database
 *    yields no usable cookies;
 *  - every session is a **row**, which means it can be revoked. "Sign out of
 *    all other devices" is a delete, not a wish — and a stateless token
 *    cannot offer that, which is the whole reason this is server-side state.
 *
 * Two lifetimes, chosen by the "Keep me signed in" tick:
 *  - ticked: a 30-day cookie that survives closing the browser;
 *  - unticked: a session cookie that dies with the browser, and a row that
 *    expires within a day regardless.
 *
 * Each row also carries the device and IP it was created from, so the account
 * page can list where you are signed in and the owner can cut off anything
 * they do not recognise.
 */
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { AccountSummary } from "@/types";
import { mutate, newId, read, type StoredSession, type StoredUser } from "./db";
import { jsonError } from "./http";
import { clientIp } from "./rate-limit";

// Defined in a leaf module so `proxy.ts` can read the name without pulling
// this file (and the store, and node:crypto) into the proxy bundle.
export { SESSION_COOKIE } from "@/lib/auth/cookie";
import { SESSION_COOKIE } from "@/lib/auth/cookie";

/** Lifetime of a "keep me signed in" session. */
const REMEMBER_DAYS = 30;
/** Lifetime of an ordinary one: long enough for a working day. */
const SESSION_HOURS = 24;
/** How stale `lastSeenAt` may get before it is written again. */
const TOUCH_INTERVAL_MS = 15 * 60_000;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** The account shape returned to the client. Never includes the password hash. */
export type SessionUser = AccountSummary;

export function toSessionUser(user: StoredUser): SessionUser {
  const initials = user.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    workspace: user.workspace,
    initials: initials || user.email[0]?.toUpperCase() || "?",
    emailVerified: Boolean(user.emailVerifiedAt),
    avatarUrl: user.avatarUrl,
  };
}

/**
 * Creates a session row and sets the cookie on the outgoing response.
 *
 * Only callable from a route handler or a Server Action: Next.js forbids
 * writing cookies while rendering a page.
 */
export async function createSession(
  userId: string,
  options: { request?: Request; remember?: boolean } = {},
): Promise<void> {
  const remember = options.remember ?? false;
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const maxAge = remember ? REMEMBER_DAYS * 24 * 60 * 60 : SESSION_HOURS * 60 * 60;
  const expiresAt = new Date(now.getTime() + maxAge * 1000);

  await mutate((db) => {
    // Drop expired rows so the file does not grow without bound.
    db.sessions = db.sessions.filter((session) => new Date(session.expiresAt) > now);
    db.sessions.push({
      id: newId(),
      tokenHash: hashToken(token),
      userId,
      createdAt: now.toISOString(),
      lastSeenAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      userAgent: options.request?.headers.get("user-agent")?.slice(0, 200) ?? undefined,
      ip: options.request ? clientIp(options.request) : undefined,
      remember,
    });
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // No maxAge without "keep me signed in": the cookie then dies with the
    // browser, which is what someone on a shared computer expects.
    ...(remember ? { maxAge } : {}),
  });
}

/** Resolves the signed-in account, or null when there is no valid session. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const found = await currentSession();
  return found ? toSessionUser(found.user) : null;
}

/**
 * The session row and its account, for code that needs more than the public
 * summary: the account page, the admin check, password verification.
 */
export async function currentSession(): Promise<{ user: StoredUser; session: StoredSession } | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const found = await read((db) => {
    const session = db.sessions.find((candidate) => candidate.tokenHash === tokenHash);
    if (!session || new Date(session.expiresAt) <= new Date()) return null;
    const user = db.users.find((candidate) => candidate.id === session.userId);
    // A suspended account holds a cookie that no longer opens anything.
    if (!user || user.status === "suspended") return null;
    return { user, session };
  });

  if (found) await touch(found.session);
  return found;
}

/**
 * Records that the session was used, at most once every 15 minutes.
 *
 * The throttle matters: this runs on every authenticated request, and the
 * store is a file. For a remembered session the expiry slides forward too, so
 * someone who uses Reyvoca daily is never signed out mid-work, while an
 * abandoned session still lapses on schedule.
 */
async function touch(session: StoredSession): Promise<void> {
  const now = Date.now();
  const last = session.lastSeenAt ? new Date(session.lastSeenAt).getTime() : 0;
  if (now - last < TOUCH_INTERVAL_MS) return;

  await mutate((db) => {
    const row = db.sessions.find((candidate) => candidate.id === session.id);
    if (!row) return;
    row.lastSeenAt = new Date(now).toISOString();
    if (row.remember) {
      row.expiresAt = new Date(now + REMEMBER_DAYS * 24 * 60 * 60 * 1000).toISOString();
    }
  });
}

/**
 * Gate for authenticated API routes: the account, or a 401 to return.
 *
 * Checking here rather than trusting the proxy is the point. The proxy makes
 * an optimistic guess from the cookie; this is the lock.
 */
export async function requireUser(): Promise<
  { ok: true; user: StoredUser; session: StoredSession } | { ok: false; response: Response }
> {
  const found = await currentSession();
  if (!found) {
    return { ok: false, response: jsonError("unauthorized", "Sign in to continue.", 401) };
  }
  return { ok: true, ...found };
}

/** Deletes the current session row and clears the cookie. */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const tokenHash = hashToken(token);
    await mutate((db) => {
      db.sessions = db.sessions.filter((session) => session.tokenHash !== tokenHash);
    });
  }
  cookieStore.delete(SESSION_COOKIE);
}

/** One row of the "where you are signed in" list. */
export type SessionDevice = {
  id: string;
  /** True for the session making this request, which cannot be revoked. */
  current: boolean;
  device: string;
  ip?: string;
  createdAt: string;
  lastSeenAt?: string;
  remember: boolean;
};

/**
 * Turns a raw User-Agent into something a person recognises.
 *
 * Deliberately crude. Parsing user agents properly is a losing game, and the
 * only question being answered is "do I recognise this device?".
 */
export function describeDevice(userAgent: string | undefined): string {
  if (!userAgent) return "Unknown device";
  const ua = userAgent.toLowerCase();

  const platform = ua.includes("android")
    ? "Android"
    : /iphone|ipad|ipod/.test(ua)
      ? "iOS"
      : ua.includes("mac os")
        ? "macOS"
        : ua.includes("windows")
          ? "Windows"
          : ua.includes("linux")
            ? "Linux"
            : "an unknown system";

  // Order matters: Edge and Chrome both claim to be Safari, Edge claims Chrome.
  const browser = ua.includes("edg/")
    ? "Edge"
    : ua.includes("opr/") || ua.includes("opera")
      ? "Opera"
      : ua.includes("firefox")
        ? "Firefox"
        : ua.includes("chrome")
          ? "Chrome"
          : ua.includes("safari")
            ? "Safari"
            : "A browser";

  return `${browser} on ${platform}`;
}

/** Every live session for an account, newest first. */
export async function listSessions(userId: string): Promise<SessionDevice[]> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const currentHash = token ? hashToken(token) : null;
  const now = new Date();

  return read((db) =>
    db.sessions
      .filter((row) => row.userId === userId && new Date(row.expiresAt) > now)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map((row) => ({
        id: row.id,
        current: row.tokenHash === currentHash,
        device: describeDevice(row.userAgent),
        ip: row.ip,
        createdAt: row.createdAt,
        lastSeenAt: row.lastSeenAt,
        remember: Boolean(row.remember),
      })),
  );
}

/** Revokes one named session. Returns false when it is not this user's. */
export async function revokeSession(userId: string, sessionId: string): Promise<boolean> {
  return mutate((db) => {
    const before = db.sessions.length;
    db.sessions = db.sessions.filter((row) => !(row.id === sessionId && row.userId === userId));
    return db.sessions.length < before;
  });
}

/**
 * Signs the account out everywhere except, optionally, the session asking.
 *
 * Called on every password change and password reset. That is not politeness:
 * if someone else had the old password, their cookie must stop working the
 * moment the password does.
 */
export async function revokeOtherSessions(userId: string, keepSessionId?: string): Promise<number> {
  return mutate((db) => {
    const before = db.sessions.length;
    db.sessions = db.sessions.filter(
      (row) => row.userId !== userId || (keepSessionId !== undefined && row.id === keepSessionId),
    );
    return before - db.sessions.length;
  });
}

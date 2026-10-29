/**
 * Session issuing and lookup. The browser holds an opaque random token in an
 * httpOnly cookie; the database stores only its SHA-256 hash.
 */
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { AccountSummary } from "@/types";
import { mutate, read, type StoredUser } from "./db";

export const SESSION_COOKIE = "reyvoca_session";

const SESSION_DAYS = 30;
const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;

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
  };
}

/** Creates a session row and sets the cookie on the outgoing response. */
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE * 1000);

  await mutate((db) => {
    // Drop expired rows so the file does not grow without bound.
    db.sessions = db.sessions.filter((session) => new Date(session.expiresAt) > now);
    db.sessions.push({
      tokenHash: hashToken(token),
      userId,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/** Resolves the signed-in account, or null when there is no valid session. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const user = await read((db) => {
    const session = db.sessions.find((candidate) => candidate.tokenHash === tokenHash);
    if (!session || new Date(session.expiresAt) <= new Date()) return null;
    return db.users.find((candidate) => candidate.id === session.userId) ?? null;
  });

  return user ? toSessionUser(user) : null;
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

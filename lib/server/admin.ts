/**
 * Who may see and change the provider stack.
 *
 * Providers are a Reyvoca operations concern, not a customer-facing one: the
 * dashboard never names the LLM / STT / TTS vendors behind an agent, and only
 * an operator signed in to the admin panel can add, replace or delete a key.
 *
 * Who counts as an operator:
 *  - any account whose stored `role` is "admin";
 *  - any account whose email is listed in `REYVOCA_ADMIN_EMAILS`
 *    (comma-separated, case-insensitive);
 *  - in development only, and only while that variable is unset, whoever is
 *    using the machine — the local dashboard is open anyway, and the keys have
 *    to be configurable before the first account exists.
 *
 * In production with no `REYVOCA_ADMIN_EMAILS` set, nobody is an operator and
 * `/admin` answers 404. That is the safe default: configure the variable to
 * open it.
 */
import { jsonError } from "./http";
import { getSessionUser, type SessionUser } from "./session";
import { read } from "./db";

/** Emails allowed into the admin panel, lowercased. */
export function adminEmails(): string[] {
  return (process.env.REYVOCA_ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

/** True when the admin panel is open to the local machine without an account. */
export function adminOpenInDev(): boolean {
  return process.env.NODE_ENV !== "production" && adminEmails().length === 0;
}

export function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.trim().toLowerCase());
}

/** The signed-in operator, plus whether this request may administer providers. */
export async function currentAdmin(): Promise<{ isAdmin: boolean; user: SessionUser | null }> {
  const user = await getSessionUser();

  if (user) {
    const stored = await read((db) => db.users.find((row) => row.id === user.id) ?? null);
    if (stored?.role === "admin" || isAdminEmail(user.email)) return { isAdmin: true, user };
    // A signed-in customer is never an operator, even on a dev machine.
    return { isAdmin: false, user };
  }

  return { isAdmin: adminOpenInDev(), user: null };
}

export async function isAdminRequest(): Promise<boolean> {
  return (await currentAdmin()).isAdmin;
}

/**
 * Gate for provider API routes: returns a 403 response to send back, or null
 * when the request may proceed.
 */
export async function adminGate(): Promise<Response | null> {
  if (await isAdminRequest()) return null;
  return jsonError("forbidden", "This is managed by Reyvoca.", 403);
}

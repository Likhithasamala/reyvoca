/**
 * The security log for one account.
 *
 * Every sign-in, failed attempt, password change and session revocation is
 * recorded, and the owner sees their own entries on `/account`. This is the
 * "recent security activity" list other services show, and it is the cheapest
 * way for someone to notice a sign-in that was not them.
 *
 * Entries carry the IP and user agent of the request, never anything from the
 * credentials themselves. Nothing here is secret, so nothing here needs
 * hashing — but it is also never shown to anyone but the account owner.
 */
import { mutate, newId, read, type StoredAuthEvent } from "./db";
import { clientIp } from "./rate-limit";

/** Keep the log bounded; this is a trail, not an archive. */
const MAX_EVENTS = 400;

export async function logAuthEvent(
  type: StoredAuthEvent["type"],
  details: { userId?: string; email?: string; request?: Request },
): Promise<void> {
  const { request } = details;
  await mutate((db) => {
    db.authEvents.unshift({
      id: newId(),
      userId: details.userId,
      email: details.email,
      type,
      ip: request ? clientIp(request) : undefined,
      // Truncated: a user agent is long, and only the device name is useful.
      userAgent: request?.headers.get("user-agent")?.slice(0, 200) ?? undefined,
      at: new Date().toISOString(),
    });
    db.authEvents = db.authEvents.slice(0, MAX_EVENTS);
  });
}

/** The most recent events for one account, newest first. */
export async function recentAuthEvents(userId: string, limit = 10): Promise<StoredAuthEvent[]> {
  return read((db) => db.authEvents.filter((row) => row.userId === userId).slice(0, limit));
}

/** What each event type is called in the interface. */
export const AUTH_EVENT_LABELS: Record<StoredAuthEvent["type"], string> = {
  signed_up: "Account created",
  signed_in: "Signed in",
  sign_in_failed: "Failed sign-in attempt",
  signed_out: "Signed out",
  email_verified: "Email address confirmed",
  password_reset_requested: "Password reset requested",
  password_reset: "Password reset from a link",
  password_changed: "Password changed",
  email_change_requested: "Email change requested",
  email_changed: "Email address changed",
  sessions_revoked: "Signed out of other devices",
  account_deleted: "Account deleted",
  google_linked: "Google account linked",
};

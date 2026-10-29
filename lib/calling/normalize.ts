/**
 * Pure normalisation and validation helpers.
 *
 * No "use client" and no Node imports, so the same rules run in the browser
 * (CSV parsing, form feedback) and on the server (the authority on what is
 * actually stored). A lead can only be rejected for a reason defined here.
 */
import type { LeadSource } from "@/types/calling";

/** Strips formatting so two spellings of one number compare equal. */
export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return hasPlus ? `+${digits}` : digits;
}

/**
 * Deliberately permissive: Reyvoca calls many countries, so this rejects only
 * what cannot be a phone number. Carrier-level validation belongs to the
 * telephony provider at dial time.
 */
export function isValidPhone(raw: string): boolean {
  const digits = normalizePhone(raw).replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

export function isValidEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim());
}

/** Maps an arbitrary source string from an integration onto our enum. */
export function normalizeSource(raw: string | undefined): LeadSource {
  const value = (raw ?? "").toLowerCase().replace(/[\s-]/g, "_");
  const known: Record<string, LeadSource> = {
    webhook: "webhook",
    website: "website_form",
    website_form: "website_form",
    form: "website_form",
    meta: "meta_lead_ads",
    meta_lead_ads: "meta_lead_ads",
    facebook: "meta_lead_ads",
    instagram: "meta_lead_ads",
    crm: "crm",
    api: "api",
    csv: "csv_upload",
    csv_upload: "csv_upload",
  };
  return known[value] ?? "custom";
}

/** Turns a structured outcome into the one-line next action shown in tables. */
export function describeNextAction(outcome: {
  outcome: string;
  doNotCall?: boolean;
  meetingRequested?: boolean;
  callbackRequested?: boolean;
  callbackAt?: string;
}): string {
  if (outcome.doNotCall) return "Do not call";
  if (outcome.meetingRequested) return "Meeting booked";
  if (outcome.callbackRequested) {
    return outcome.callbackAt
      ? `Call back ${new Date(outcome.callbackAt).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        })}`
      : "Callback requested";
  }
  switch (outcome.outcome) {
    case "qualified":
      return "Hand to sales";
    case "interested":
      return "Send information";
    case "no_answer":
      return "Retry later";
    case "wrong_number":
      return "Verify contact";
    case "not_interested":
      return "—";
    default:
      return "Review";
  }
}

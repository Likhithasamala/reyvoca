/**
 * Credit formatting shared by the dashboard and the operator panel.
 *
 * 1 credit = ₹1. Amounts travel as integer paise so sums never drift; these
 * helpers are the only place they become text.
 */

/** 650 → "6.50"; whole amounts keep two decimals so columns line up. */
export function formatCredits(paise: number): string {
  const value = paise / 100;
  return value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** 100000 → "1,000", 650 → "6.50": drops ".00" on whole amounts (credit packs). */
export function formatCreditsShort(paise: number): string {
  return paise % 100 === 0 ? (paise / 100).toLocaleString("en-IN") : formatCredits(paise);
}

/** 650 → "₹6.50". */
export function formatRupees(paise: number): string {
  return `₹${formatCredits(paise)}`;
}

/** Seconds → "m:ss", or "h:mm:ss" past an hour. */
export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = String(seconds % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

/** Parses "6.5" / "₹1,000" typed by an operator into paise; null if invalid. */
export function parseRupeesToPaise(input: string): number | null {
  const cleaned = input.replace(/[₹,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100);
}

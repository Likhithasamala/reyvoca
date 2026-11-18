import { adminGate, currentAdmin } from "@/lib/server/admin";
import { mutate } from "@/lib/server/db";
import { jsonError, jsonOk, readJson } from "@/lib/server/http";

/** Upper bound per minute, to catch a typo like 3500 for ₹35.00. */
const MAX_PER_MINUTE_PAISE = 100_00;

/**
 * PUT /api/admin/billing/pricing — { sarvamPerMinutePaise, marginPerMinutePaise }.
 * New prices apply to calls started afterwards; calls in progress keep theirs.
 */
export async function PUT(request: Request) {
  const denied = await adminGate();
  if (denied) return denied;
  const body = await readJson(request);
  if (!body) return jsonError("bad_request", "Expected a JSON body.", 400);

  const sarvam = Number(body.sarvamPerMinutePaise);
  const margin = Number(body.marginPerMinutePaise);
  const valid = (value: number) => Number.isInteger(value) && value >= 0 && value <= MAX_PER_MINUTE_PAISE;
  if (!valid(sarvam) || sarvam === 0) {
    return jsonError("validation_error", "Enter Sarvam's per-minute rate, between ₹0.01 and ₹100.", 400);
  }
  if (!valid(margin)) {
    return jsonError("validation_error", "Enter a margin between ₹0 and ₹100 per minute.", 400);
  }

  const { user } = await currentAdmin();
  const pricing = await mutate((db) => {
    db.pricing = {
      sarvamPerMinutePaise: sarvam,
      marginPerMinutePaise: margin,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.email,
    };
    return db.pricing;
  });
  return jsonOk({ pricing });
}

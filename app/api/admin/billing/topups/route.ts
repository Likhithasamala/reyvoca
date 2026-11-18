import { adminGate, currentAdmin } from "@/lib/server/admin";
import { mutate } from "@/lib/server/db";
import { asString, jsonError, jsonOk, readJson } from "@/lib/server/http";
import { postLedger } from "@/lib/server/billing";
import { DEV_WORKSPACE_ID } from "@/lib/server/workspace";

const MAX_TOPUP_PAISE = 10_00_000_00; // ₹10 lakh in one entry

/**
 * POST /api/admin/billing/topups — { workspaceId, amountPaise, note }.
 *
 * Manual credit top-up after the customer has paid offline. Pass the
 * optional `requestId` to mark the customer's credit request fulfilled. A negative amount
 * is an adjustment (e.g. reversing a mistaken top-up). Every entry is kept in
 * the ledger with the operator's email.
 */
export async function POST(request: Request) {
  const denied = await adminGate();
  if (denied) return denied;
  const body = await readJson(request);
  if (!body) return jsonError("bad_request", "Expected a JSON body.", 400);

  const workspaceId = asString(body.workspaceId).trim();
  const amount = Number(body.amountPaise);
  const note = asString(body.note).trim().slice(0, 140);
  const requestId = asString(body.requestId).trim();
  if (!workspaceId) return jsonError("validation_error", "Choose a workspace.", 400);
  if (!Number.isInteger(amount) || amount === 0 || Math.abs(amount) > MAX_TOPUP_PAISE) {
    return jsonError("validation_error", "Enter an amount between ₹0.01 and ₹10,00,000.", 400);
  }

  const { user } = await currentAdmin();
  const entry = await mutate((db) => {
    const exists = workspaceId === DEV_WORKSPACE_ID || db.users.some((row) => row.id === workspaceId);
    if (!exists) return null;
    if (requestId) {
      const pending = db.topupRequests.find(
        (row) => row.id === requestId && row.workspaceId === workspaceId && row.status === "pending",
      );
      if (pending) {
        pending.status = "fulfilled";
        pending.resolvedAt = new Date().toISOString();
        pending.resolvedBy = user?.email ?? "operator (local)";
      }
    }
    return postLedger(db, {
      workspaceId,
      type: amount > 0 ? "topup" : "adjustment",
      amountPaise: amount,
      note: note || (amount > 0 ? "Credits added" : "Credits removed"),
      createdBy: user?.email ?? "operator (local)",
    });
  });
  if (!entry) return jsonError("validation_error", "That workspace does not exist.", 400);
  return jsonOk({ entry }, 201);
}

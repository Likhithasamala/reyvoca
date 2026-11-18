import { mutate, newId } from "@/lib/server/db";
import { jsonError, jsonOk, readJson } from "@/lib/server/http";
import { CREDIT_PACKS_PAISE } from "@/lib/server/billing";
import { currentWorkspaceId } from "@/lib/server/workspace";

/** Open requests one workspace may have at once. */
const MAX_PENDING = 3;

/**
 * POST /api/billing/topup-requests — { amountPaise } (one of the credit packs).
 * Asks Reyvoca for credits; an operator adds them once payment is received.
 */
export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return jsonError("bad_request", "Expected a JSON body.", 400);
  const amount = Number(body.amountPaise);
  if (!CREDIT_PACKS_PAISE.includes(amount)) {
    return jsonError("validation_error", "Choose one of the credit packs.", 400);
  }

  const workspaceId = await currentWorkspaceId();
  const created = await mutate((db) => {
    const pending = db.topupRequests.filter((row) => row.workspaceId === workspaceId && row.status === "pending");
    if (pending.length >= MAX_PENDING) return null;
    const row = {
      id: newId(),
      workspaceId,
      amountPaise: amount,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
    };
    db.topupRequests.push(row);
    return row;
  });
  if (!created) {
    return jsonError(
      "validation_error",
      `You already have ${MAX_PENDING} requests waiting. We'll add those credits as soon as payment is confirmed.`,
      409,
    );
  }
  const { id, amountPaise, status, createdAt } = created;
  return jsonOk({ request: { id, amountPaise, status, createdAt } }, 201);
}

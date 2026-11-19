import { logAuthEvent } from "@/lib/server/audit";
import { sendPasswordResetEmail } from "@/lib/server/auth-mail";
import { read } from "@/lib/server/db";
import { asString, jsonError, jsonOk, readJson } from "@/lib/server/http";
import { sameOriginGate } from "@/lib/server/origin";
import { clientIp, consumeQuota, RULES, waitMessage } from "@/lib/server/rate-limit";
import { validateEmail } from "@/lib/validation";

/**
 * POST /api/auth/password-reset — emails a one-time reset link.
 *
 * The endpoint answers identically whether or not an account exists, and
 * takes the same amount of work either way as far as the caller can tell.
 * That is the whole design: "no account found" here would turn the form into
 * a tool for checking which of a list of addresses bank with Reyvoca.
 *
 * It is throttled on the address *and* the IP, because each accepted request
 * sends mail to someone who may not have asked for it.
 */
export async function POST(request: Request) {
  const blocked = sameOriginGate(request);
  if (blocked) return blocked;

  const body = await readJson(request);
  if (!body) return jsonError("bad_request", "Expected a JSON body.", 400);

  const email = asString(body.email).trim().toLowerCase();
  const problem = validateEmail(email);
  if (problem) return jsonError("validation_error", problem, 400);

  const perEmail = await consumeQuota(`reset:email:${email}`, RULES.passwordResetEmail);
  const perIp = await consumeQuota(`reset:ip:${clientIp(request)}`, RULES.passwordResetEmail);
  if (!perEmail.ok || !perIp.ok) {
    const retry = !perEmail.ok ? perEmail.retryAfterSeconds : (perIp as { retryAfterSeconds: number }).retryAfterSeconds;
    return jsonError("validation_error", `Too many reset emails requested. ${waitMessage(retry)}`, 429);
  }

  const user = await read((db) => db.users.find((candidate) => candidate.email === email) ?? null);

  if (user && user.status !== "suspended") {
    await sendPasswordResetEmail(request, user);
    await logAuthEvent("password_reset_requested", { userId: user.id, email, request });
  }

  // Always the same answer, so the endpoint cannot enumerate accounts.
  return jsonOk({});
}

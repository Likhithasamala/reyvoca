import { read } from "@/lib/server/db";
import { asString, jsonError, jsonOk, readJson } from "@/lib/server/http";
import { validateEmail } from "@/lib/validation";

/** POST /api/auth/password-reset — accepts a reset request. */
export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return jsonError("bad_request", "Expected a JSON body.", 400);

  const email = asString(body.email).trim().toLowerCase();
  const problem = validateEmail(email);
  if (problem) return jsonError("validation_error", problem, 400);

  const exists = await read((db) => db.users.some((user) => user.email === email));
  if (exists) {
    // Email delivery arrives with the mail provider in a later phase. Logging
    // the request keeps the endpoint honest rather than pretending a send.
    console.info(`[reyvoca] password reset requested for ${email} — no mail provider configured yet.`);
  }

  // Always the same answer, so the endpoint cannot be used to enumerate accounts.
  return jsonOk({});
}

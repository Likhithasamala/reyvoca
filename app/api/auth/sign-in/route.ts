import { routes } from "@/config/site";
import { read } from "@/lib/server/db";
import { asString, jsonError, jsonOk, readJson } from "@/lib/server/http";
import { verifyPassword } from "@/lib/server/password";
import { createSession, toSessionUser } from "@/lib/server/session";

/** POST /api/auth/sign-in — verifies credentials and starts a session. */
export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return jsonError("bad_request", "Expected a JSON body.", 400);

  const email = asString(body.email).trim().toLowerCase();
  const password = asString(body.password);
  if (!email || !password) {
    return jsonError("validation_error", "Enter your email and password.", 400);
  }

  const user = await read((db) => db.users.find((candidate) => candidate.email === email) ?? null);
  // Same message whether the email or the password was wrong, so the response
  // does not reveal which emails have accounts.
  const invalid = jsonError("invalid_credentials", "Incorrect email or password.", 401);
  if (!user) return invalid;
  if (!(await verifyPassword(password, user.passwordHash))) return invalid;

  await createSession(user.id);
  return jsonOk({ user: toSessionUser(user), redirectTo: routes.requests });
}

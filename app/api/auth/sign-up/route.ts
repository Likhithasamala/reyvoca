import { routes } from "@/config/site";
import { mutate, newId, type StoredUser } from "@/lib/server/db";
import { asString, jsonError, jsonOk, readJson } from "@/lib/server/http";
import { hashPassword } from "@/lib/server/password";
import { createSession, toSessionUser } from "@/lib/server/session";
import { MIN_PASSWORD_LENGTH, validateEmail, validateRequired } from "@/lib/validation";

/** POST /api/auth/sign-up — creates an account and signs the new user in. */
export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return jsonError("bad_request", "Expected a JSON body.", 400);

  const fullName = asString(body.fullName).trim();
  const email = asString(body.email).trim().toLowerCase();
  const workspace = asString(body.workspace).trim();
  const password = asString(body.password);
  const acceptedTerms = body.acceptedTerms === true;

  // The client validates too; the server never trusts that it did.
  const problem =
    validateRequired(fullName, "full name") ??
    validateEmail(email) ??
    validateRequired(workspace, "company or workspace name") ??
    (password.length < MIN_PASSWORD_LENGTH
      ? `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`
      : undefined) ??
    (acceptedTerms ? undefined : "Please accept the terms to continue.");
  if (problem) return jsonError("validation_error", problem, 400);

  const passwordHash = await hashPassword(password);

  const created = await mutate((db) => {
    if (db.users.some((user) => user.email === email)) return null;
    const user: StoredUser = {
      id: newId(),
      fullName,
      email,
      workspace,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    return user;
  });

  if (!created) {
    return jsonError("email_taken", "An account already exists for that email. Try signing in instead.", 409);
  }

  await createSession(created.id);
  return jsonOk({ user: toSessionUser(created), redirectTo: routes.requests }, 201);
}

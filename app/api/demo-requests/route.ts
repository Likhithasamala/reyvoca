import { mutate, newId, read, type StoredDemoRequest } from "@/lib/server/db";
import { asString, jsonError, jsonOk, readJson } from "@/lib/server/http";
import { getSessionUser } from "@/lib/server/session";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Digits, allowing the usual separators and an optional country prefix. */
const PHONE_PATTERN = /^\+?[\d\s()-]{7,20}$/;

/**
 * POST /api/demo-requests — a "Book a demo" enquiry from the public site.
 *
 * Open to anyone, because it is the public contact form. The reply says only
 * that the enquiry was received; it never reports whether the email or phone
 * is already on file.
 */
export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body) return jsonError("bad_request", "Expected a JSON body.", 400);

  const name = asString(body.name).trim();
  const company = asString(body.company).trim();
  const phone = asString(body.phone).trim();
  const email = asString(body.email).trim().toLowerCase();
  const message = asString(body.message).trim();

  if (!name) return jsonError("validation_error", "Enter your name.", 400);
  if (!company) return jsonError("validation_error", "Enter your company name.", 400);
  if (!PHONE_PATTERN.test(phone)) {
    return jsonError("validation_error", "Enter a phone number we can call you on.", 400);
  }
  if (!EMAIL_PATTERN.test(email)) {
    return jsonError("validation_error", "Enter a valid email address.", 400);
  }

  const entry: StoredDemoRequest = {
    id: newId(),
    name,
    company,
    phone,
    email,
    message: message || undefined,
    status: "new",
    createdAt: new Date().toISOString(),
  };

  await mutate((db) => {
    db.demoRequests.unshift(entry);
  });

  return jsonOk({ id: entry.id }, 201);
}

/** GET /api/demo-requests — the enquiry list, for the signed-in operator only. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("unauthorized", "Sign in to view demo requests.", 401);

  const requests = await read((db) => db.demoRequests);
  return jsonOk({ requests });
}

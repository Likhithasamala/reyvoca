/**
 * Request origin: where this request came from, and where this app lives.
 *
 * Two jobs:
 *  - **CSRF defence.** The session cookie is `sameSite=lax`, which already
 *    stops a form on another site from POSTing as the signed-in user. This
 *    adds the second check every framework recommends: compare the `Origin`
 *    header against the host actually serving the request, and refuse a
 *    mismatch. Cheap, and it closes the gap if the cookie policy is ever
 *    loosened.
 *  - **Absolute links.** Emailed links must be absolute. They are built from
 *    the request's own host where there is one, so a link works on
 *    `localhost:3000`, on a preview URL and in production without
 *    configuration — falling back to `NEXT_PUBLIC_SITE_URL`.
 */
import { jsonError } from "./http";

/** The scheme + host this request was served on. */
export function requestOrigin(request: Request): string {
  const headers = request.headers;
  // Set by Vercel and most reverse proxies; `host` is the direct case.
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!host) return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const proto = headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** An absolute URL for `path` ("/reset-password?token=…"), safe to email. */
export function absoluteUrl(request: Request, path: string): string {
  return new URL(path, `${requestOrigin(request)}/`).toString();
}

/**
 * Gate for every state-changing auth route: returns a response to send back
 * when the request did not come from this site, or null to proceed.
 *
 * A missing `Origin` is allowed, because non-browser clients (curl, a mobile
 * app, a server-to-server call) do not send one, and browsers always do on a
 * cross-site POST — which is the case being defended against.
 */
export function sameOriginGate(request: Request): Response | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;

  const expected = requestOrigin(request);
  if (origin === expected) return null;

  // Hosts match but schemes differ behind a proxy that did not forward proto.
  try {
    if (new URL(origin).host === new URL(expected).host) return null;
  } catch {
    // Unparseable Origin: treat as a mismatch.
  }

  return jsonError("forbidden", "This request did not come from Reyvoca.", 403);
}

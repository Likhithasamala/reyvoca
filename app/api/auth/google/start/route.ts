import { cookies } from "next/headers";
import { routes } from "@/config/site";
import { absoluteUrl } from "@/lib/server/origin";
import {
  authorizeUrl,
  GOOGLE_CALLBACK_PATH,
  googleConfigured,
  OAUTH_COOKIE,
  OAUTH_COOKIE_MAX_AGE,
  startFlow,
} from "@/lib/server/oauth/google";

/**
 * GET /api/auth/google/start — begins Google sign-in.
 *
 * The random `state`, `nonce` and PKCE verifier are kept in an httpOnly
 * cookie rather than on the server. They are useless to anyone who cannot
 * also complete the redirect, they expire in ten minutes, and keeping them
 * client-side means the flow works identically across server restarts and
 * across several instances.
 *
 * `?next=` is carried through the round trip so someone who was sent to sign
 * in from a particular page lands back on it. Only same-site paths are
 * accepted: an absolute URL here would make this endpoint an open redirect.
 */
export async function GET(request: Request) {
  if (!googleConfigured()) {
    return Response.redirect(absoluteUrl(request, `${routes.signIn}?status=google_unconfigured`), 303);
  }

  const requested = new URL(request.url).searchParams.get("next") ?? routes.requests;
  const next = requested.startsWith("/") && !requested.startsWith("//") ? requested : routes.requests;

  const flow = startFlow(next);
  const cookieStore = await cookies();
  cookieStore.set(OAUTH_COOKIE, JSON.stringify(flow), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: OAUTH_COOKIE_MAX_AGE,
  });

  return Response.redirect(authorizeUrl(flow, absoluteUrl(request, GOOGLE_CALLBACK_PATH)), 303);
}

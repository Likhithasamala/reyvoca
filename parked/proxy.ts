import { NextResponse, type NextRequest } from "next/server";
import { routes } from "@/config/site";
import { SESSION_COOKIE } from "@/lib/auth/cookie";

/**
 * Edge gate for signed-in and signed-out routes.
 *
 * (In Next.js 16 this file is `proxy.ts`; `middleware.ts` is the deprecated
 * name for the same thing.)
 *
 * This is an **optimistic** check and nothing more: it asks whether a session
 * cookie is present, never whether it is valid. That is on purpose — this
 * runs on every request, including prefetches, so it must not touch the
 * database. A forged cookie gets past this and is then rejected by the page
 * or the API route, which do look the session up. The real locks are
 * `requireUser()` in `lib/server/session.ts` and the `redirect()` in each
 * protected page; this only saves a render and keeps the URL tidy.
 */

/** Pages that require an account. */
const PROTECTED = [routes.requests, routes.account];

/** Pages that only make sense signed out. */
const SIGNED_OUT_ONLY = [routes.signIn, routes.getStarted, routes.forgotPassword];

export function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;
  const signedIn = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (!signedIn && PROTECTED.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    const signIn = new URL(routes.signIn, request.nextUrl);
    // Remember where they were headed so signing in finishes the journey
    // instead of dumping them on the default page.
    signIn.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(signIn);
  }

  if (signedIn && SIGNED_OUT_ONLY.some((route) => pathname === route)) {
    return NextResponse.redirect(new URL(routes.requests, request.nextUrl));
  }

  // A reset link is honoured even while signed in — someone resetting a
  // password they have forgotten may well still have a live session — but
  // the bare page with no token has nothing to offer them.
  if (signedIn && pathname === routes.resetPassword && !searchParams.get("token")) {
    return NextResponse.redirect(new URL(routes.account, request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  /**
   * Everything except API routes, Next's internals and static files. API
   * routes do their own checks and must be able to answer 401 rather than
   * redirect, and matching static assets here would block CSS and images.
   */
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|mp4|webm|woff2?)$).*)"],
};

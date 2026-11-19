import { cookies } from "next/headers";
import { routes } from "@/config/site";
import { logAuthEvent } from "@/lib/server/audit";
import { mutate, newId, type StoredUser } from "@/lib/server/db";
import { absoluteUrl } from "@/lib/server/origin";
import {
  exchangeCode,
  GOOGLE_CALLBACK_PATH,
  googleConfigured,
  OAUTH_COOKIE,
  type OAuthFlow,
  workspaceNameFor,
} from "@/lib/server/oauth/google";
import { createSession } from "@/lib/server/session";

/**
 * GET /api/auth/google/callback — the other half of Google sign-in.
 *
 * Three cases come out of a successful exchange, and all three are normal:
 *
 *  - **known Google account** → sign in;
 *  - **known email, no Google link yet** → link them. This is the case that
 *    matters: someone who signed up with a password and later clicks the
 *    Google button must land in their existing workspace, not a duplicate.
 *    It is only safe because Google asserts the address is verified, which
 *    `exchangeCode` insists on;
 *  - **new to us** → create an account, already confirmed, with a workspace
 *    name guessed from the email domain.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const failure = (status: string) =>
    Response.redirect(absoluteUrl(request, `${routes.signIn}?status=${status}`), 303);

  if (!googleConfigured()) return failure("google_unconfigured");

  const cookieStore = await cookies();
  const raw = cookieStore.get(OAUTH_COOKIE)?.value;
  // Single-use: the flow cookie goes whatever the outcome.
  cookieStore.delete(OAUTH_COOKIE);

  // The person pressed "cancel" on Google's screen.
  const googleError = url.searchParams.get("error");
  if (googleError) return failure(googleError === "access_denied" ? "google_cancelled" : "google_failed");

  if (!raw) return failure("google_expired");

  let flow: OAuthFlow;
  try {
    flow = JSON.parse(raw) as OAuthFlow;
  } catch {
    return failure("google_failed");
  }

  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  // The CSRF check: a code from somebody else's flow has somebody else's state.
  if (!state || !code || state !== flow.state) return failure("google_state");

  const exchanged = await exchangeCode(code, flow, absoluteUrl(request, GOOGLE_CALLBACK_PATH));
  if (!exchanged.ok) return failure("google_failed");

  const { identity } = exchanged;
  const now = new Date().toISOString();

  const { user, created, linked } = await mutate((db) => {
    const byGoogle = db.users.find((row) => row.googleId === identity.sub);
    if (byGoogle) {
      // Keep the picture fresh; the name is the user's to edit, so leave it.
      byGoogle.avatarUrl = identity.picture ?? byGoogle.avatarUrl;
      return { user: byGoogle, created: false, linked: false };
    }

    const byEmail = db.users.find((row) => row.email === identity.email);
    if (byEmail) {
      byEmail.googleId = identity.sub;
      byEmail.avatarUrl ??= identity.picture;
      byEmail.emailVerifiedAt ??= now;
      return { user: byEmail, created: false, linked: true };
    }

    const fresh: StoredUser = {
      id: newId(),
      fullName: identity.name,
      email: identity.email,
      workspace: workspaceNameFor(identity),
      // No password: this account signs in with Google until it sets one
      // through the reset flow.
      passwordHash: null,
      googleId: identity.sub,
      avatarUrl: identity.picture,
      // Google has already proved the address, so no confirmation email.
      emailVerifiedAt: now,
      status: "active",
      createdAt: now,
    };
    db.users.push(fresh);
    return { user: fresh, created: true, linked: false };
  });

  if (user.status === "suspended") return failure("suspended");

  // Google sign-in is deliberately a remembered session: the whole appeal is
  // not being asked again.
  await createSession(user.id, { request, remember: true });
  await logAuthEvent(created ? "signed_up" : linked ? "google_linked" : "signed_in", {
    userId: user.id,
    email: user.email,
    request,
  });

  return Response.redirect(absoluteUrl(request, flow.next || routes.requests), 303);
}

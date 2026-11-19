import { routes } from "@/config/site";
import { logAuthEvent } from "@/lib/server/audit";
import { sendVerificationEmail } from "@/lib/server/auth-mail";
import { mutate } from "@/lib/server/db";
import { jsonError, jsonOk } from "@/lib/server/http";
import { absoluteUrl, sameOriginGate } from "@/lib/server/origin";
import { consumeQuota, RULES, waitMessage } from "@/lib/server/rate-limit";
import { currentSession, requireUser } from "@/lib/server/session";
import { consumeToken } from "@/lib/server/tokens";

/**
 * GET /api/auth/verify-email?token=… — redeems the link from the email.
 *
 * This is a route handler, not a page, for two reasons: Next.js prefetches
 * page links but not these, and redeeming here means the browser ends up on
 * a clean URL with no token in the address bar or the history.
 *
 * It is safe for this to be a GET that changes state. The only thing a link
 * follower can achieve — including a mail client that fetches links to
 * preview them — is confirming an address inside that same mailbox, which is
 * exactly what the link is for.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const result = await consumeToken(token, "email_verify");

  if (!result.ok) {
    return Response.redirect(
      absoluteUrl(request, `${routes.verifyEmail}?status=${result.reason}`),
      303,
    );
  }

  const user = await mutate((db) => {
    const row = db.users.find((candidate) => candidate.id === result.token.userId);
    if (!row) return null;
    row.emailVerifiedAt = new Date().toISOString();
    return row;
  });

  if (!user) {
    return Response.redirect(absoluteUrl(request, `${routes.verifyEmail}?status=unknown`), 303);
  }

  await logAuthEvent("email_verified", { userId: user.id, email: user.email, request });

  // Signed in: carry straight on. Signed out (they confirmed from a phone,
  // say): the sign-in page, with a line saying it worked.
  const session = await currentSession();
  const destination = session
    ? `${routes.requests}?verified=1`
    : `${routes.signIn}?status=verified`;
  return Response.redirect(absoluteUrl(request, destination), 303);
}

/**
 * POST /api/auth/verify-email — sends the confirmation email again.
 *
 * Throttled per account, because each call costs an email. Answers the same
 * way whether or not the address was already confirmed.
 */
export async function POST(request: Request) {
  const blocked = sameOriginGate(request);
  if (blocked) return blocked;

  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  if (auth.user.emailVerifiedAt) {
    return jsonOk({ alreadyVerified: true, emailSent: false });
  }

  const quota = await consumeQuota(`verify:user:${auth.user.id}`, RULES.verifyResend);
  if (!quota.ok) {
    return jsonError(
      "validation_error",
      `Too many emails requested. ${waitMessage(quota.retryAfterSeconds)}`,
      429,
    );
  }

  const mail = await sendVerificationEmail(request, auth.user);
  return jsonOk({ alreadyVerified: false, emailSent: mail.delivered, to: auth.user.email });
}

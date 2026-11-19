import { redirect } from "next/navigation";
import { routes } from "@/config/site";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthStatusNotice } from "@/components/auth/status-notice";
import { VerifyEmailView } from "@/components/auth/verify-email-view";
import { pageMetadata } from "@/lib/metadata";
import { mailConfigured } from "@/lib/server/mail";
import { getSessionUser } from "@/lib/server/session";

export const metadata = pageMetadata({
  title: "Confirm your email",
  description: "Confirm the email address on your Reyvoca account.",
  path: routes.verifyEmail,
  noIndex: true,
});

export const dynamic = "force-dynamic";

/**
 * "Check your inbox", and the place a failed confirmation link lands.
 *
 * Signed out, there is nothing useful to show — the resend button needs an
 * account — so it hands over to the sign-in page, carrying any status so the
 * reason is not lost on the way.
 */
export default async function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  const { status, token } = await searchParams;

  // A token can only arrive here if someone hand-edited the link or an old
  // email is still in an inbox; hand it to the route that redeems tokens
  // rather than showing a page that silently ignores it.
  if (typeof token === "string" && token) {
    redirect(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
  }

  const user = await getSessionUser();

  if (!user) {
    // Carry a real outcome through, but invent nothing: someone who simply
    // visited this URL signed out has had no link fail on them.
    const query = typeof status === "string" && status ? `?status=${status}` : "";
    redirect(`${routes.signIn}${query}`);
  }

  return (
    <AuthShell
      title={user.emailVerified ? "You're confirmed" : "Confirm your email address"}
      description={
        user.emailVerified
          ? "Your address is verified and your workspace is ready."
          : "One click in your inbox and we're done."
      }
    >
      <AuthStatusNotice status={typeof status === "string" ? status : undefined} />
      <VerifyEmailView
        email={user.email}
        verified={user.emailVerified}
        mailConfigured={mailConfigured()}
      />
    </AuthShell>
  );
}

import Link from "next/link";
import { routes } from "@/config/site";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { pageMetadata } from "@/lib/metadata";
import { peekToken, tokenProblemMessage } from "@/lib/server/tokens";

export const metadata = pageMetadata({
  title: "Choose a new password",
  description: "Set a new password for your Reyvoca account.",
  path: routes.resetPassword,
  noIndex: true,
});

/** Never cached: the page's content depends on a one-time token. */
export const dynamic = "force-dynamic";

/**
 * Where the emailed reset link lands.
 *
 * The token is checked here but deliberately *not* spent — `peekToken`, not
 * `consumeToken`. It is spent when the form is submitted. Redeeming it on
 * page load would mean a mail client that prefetches links, or a stray
 * refresh, burns the link before anyone types a password.
 */
export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { token } = await searchParams;
  const raw = typeof token === "string" ? token : "";
  const checked = raw ? await peekToken(raw, "password_reset") : null;

  const backToSignIn = (
    <Link
      href={routes.signIn}
      className="font-medium text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ink"
    >
      Back to Sign In
    </Link>
  );

  if (!checked?.ok) {
    const message = checked
      ? tokenProblemMessage(checked.reason, "password_reset")
      : "This page needs the link from your reset email.";

    return (
      <AuthShell
        title="That link didn't work"
        description="Reset links are single-use and expire after 30 minutes."
        footer={backToSignIn}
      >
        <div className="space-y-6">
          <p role="alert" className="rounded-xl border border-danger-line bg-danger-soft p-4 text-sm leading-relaxed text-danger">
            {message}
          </p>
          <Link
            href={routes.forgotPassword}
            className="flex h-12 w-full items-center justify-center rounded-full bg-brand px-6 text-base font-medium text-white transition-colors hover:bg-brand-hover"
          >
            Request a new link
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a new password"
      description="Pick something you don't use anywhere else."
      footer={backToSignIn}
    >
      <ResetPasswordForm token={raw} />
    </AuthShell>
  );
}

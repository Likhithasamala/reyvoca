import Link from "next/link";
import { routes } from "@/config/site";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { pageMetadata } from "@/lib/metadata";
import { redirectIfSignedIn } from "@/lib/server/page-guards";

export const metadata = pageMetadata({
  title: "Reset Password",
  description: "Reset the password for your Reyvoca account.",
  path: routes.forgotPassword,
  noIndex: true,
});

export default async function ForgotPasswordPage() {
  // Signed in already: see lib/server/page-guards.ts.
  await redirectIfSignedIn();

  return (
    <AuthShell
      title="Reset your password"
      description="Enter your account email and we'll send you a reset link."
      footer={
        <Link href={routes.signIn} className="font-medium text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ink">
          Back to Sign In
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}

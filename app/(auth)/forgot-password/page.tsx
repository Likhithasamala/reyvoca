import Link from "next/link";
import { routes } from "@/config/site";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Reset Password",
  description: "Reset the password for your Reyvoca account.",
  path: routes.forgotPassword,
  noIndex: true,
});

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      description="Enter your account email and we'll send you a reset link."
      footer={
        <Link href={routes.signIn} className="font-medium text-brand hover:text-brand-hover">
          Back to Sign In
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}

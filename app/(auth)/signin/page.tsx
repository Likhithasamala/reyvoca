import Link from "next/link";
import { routes } from "@/config/site";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Sign In",
  description: "Sign in to your Reyvoca workspace.",
  path: routes.signIn,
});

export default function SignInPage() {
  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to your Reyvoca workspace."
      footer={
        <>
          New to Reyvoca?{" "}
          <Link href={routes.getStarted} className="font-medium text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ink">
            Create Account
          </Link>
        </>
      }
    >
      <SignInForm />
    </AuthShell>
  );
}

import Link from "next/link";
import { routes } from "@/config/site";
import { AuthShell } from "@/components/auth/auth-shell";
import { GetStartedForm } from "@/components/auth/get-started-form";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Get Started",
  description: "Create your Reyvoca workspace and build your first AI voice agent.",
  path: routes.getStarted,
});

export default function GetStartedPage() {
  return (
    <AuthShell
      title="Create your Reyvoca workspace"
      description="Start building AI voice agents for your business."
      footer={
        <>
          Already have an account?{" "}
          <Link href={routes.signIn} className="font-medium text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ink">
            Sign In
          </Link>
        </>
      }
    >
      <GetStartedForm />
    </AuthShell>
  );
}

import Link from "next/link";
import { routes } from "@/config/site";
import { AuthShell } from "@/components/auth/auth-shell";
import { GetStartedForm } from "@/components/auth/get-started-form";
import { pageMetadata } from "@/lib/metadata";
import { googleConfigured } from "@/lib/server/oauth/google";

/**
 * Not a public page. Reyvoca workspaces are opened by us on the demo call, so
 * nothing links here and it stays out of the index.
 */
export const metadata = pageMetadata({
  title: "Get Started",
  description:
    "Open a Reyvoca workspace. Reyvoca is not self-serve — we build the first AI voice agent with you on the demo call.",
  path: routes.getStarted,
  noIndex: true,
});

/** Read at request time so adding Google credentials needs no rebuild. */
export const dynamic = "force-dynamic";

export default function GetStartedPage() {
  return (
    <AuthShell
      title="Create your Reyvoca workspace"
      description="Start building AI voice agents for your business."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={routes.signIn}
            className="font-medium text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ink"
          >
            Sign In
          </Link>
        </>
      }
    >
      <GetStartedForm googleEnabled={googleConfigured()} />
    </AuthShell>
  );
}

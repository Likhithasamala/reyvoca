import { routes } from "@/config/site";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { AuthStatusNotice } from "@/components/auth/status-notice";
import { pageMetadata } from "@/lib/metadata";
import { googleConfigured } from "@/lib/server/oauth/google";
import { redirectIfSignedIn } from "@/lib/server/page-guards";

export const metadata = pageMetadata({
  title: "Sign In",
  description:
    "Sign in to your Reyvoca workspace to see the enquiries your AI voice agent has answered, qualified and booked, and the recording of every call it made.",
  path: routes.signIn,
});

/** `?next=` and `?status=` differ per visit, so this page is never cached. */
export const dynamic = "force-dynamic";

export default async function SignInPage({ searchParams }: PageProps<"/signin">) {
  const { next, status } = await searchParams;
  // Signed in already: there is nothing here for them. This used to be
  // proxy.ts; see lib/server/page-guards.ts for why it moved.
  await redirectIfSignedIn();

  // Only same-site paths are honoured: taking an absolute URL here would make
  // the sign-in page a redirector to anywhere.
  const safeNext =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : undefined;

  return (
    <AuthShell
      title="Welcome back"
      description="Continue with Google, or with the email address you signed up with."
    >
      <AuthStatusNotice status={typeof status === "string" ? status : undefined} />
      <SignInForm googleEnabled={googleConfigured()} next={safeNext} />
    </AuthShell>
  );
}

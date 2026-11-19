import { ArrowLeft, CircleAlert } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { routes } from "@/config/site";
import { AccountSection } from "@/components/account/account-section";
import { DeleteAccount } from "@/components/account/delete-account";
import { DeviceList } from "@/components/account/device-list";
import { EmailForm } from "@/components/account/email-form";
import { PasswordForm } from "@/components/account/password-form";
import { ProfileForm } from "@/components/account/profile-form";
import { SignOutButton } from "@/components/panel/sign-out-button";
import { Logo } from "@/components/ui/logo";
import { AUTH_EVENT_LABELS, recentAuthEvents } from "@/lib/server/audit";
import { currentSession, listSessions, toSessionUser } from "@/lib/server/session";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Account",
  description: "Your Reyvoca account, password and signed-in devices.",
  path: routes.account,
  noIndex: true,
});

/** Sessions and the security log change constantly; never serve a cached copy. */
export const dynamic = "force-dynamic";

const WHEN = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * The account page: profile, email, password, devices, security log, deletion.
 *
 * The proxy has already turned signed-out visitors away, but this checks
 * again. That is the rule the whole design rests on — the proxy is an
 * optimisation, the check next to the data is the lock.
 */
export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const found = await currentSession();
  if (!found) redirect(`${routes.signIn}?next=${encodeURIComponent(routes.account)}`);

  const { emailToken } = await searchParams;
  const user = toSessionUser(found.user);
  const hasPassword = found.user.passwordHash !== null;
  const [sessions, events] = await Promise.all([
    listSessions(found.user.id),
    recentAuthEvents(found.user.id, 8),
  ]);

  return (
    <div className="min-h-dvh bg-surface-muted">
      <header className="flex items-center justify-between gap-4 border-b border-line bg-surface px-5 py-4 sm:px-8">
        <Logo href={routes.home} />
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-ink-muted sm:inline">{user.email}</span>
          <SignOutButton className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-line/60 hover:text-ink" />
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-[720px] px-5 py-10 sm:px-8">
        <Link
          href={routes.requests}
          className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to your workspace
        </Link>

        <h1 className="mt-6 text-[2rem] leading-tight font-semibold tracking-[-0.025em] text-ink">
          Your account
        </h1>
        <p className="mt-2 text-ink-muted">
          {user.fullName} · {user.workspace}
        </p>

        {!user.emailVerified && (
          <div
            role="status"
            className="mt-6 flex gap-3 rounded-xl border border-warning-line bg-warning-soft p-4 text-sm leading-relaxed text-warning"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>
              Your email address isn&apos;t confirmed yet.{" "}
              <Link href={routes.verifyEmail} className="font-semibold underline underline-offset-4">
                Send the link again
              </Link>
              .
            </p>
          </div>
        )}

        <div className="mt-8 space-y-6">
          <AccountSection title="Profile" description="How Reyvoca refers to you and your workspace.">
            <ProfileForm user={user} />
          </AccountSection>

          <AccountSection
            title="Email address"
            description="Where sign-in links, password resets and account notices go."
          >
            <EmailForm
              user={user}
              hasPassword={hasPassword}
              emailToken={typeof emailToken === "string" ? emailToken : undefined}
            />
          </AccountSection>

          <AccountSection
            title="Password"
            description="Changing it signs you out everywhere else, including any device you've lost."
          >
            <PasswordForm hasPassword={hasPassword} email={user.email} fullName={user.fullName} />
          </AccountSection>

          <AccountSection
            title="Where you're signed in"
            description="Every browser holding a live session for this account."
          >
            <DeviceList sessions={sessions} />
          </AccountSection>

          <AccountSection
            title="Recent security activity"
            description="If something here wasn't you, change your password straight away."
          >
            {events.length === 0 ? (
              <p className="text-sm text-ink-subtle">Nothing recorded yet.</p>
            ) : (
              <ul className="divide-y divide-line text-sm">
                {events.map((event) => (
                  <li key={event.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2.5 first:pt-0">
                    <span className="font-medium text-ink">{AUTH_EVENT_LABELS[event.type]}</span>
                    <span className="text-xs text-ink-subtle">
                      {WHEN.format(new Date(event.at))}
                      {event.ip && event.ip !== "unknown" ? ` · ${event.ip}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </AccountSection>

          <AccountSection
            tone="danger"
            title="Delete account"
            description="Removes your account and every record in your workspace. There is no undo."
          >
            <DeleteAccount email={user.email} hasPassword={hasPassword} />
          </AccountSection>
        </div>
      </main>
    </div>
  );
}

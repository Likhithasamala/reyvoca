import { Mail, Phone } from "lucide-react";
import { redirect } from "next/navigation";
import { routes } from "@/config/site";
import { SignOutButton } from "@/components/panel/sign-out-button";
import { Logo } from "@/components/ui/logo";
import { read } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/session";

export const metadata = { title: "Demo requests" };

/** Enquiries are read per request; a cached page would hide new ones. */
export const dynamic = "force-dynamic";

const WHEN = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * The signed-in view: everyone who asked for a demo, newest first, with the
 * number to ring them on. This is the whole job of signing in right now —
 * the agent workspace is parked, not deleted.
 */
export default async function RequestsPage() {
  const user = await getSessionUser();
  if (!user) redirect(routes.signIn);

  const requests = await read((db) => db.demoRequests);

  return (
    <div className="min-h-dvh bg-surface-muted">
      <header className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Logo href={routes.home} />
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-ink-muted sm:inline">{user.email}</span>
          <SignOutButton className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-line/60 hover:text-ink" />
        </div>
      </header>

      <main id="main" className="mx-auto max-w-5xl px-5 pb-16 sm:px-8">
        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h1 className="text-2xl font-semibold text-ink">Demo requests</h1>
            <p className="text-sm text-ink-muted">
              {requests.length === 0
                ? "Nothing yet"
                : `${requests.length} ${requests.length === 1 ? "person" : "people"} to call back`}
            </p>
          </div>

          {requests.length === 0 ? (
            <p className="mt-8 rounded-xl border border-dashed border-line-strong px-4 py-8 text-center text-sm text-ink-muted">
              No one has booked a demo yet. Requests from the homepage form land here.
            </p>
          ) : (
            <ul className="mt-6 space-y-px">
              {requests.map((request) => (
                <li key={request.id} className="rounded-xl px-4 py-4 transition-colors hover:bg-surface-muted">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="text-base font-semibold text-ink">
                      {request.name}
                      <span className="font-normal text-ink-muted"> · {request.company}</span>
                    </p>
                    <p className="text-sm text-ink-subtle tabular-nums">{WHEN.format(new Date(request.createdAt))}</p>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                    <a
                      href={`tel:${request.phone.replace(/\s/g, "")}`}
                      className="inline-flex items-center gap-2 font-medium text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ink"
                    >
                      <Phone className="size-4 text-accent-strong" aria-hidden="true" />
                      {request.phone}
                    </a>
                    <a
                      href={`mailto:${request.email}`}
                      className="inline-flex items-center gap-2 text-ink-muted underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
                    >
                      <Mail className="size-4" aria-hidden="true" />
                      {request.email}
                    </a>
                  </div>

                  {request.message && (
                    <p className="mt-2.5 max-w-prose text-sm leading-relaxed text-ink-muted">{request.message}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

      </main>
    </div>
  );
}

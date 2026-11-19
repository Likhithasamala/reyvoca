import { CircleAlert, CircleCheck, ExternalLink } from "lucide-react";
import { read } from "@/lib/server/db";
import { mailConfigured } from "@/lib/server/mail";

export const metadata = { title: "Mailbox" };

/** The log changes with every email; never serve a cached copy. */
export const dynamic = "force-dynamic";

const WHEN = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/**
 * The operator mailbox: every auth email the platform has tried to send.
 *
 * With no mail provider configured, this is also where the links live, so the
 * whole sign-up and reset flow can be walked through on a laptop with no
 * Resend account. The moment `RESEND_API_KEY` is set the links stop being
 * recorded here and only the delivery record remains — a live reset link
 * sitting in a log is a live reset link in the wrong hands.
 */
export default async function MailboxPage() {
  const configured = mailConfigured();
  const mail = await read((db) => db.mailLog);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[1.5rem] font-semibold tracking-[-0.02em] text-ink">Mailbox</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
          The last {mail.length === 1 ? "email" : `${mail.length} emails`} Reyvoca tried to send.
        </p>
      </header>

      <div
        className={
          configured
            ? "flex gap-3 rounded-xl border border-success-line bg-success-soft p-4 text-sm leading-relaxed text-success"
            : "flex gap-3 rounded-xl border border-warning-line bg-warning-soft p-4 text-sm leading-relaxed text-warning"
        }
      >
        {configured ? (
          <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        ) : (
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        )}
        <p>
          {configured ? (
            <>
              Resend is configured, so mail is really being delivered. Links are deliberately not
              recorded here.
            </>
          ) : (
            <>
              No mail provider is configured. Nothing is being delivered — open the links below to
              walk the flows through by hand. Set <code className="font-mono">RESEND_API_KEY</code> to
              send for real.
            </>
          )}
        </p>
      </div>

      {mail.length === 0 ? (
        <p className="rounded-2xl border border-line bg-surface p-6 text-sm text-ink-subtle">
          Nothing yet. Create an account or ask for a password reset and it will appear here.
        </p>
      ) : (
        <ul className="space-y-3">
          {mail.map((row) => (
            <li key={row.id} className="rounded-2xl border border-line bg-surface p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="text-sm font-semibold text-ink">{row.subject}</p>
                <p className="text-xs text-ink-subtle">{WHEN.format(new Date(row.createdAt))}</p>
              </div>
              <p className="mt-1 text-sm text-ink-muted">
                to {row.to} · via {row.provider === "resend" ? "Resend" : "no provider"} ·{" "}
                <span className={row.status === "sent" ? "text-success" : "text-danger"}>
                  {row.status === "sent" ? "accepted" : "failed"}
                </span>
              </p>
              {row.error && <p className="mt-2 text-sm text-danger">{row.error}</p>}
              {row.actionUrl && (
                <a
                  href={row.actionUrl}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent-strong underline decoration-accent-soft underline-offset-4 transition-colors hover:decoration-accent-strong"
                >
                  Open the link from this email
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { CircleCheck, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { routes } from "@/config/site";
import { Button, ButtonLink } from "@/components/ui/button";
import { authService } from "@/lib/auth/service";

type VerifyEmailViewProps = {
  email: string;
  verified: boolean;
  /** False when no mail provider is configured, which changes the advice. */
  mailConfigured: boolean;
};

/**
 * "Confirm your email address."
 *
 * Deliberately not a wall. There is a way past it to the product, because
 * blocking a new account until it fetches an email is the pattern that loses
 * people at the door — and the unconfirmed state is already visible wherever
 * it matters.
 */
export function VerifyEmailView({ email, verified, mailConfigured }: VerifyEmailViewProps) {
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function resend() {
    setSending(true);
    setNotice(null);
    const result = await authService.resendVerification();
    setSending(false);

    if (!result.ok) {
      setNotice(result.message);
      return;
    }
    if (result.data?.alreadyVerified) {
      setNotice("That address is already confirmed. You're all set.");
      return;
    }
    setNotice(
      result.data?.emailSent
        ? `Sent again to ${email}. Give it a minute, and check your spam folder.`
        : "No mail provider is configured yet, so nothing was sent. The link is in the server log and in the operator mailbox.",
    );
  }

  if (verified) {
    return (
      <div className="space-y-6">
        <div className="flex gap-3 rounded-xl border border-success-line bg-success-soft p-4 text-sm text-success">
          <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            <strong className="font-semibold">{email}</strong> is confirmed. Nothing left to do here.
          </p>
        </div>
        <ButtonLink href={routes.requests} size="lg" className="w-full">
          Go to your workspace
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-3 rounded-xl border border-line bg-surface-muted p-4 text-sm leading-relaxed text-ink">
        <Mail className="mt-0.5 size-4 shrink-0 text-accent-strong" aria-hidden="true" />
        <p>
          We&apos;ve sent a confirmation link to <strong className="font-semibold">{email}</strong>. Open
          it and your address is confirmed — the link lasts 24 hours.
        </p>
      </div>

      {!mailConfigured && (
        <p className="rounded-xl border border-warning-line bg-warning-soft p-4 text-sm leading-relaxed text-warning">
          No mail provider is configured, so no email has actually left the building. The link was
          written to the terminal running <code className="font-mono text-[0.8125rem]">next dev</code>{" "}
          and is listed in the operator mailbox.
        </p>
      )}

      {notice && (
        <p role="status" className="rounded-xl border border-line bg-surface p-4 text-sm text-ink-muted">
          {notice}
        </p>
      )}

      <div className="space-y-3">
        <Button onClick={resend} size="lg" className="w-full" disabled={sending}>
          {sending ? "Sending…" : "Send the link again"}
        </Button>
        <ButtonLink href={routes.requests} variant="secondary" size="lg" className="w-full">
          Skip for now
        </ButtonLink>
      </div>

      <p className="text-center text-sm text-ink-muted">
        Wrong address?{" "}
        <Link
          href={routes.account}
          className="font-medium text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ink"
        >
          Change it on your account
        </Link>
      </p>
    </div>
  );
}

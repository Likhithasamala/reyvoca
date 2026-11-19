"use client";

import { CircleCheck, CircleDashed } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { authService } from "@/lib/auth/service";
import { validateEmail } from "@/lib/validation";
import type { AccountSummary } from "@/types";
import { ErrorNotice, SavedNotice } from "./account-section";

type EmailFormProps = {
  user: AccountSummary;
  /** True when the account has a password, which must be given to change it. */
  hasPassword: boolean;
  /**
   * The `?emailToken=` from the link sent to the new address. Present only
   * when someone has just clicked it, and redeemed immediately.
   */
  emailToken?: string;
};

/**
 * The email address, and the two-step change.
 *
 * Asking for a new address only sends a confirmation link to it. Nothing
 * changes until that link is clicked — which is what proves the person asking
 * can actually receive mail at the new address.
 */
export function EmailForm({ user, hasPassword, emailToken }: EmailFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [state, setState] = useState<{ pending?: string; sent?: boolean; done?: boolean; error?: string }>({});
  const [saving, setSaving] = useState(false);

  // A token in the URL means the new mailbox just confirmed: redeem it once,
  // then take it out of the address bar so a refresh cannot retry a dead one.
  useEffect(() => {
    if (!emailToken) return;
    let cancelled = false;

    void (async () => {
      const result = await authService.confirmEmailChange(emailToken);
      if (cancelled) return;
      setState(result.ok ? { done: true } : { error: result.message });
      router.replace("/account");
      router.refresh();
    })();

    return () => {
      cancelled = true;
    };
  }, [emailToken, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim().toLowerCase();
    const password = String(data.get("password") ?? "");

    const problem = validateEmail(email);
    setError(problem);
    setState({});
    if (problem) return;
    if (email === user.email) {
      setError("That is already your email address.");
      return;
    }

    setSaving(true);
    const result = await authService.requestEmailChange({ email, password });
    setSaving(false);

    if (!result.ok) {
      setState({ error: result.message });
      return;
    }
    setState({ pending: result.data?.pendingEmail ?? email, sent: result.data?.emailSent });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
        <span className="font-medium text-ink">{user.email}</span>
        {user.emailVerified ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-success-line bg-success-soft px-2.5 py-1 text-xs font-medium text-success">
            <CircleCheck className="size-3.5" aria-hidden="true" />
            Confirmed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-warning-line bg-warning-soft px-2.5 py-1 text-xs font-medium text-warning">
            <CircleDashed className="size-3.5" aria-hidden="true" />
            Not confirmed
          </span>
        )}
      </div>

      {state.done && <SavedNotice>Your new email address is confirmed.</SavedNotice>}

      {state.pending ? (
        <SavedNotice>
          {state.sent
            ? `We've sent a confirmation link to ${state.pending}. Your address changes once you open it — until then, ${user.email} still signs you in.`
            : `No mail provider is configured, so nothing was sent. The link for ${state.pending} is in the server log and the operator mailbox.`}
        </SavedNotice>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <FormField
            label="New email address"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            error={error}
          />
          {hasPassword && (
            <FormField
              label="Your password"
              name="password"
              type="password"
              autoComplete="current-password"
              hint="Changing where your email goes is as sensitive as changing your password."
            />
          )}
          {state.error && <ErrorNotice>{state.error}</ErrorNotice>}
          <Button type="submit" variant="secondary" disabled={saving}>
            {saving ? "Sending…" : "Send confirmation link"}
          </Button>
        </form>
      )}
    </div>
  );
}

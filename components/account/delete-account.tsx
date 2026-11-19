"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { authService } from "@/lib/auth/service";
import { ErrorNotice } from "./account-section";

type DeleteAccountProps = {
  email: string;
  /** Password accounts confirm with the password; Google ones type the email. */
  hasPassword: boolean;
};

/**
 * Account deletion.
 *
 * Two deliberate frictions: the form is behind a button, and it asks for the
 * password (or the address typed out). Deletion really deletes — the
 * workspace's agents, leads, campaigns and call history go with it — so it
 * should not be reachable by one stray click.
 */
export function DeleteAccount({ email, hasPassword }: DeleteAccountProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    const confirmEmail = String(data.get("confirmEmail") ?? "").trim();

    setError(undefined);
    setDeleting(true);
    const result = await authService.deleteAccount({ password, confirmEmail });

    if (!result.ok) {
      setDeleting(false);
      setError(result.message);
      return;
    }
    router.replace(result.redirectTo ?? "/");
    router.refresh();
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Delete my account
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <p className="text-sm leading-relaxed text-ink-muted">
        This removes your account, your workspace and everything in it — agents, leads, campaigns
        and call history. It cannot be undone.
      </p>
      {hasPassword ? (
        <FormField
          label="Your password"
          name="password"
          type="password"
          autoComplete="current-password"
        />
      ) : (
        <FormField
          label={`Type ${email} to confirm`}
          name="confirmEmail"
          type="email"
          autoComplete="off"
        />
      )}
      {error && <ErrorNotice>{error}</ErrorNotice>}
      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          disabled={deleting}
          className="bg-danger text-white hover:bg-danger hover:brightness-110"
        >
          {deleting ? "Deleting…" : "Delete account permanently"}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)} disabled={deleting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

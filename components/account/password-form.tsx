"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { authService } from "@/lib/auth/service";
import { validatePassword, validatePasswordConfirmation } from "@/lib/validation";
import { ErrorNotice, SavedNotice } from "./account-section";

type PasswordFormProps = {
  /** False for a Google account that has never set one. */
  hasPassword: boolean;
  email: string;
  fullName: string;
};

type Errors = { currentPassword?: string; password?: string; confirmPassword?: string };

/**
 * Changing the password from inside the account.
 *
 * The current password is required even though the session already proves the
 * browser: a cookie proves the device, not the person sitting at it.
 */
export function PasswordForm({ hasPassword, email, fullName }: PasswordFormProps) {
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<{ saved?: string; error?: string }>({});
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const currentPassword = String(data.get("currentPassword") ?? "");
    const newPassword = String(data.get("password") ?? "");
    const confirmPassword = String(data.get("confirmPassword") ?? "");

    const nextErrors: Errors = {
      currentPassword:
        hasPassword && !currentPassword ? "Enter your current password." : undefined,
      password: validatePassword(newPassword, { checkStrength: true, email, name: fullName }),
      confirmPassword: validatePasswordConfirmation(newPassword, confirmPassword),
    };
    setErrors(nextErrors);
    setState({});
    if (Object.values(nextErrors).some(Boolean)) return;

    setSaving(true);
    const result = await authService.changePassword({
      currentPassword: hasPassword ? currentPassword : undefined,
      password: newPassword,
      confirmPassword,
    });
    setSaving(false);

    if (!result.ok) {
      setState({ error: result.message });
      return;
    }

    const signedOut = result.data?.otherDevicesSignedOut ?? 0;
    setState({
      saved:
        signedOut > 0
          ? `Password saved. ${signedOut} other ${signedOut === 1 ? "device was" : "devices were"} signed out.`
          : "Password saved.",
    });
    event.currentTarget.reset();
    setPassword("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {hasPassword ? (
        <FormField
          label="Current password"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          error={errors.currentPassword}
        />
      ) : (
        <p className="rounded-xl border border-line bg-surface-muted p-4 text-sm leading-relaxed text-ink-muted">
          You sign in with Google and have no password here. Setting one gives you a second way in —
          Google keeps working either way.
        </p>
      )}
      <PasswordField
        label={hasPassword ? "New password" : "Password"}
        error={errors.password}
        onValueChange={setPassword}
      />
      <FormField
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword}
      />
      {state.saved && <SavedNotice>{state.saved}</SavedNotice>}
      {state.error && <ErrorNotice>{state.error}</ErrorNotice>}
      <Button type="submit" disabled={saving || !password}>
        {saving ? "Saving…" : hasPassword ? "Change password" : "Set password"}
      </Button>
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { routes } from "@/config/site";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { authService } from "@/lib/auth/service";
import type { AuthFailure } from "@/lib/auth/types";
import { validatePassword, validatePasswordConfirmation } from "@/lib/validation";
import { FormNotice } from "./form-notice";
import { PasswordField } from "./password-field";

type Errors = { password?: string; confirmPassword?: string };

/**
 * Sets a new password from the emailed link.
 *
 * The token is a hidden input rather than something re-read from the URL at
 * submit time, so a password manager filling the form, a back-navigation or a
 * tab restore cannot submit the form with a token that is no longer the one
 * the page was opened with.
 */
export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState<AuthFailure | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const newPassword = String(data.get("password") ?? "");
    const confirmPassword = String(data.get("confirmPassword") ?? "");

    const nextErrors: Errors = {
      password: validatePassword(newPassword, { checkStrength: true }),
      confirmPassword: validatePasswordConfirmation(newPassword, confirmPassword),
    };
    setErrors(nextErrors);
    setFailure(null);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitting(true);
    const response = await authService.confirmPasswordReset({
      token,
      password: newPassword,
      confirmPassword,
    });
    if (response.ok) {
      router.push(response.redirectTo ?? routes.requests);
      router.refresh();
      return;
    }
    setSubmitting(false);
    setFailure(response);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <PasswordField label="New password" error={errors.password} onValueChange={setPassword} />
      <FormField
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword}
      />
      <p className="text-sm text-ink-subtle">
        Saving a new password signs you out on every other device.
      </p>
      {failure && <FormNotice result={failure} />}
      <Button type="submit" size="lg" className="w-full" disabled={submitting || !password}>
        {submitting ? "Saving…" : "Save new password"}
      </Button>
    </form>
  );
}

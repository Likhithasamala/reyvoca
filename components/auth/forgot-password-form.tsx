"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { authService } from "@/lib/auth/service";
import type { AuthResult } from "@/lib/auth/types";
import { validateEmail } from "@/lib/validation";
import { FormNotice } from "./form-notice";

export function ForgotPasswordForm() {
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<AuthResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    const emailError = validateEmail(email);
    setError(emailError);
    setResult(null);
    if (emailError) return;

    setSubmitting(true);
    setResult(await authService.requestPasswordReset({ email }));
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <FormField label="Email" name="email" type="email" autoComplete="email" placeholder="you@company.com" error={error} />
      {result &&
        (result.ok ? (
          <p role="status" className="rounded-xl border border-success-line bg-success-soft p-4 text-sm text-success">
            If an account exists for that email, a reset link is on its way.
          </p>
        ) : (
          <FormNotice result={result} />
        ))}
      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}

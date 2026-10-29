"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { routes } from "@/config/site";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { authService } from "@/lib/auth/service";
import type { AuthResult } from "@/lib/auth/types";
import { validateEmail, validatePassword } from "@/lib/validation";
import { FormNotice } from "./form-notice";
import { GoogleButton } from "./google-button";

type Errors = { email?: string; password?: string };

export function SignInForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const [result, setResult] = useState<AuthResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");

    const nextErrors: Errors = { email: validateEmail(email), password: validatePassword(password) };
    setErrors(nextErrors);
    setResult(null);
    if (nextErrors.email || nextErrors.password) return;

    setSubmitting(true);
    const response = await authService.signIn({ email: email.trim(), password });
    setSubmitting(false);
    if (response.ok) {
      router.push(response.redirectTo ?? routes.dashboard);
      return;
    }
    setResult(response);
  }

  return (
    <>
      <GoogleButton />
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          error={errors.email}
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          error={errors.password}
          labelAction={
            <Link href={routes.forgotPassword} className="text-sm font-medium text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ink">
              Forgot password?
            </Link>
          }
        />
        {result && !result.ok && <FormNotice result={result} />}
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign In"}
        </Button>
      </form>
    </>
  );
}

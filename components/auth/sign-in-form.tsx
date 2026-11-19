"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { routes } from "@/config/site";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { authService } from "@/lib/auth/service";
import type { AuthFailure } from "@/lib/auth/types";
import { validateEmail, validatePassword } from "@/lib/validation";
import { FormNotice } from "./form-notice";
import { GoogleButton } from "./google-button";

type Errors = { email?: string; password?: string };

type SignInFormProps = {
  /** Whether Google's credentials are configured on the server. */
  googleEnabled: boolean;
  /** Where to land afterwards, from `?next=` — set by the proxy redirect. */
  next?: string;
};

export function SignInForm({ googleEnabled, next }: SignInFormProps) {
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState<AuthFailure | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    const remember = data.get("remember") === "on";

    const nextErrors: Errors = { email: validateEmail(email), password: validatePassword(password) };
    setErrors(nextErrors);
    setFailure(null);
    if (nextErrors.email || nextErrors.password) return;

    setSubmitting(true);
    const response = await authService.signIn({ email: email.trim(), password, remember });
    if (response.ok) {
      // `next` wins when the proxy sent us here from a protected page, unless
      // the server would rather finish confirming the email address first.
      const fallback = next ?? routes.requests;
      const destination =
        response.redirectTo === routes.verifyEmail ? routes.verifyEmail : fallback;
      router.push(destination);
      // Server Components cached for this route still hold the signed-out
      // view, so the refresh is what makes the account appear.
      router.refresh();
      return;
    }
    setSubmitting(false);
    setFailure(response);
  }

  return (
    <>
      <GoogleButton enabled={googleEnabled} next={next} />
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
            <Link
              href={routes.forgotPassword}
              className="text-sm font-medium text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ink"
            >
              Forgot password?
            </Link>
          }
        />

        <label className="flex items-center gap-3 text-sm text-ink-muted">
          <input
            type="checkbox"
            name="remember"
            defaultChecked
            className="size-4 shrink-0 rounded border-line-strong accent-brand"
          />
          Keep me signed in for 30 days
        </label>

        {failure && <FormNotice result={failure} />}
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign In"}
        </Button>
      </form>
    </>
  );
}

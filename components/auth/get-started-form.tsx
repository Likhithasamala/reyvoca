"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { routes } from "@/config/site";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { authService } from "@/lib/auth/service";
import type { AuthFailure } from "@/lib/auth/types";
import {
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateRequired,
} from "@/lib/validation";
import { FormNotice } from "./form-notice";
import { GoogleButton } from "./google-button";
import { PasswordField } from "./password-field";

type Errors = Partial<
  Record<"fullName" | "email" | "workspace" | "password" | "confirmPassword" | "terms", string>
>;

export function GetStartedForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState<AuthFailure | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Held so the strength rules can reject a password that contains the name
  // or email, the way the server will.
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input = {
      fullName: String(data.get("fullName") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      workspace: String(data.get("workspace") ?? "").trim(),
      password: String(data.get("password") ?? ""),
      confirmPassword: String(data.get("confirmPassword") ?? ""),
      acceptedTerms: data.get("terms") === "on",
      remember: true,
    };

    const nextErrors: Errors = {
      fullName: validateRequired(input.fullName, "full name"),
      email: validateEmail(input.email),
      workspace: validateRequired(input.workspace, "company or workspace name"),
      password: validatePassword(input.password, {
        checkStrength: true,
        email: input.email,
        name: input.fullName,
      }),
      confirmPassword: validatePasswordConfirmation(input.password, input.confirmPassword),
      terms: input.acceptedTerms ? undefined : "Please accept the terms to continue.",
    };
    setErrors(nextErrors);
    setFailure(null);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitting(true);
    const response = await authService.signUp(input);
    if (response.ok) {
      // Straight to "confirm your email", which is where the new account's
      // first task is.
      router.push(response.redirectTo ?? routes.verifyEmail);
      router.refresh();
      return;
    }
    setSubmitting(false);
    setFailure(response);
  }

  return (
    <>
      <GoogleButton enabled={googleEnabled} label="Sign up with Google" />
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <FormField
          label="Full name"
          name="fullName"
          autoComplete="name"
          placeholder="Jane Cooper"
          error={errors.fullName}
        />
        <FormField
          label="Work email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="jane@company.com"
          hint="We'll send a link here to confirm it."
          error={errors.email}
        />
        <FormField
          label="Company / workspace"
          name="workspace"
          autoComplete="organization"
          placeholder="Acme Inc."
          error={errors.workspace}
        />
        <PasswordField error={errors.password} onValueChange={setPassword} />
        <FormField
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword}
        />

        <div>
          <label className="flex items-start gap-3 text-sm text-ink-muted">
            <input
              type="checkbox"
              name="terms"
              aria-invalid={errors.terms ? true : undefined}
              aria-describedby={errors.terms ? "terms-error" : undefined}
              className="mt-0.5 size-4 shrink-0 rounded border-line-strong accent-brand"
            />
            <span>
              I agree to the{" "}
              <Link
                href={routes.terms}
                className="font-medium text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ink"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href={routes.privacy}
                className="font-medium text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ink"
              >
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {errors.terms && (
            <p id="terms-error" className="mt-1.5 text-xs font-medium text-danger">
              {errors.terms}
            </p>
          )}
        </div>

        {failure && <FormNotice result={failure} />}
        <Button type="submit" size="lg" className="w-full" disabled={submitting || !password}>
          {submitting ? "Creating workspace…" : "Create Workspace"}
        </Button>
      </form>
    </>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { routes } from "@/config/site";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { authService } from "@/lib/auth/service";
import type { AuthResult } from "@/lib/auth/types";
import { MIN_PASSWORD_LENGTH, validateEmail, validatePassword, validateRequired } from "@/lib/validation";
import { FormNotice } from "./form-notice";
import { GoogleButton } from "./google-button";

type Errors = Partial<Record<"fullName" | "email" | "workspace" | "password" | "terms", string>>;

export function GetStartedForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const [result, setResult] = useState<AuthResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input = {
      fullName: String(data.get("fullName") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      workspace: String(data.get("workspace") ?? "").trim(),
      password: String(data.get("password") ?? ""),
      acceptedTerms: data.get("terms") === "on",
    };

    const nextErrors: Errors = {
      fullName: validateRequired(input.fullName, "full name"),
      email: validateEmail(input.email),
      workspace: validateRequired(input.workspace, "company or workspace name"),
      password: validatePassword(input.password, { checkStrength: true }),
      terms: input.acceptedTerms ? undefined : "Please accept the terms to continue.",
    };
    setErrors(nextErrors);
    setResult(null);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitting(true);
    const response = await authService.signUp(input);
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
        <FormField label="Full name" name="fullName" autoComplete="name" placeholder="Jane Cooper" error={errors.fullName} />
        <FormField
          label="Work email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="jane@company.com"
          error={errors.email}
        />
        <FormField
          label="Company / workspace"
          name="workspace"
          autoComplete="organization"
          placeholder="Acme Inc."
          error={errors.workspace}
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          error={errors.password}
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
              <Link href={routes.terms} className="font-medium text-brand hover:text-brand-hover">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href={routes.privacy} className="font-medium text-brand hover:text-brand-hover">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {errors.terms && (
            <p id="terms-error" className="mt-1.5 text-xs font-medium text-red-600">
              {errors.terms}
            </p>
          )}
        </div>

        {result && !result.ok && <FormNotice result={result} />}
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Creating workspace…" : "Create Workspace"}
        </Button>
      </form>
    </>
  );
}

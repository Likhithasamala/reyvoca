"use client";

import { Check } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { FormField } from "@/components/ui/form-field";
import { validateEmail, validateRequired } from "@/lib/validation";

type Errors = Partial<Record<"name" | "company" | "phone" | "email", string>>;

const PHONE_PATTERN = /^\+?[\d\s()-]{7,20}$/;

function validatePhone(value: string): string | undefined {
  if (!value.trim()) return "Enter a phone number.";
  if (!PHONE_PATTERN.test(value.trim())) return "Enter a number we can call you on.";
}

/**
 * The site's one conversion point. Reyvoca is sold with a conversation rather
 * than self-serve signup, so this form collects what is needed to ring the
 * person back and files it in the database.
 */
export function BookDemo() {
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const values = {
      name: String(data.get("name") ?? "").trim(),
      company: String(data.get("company") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      message: String(data.get("message") ?? "").trim(),
    };

    const nextErrors: Errors = {
      name: validateRequired(values.name, "name"),
      company: validateRequired(values.company, "company name"),
      phone: validatePhone(values.phone),
      email: validateEmail(values.email),
    };
    setErrors(nextErrors);
    setFailure(null);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/demo-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        setFailure(payload?.message ?? "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setFailure("We couldn't reach Reyvoca. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="book-demo" aria-labelledby="book-demo-heading" className="bg-canvas py-24 lg:py-32">
      <Container className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div className="max-w-md">
          <h2 id="book-demo-heading" className="text-h2 font-semibold text-ink">
            Book it now
          </h2>
          <p className="mt-5 text-lead text-ink-muted">
            Tell us about your business and we&rsquo;ll call you back. We set the agent up for you, connect it to your
            numbers and hand over a workspace that already works.
          </p>
          <ul className="mt-8 space-y-3 text-[0.9375rem] text-ink-muted">
            {[
              "A real conversation, not a signup form",
              "We build and connect the agent for you",
              "You get a working workspace, not a blank one",
            ].map((point) => (
              <li key={point} className="flex items-start gap-3">
                <Check className="mt-0.5 size-4 shrink-0 text-accent-strong" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-surface p-6 sm:p-8">
          {done ? (
            <div role="status" className="py-6">
              <span className="flex size-11 items-center justify-center rounded-full bg-success-soft">
                <Check className="size-5 text-success" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-h3 font-semibold text-ink">Thanks — we&rsquo;ll call you.</h3>
              <p className="mt-3 max-w-prose text-ink-muted">
                Your request is with us. We usually come back within one business day, on the number you gave.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Your name" name="name" autoComplete="name" placeholder="Priya Sharma" error={errors.name} />
                <FormField
                  label="Company name"
                  name="company"
                  autoComplete="organization"
                  placeholder="Harper Property"
                  error={errors.company}
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  label="Phone number"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+91 98765 43210"
                  hint="The number we should ring you on."
                  error={errors.phone}
                />
                <FormField
                  label="Email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  error={errors.email}
                />
              </div>

              <div>
                <label htmlFor="demo-message" className="mb-1.5 block text-sm font-medium text-ink">
                  Anything we should know{" "}
                  <span className="font-normal text-ink-subtle">(optional)</span>
                </label>
                <textarea
                  id="demo-message"
                  name="message"
                  rows={4}
                  placeholder="What kind of calls would you like handled?"
                  className="block w-full rounded-lg border border-line-strong bg-surface px-3.5 py-2.5 text-[0.9375rem] text-ink placeholder:text-ink-subtle transition-colors hover:border-ink-subtle focus:border-ink focus:ring-4 focus:ring-surface-muted focus:outline-none"
                />
              </div>

              {failure && (
                <p role="alert" className="rounded-lg bg-danger-soft px-3.5 py-3 text-sm font-medium text-danger">
                  {failure}
                </p>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting ? "Sending…" : "Book demo"}
              </Button>
              <p className="text-sm text-ink-subtle">
                We use these details only to contact you about Reyvoca.
              </p>
            </form>
          )}
        </div>
      </Container>
    </section>
  );
}

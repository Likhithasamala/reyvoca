"use client";

import { Check } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { FormField } from "@/components/ui/form-field";
import { cn } from "@/lib/cn";
import { validateEmail, validateRequired } from "@/lib/validation";

type Errors = Partial<Record<"name" | "company" | "phone" | "email", string>>;

const PHONE_PATTERN = /^\+?[\d\s()-]{7,20}$/;

function validatePhone(value: string): string | undefined {
  if (!value.trim()) return "Enter a phone number.";
  if (!PHONE_PATTERN.test(value.trim())) return "Enter a number we can call you on.";
}

/**
 * "paper" is the standalone section other marketing pages end with. "night" is
 * the same form inside the homepage's closing scene: no ground of its own, no
 * standfirst — the heading follows straight on from "could already be on a
 * call.", which has already said everything a subtitle would.
 */
export type BookDemoTone = "paper" | "night";

const POINTS = [
  "A real conversation, not a signup form",
  "We build and connect the agent for you",
  "You get a working workspace, not a blank one",
];

/**
 * The site's one conversion point. Reyvoca is sold with a conversation rather
 * than self-serve signup, so this form collects what is needed to ring the
 * person back and files it in the database.
 */
export function BookDemo({ tone = "paper" }: { tone?: BookDemoTone } = {}) {
  const night = tone === "night";
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

  const fieldTone = night ? "night" : "paper";

  return (
    <section
      id="book-demo"
      aria-labelledby="book-demo-heading"
      className={cn("py-20 lg:py-24", night ? "bg-transparent lg:py-24" : "bg-canvas")}
    >
      <Container className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div className={cn("max-w-md", night && "reveal lg:pt-2")}>
          <h2
            id="book-demo-heading"
            className={cn("text-h2 font-semibold", night ? "text-[#fffaf4]" : "text-ink")}
          >
            Book it now
          </h2>
          {!night && (
            <p className="text-lead mt-5 text-ink-muted">
              Tell us about your business and we&rsquo;ll call you back. We set the agent up for you, connect it to your
              numbers and hand over a workspace that already works.
            </p>
          )}
          <ul className={cn("space-y-3 text-[0.9375rem]", night ? "mt-8 text-night-text" : "mt-8 text-ink-muted")}>
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <Check
                  className={cn("mt-0.5 size-4 shrink-0", night ? "text-accent-glow" : "text-accent-strong")}
                  aria-hidden="true"
                />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div
          className={cn(
            "rounded-2xl p-6 sm:p-8",
            night
              ? "reveal border border-white/12 bg-white/[0.04] backdrop-blur-[2px] sm:p-9"
              : "bg-surface",
          )}
        >
          {done ? (
            <div role="status" className="py-6">
              <span
                className={cn(
                  "flex size-11 items-center justify-center rounded-full",
                  night ? "bg-accent-glow/15" : "bg-success-soft",
                )}
              >
                <Check className={cn("size-5", night ? "text-accent-glow" : "text-success")} aria-hidden="true" />
              </span>
              <h3 className={cn("text-h3 mt-5 font-semibold", night ? "text-[#fffaf4]" : "text-ink")}>
                Thanks — we&rsquo;ll call you.
              </h3>
              <p className={cn("mt-3 max-w-prose", night ? "text-night-text" : "text-ink-muted")}>
                Your request is with us. We usually come back within one business day, on the number you gave.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  label="Your name"
                  name="name"
                  autoComplete="name"
                  placeholder="Priya Sharma"
                  tone={fieldTone}
                  error={errors.name}
                />
                <FormField
                  label="Company name"
                  name="company"
                  autoComplete="organization"
                  placeholder="Harper Property"
                  tone={fieldTone}
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
                  tone={fieldTone}
                  error={errors.phone}
                />
                <FormField
                  label="Email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  tone={fieldTone}
                  error={errors.email}
                />
              </div>

              <div>
                <label
                  htmlFor="demo-message"
                  className={cn("mb-1.5 block text-sm font-medium", night ? "text-night-text" : "text-ink")}
                >
                  Anything we should know{" "}
                  <span className={cn("font-normal", night ? "text-night-muted" : "text-ink-subtle")}>(optional)</span>
                </label>
                <textarea
                  id="demo-message"
                  name="message"
                  rows={4}
                  placeholder="What kind of calls would you like handled?"
                  className={cn(
                    "block w-full rounded-lg border px-3.5 py-2.5 text-[0.9375rem] transition-colors focus:ring-4 focus:outline-none",
                    night
                      ? "border-white/15 bg-white/[0.06] text-[#fffaf4] placeholder:text-night-muted hover:border-white/35 focus:border-white/70 focus:ring-white/10"
                      : "border-line-strong bg-surface text-ink placeholder:text-ink-subtle hover:border-ink-subtle focus:border-ink focus:ring-surface-muted",
                  )}
                />
              </div>

              {failure && (
                <p
                  role="alert"
                  className={cn(
                    "rounded-lg px-3.5 py-3 text-sm font-medium",
                    night ? "bg-[#ffb3ac]/10 text-[#ffb3ac]" : "bg-danger-soft text-danger",
                  )}
                >
                  {failure}
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                variant={night ? "inverse" : "primary"}
                className="w-full"
                disabled={submitting}
              >
                {submitting ? "Sending…" : "Book demo"}
              </Button>
              <p className={cn("text-sm", night ? "text-night-muted" : "text-ink-subtle")}>
                We use these details only to contact you about Reyvoca.
              </p>
            </form>
          )}
        </div>
      </Container>
    </section>
  );
}

import { CircleAlert, CircleCheck, Info } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Messages for the `?status=` the auth routes redirect back with.
 *
 * Redirects cannot carry a response body, so the outcome travels as a short
 * code in the URL and is spelled out here. Keeping the wording in one table
 * means a code can never reach someone as a raw slug.
 */
const MESSAGES: Record<string, { tone: "success" | "info" | "error"; text: string }> = {
  verified: {
    tone: "success",
    text: "Your email address is confirmed. Sign in to carry on.",
  },
  expired: {
    tone: "info",
    text: "That confirmation link has expired. Sign in and we'll send a fresh one.",
  },
  used: {
    tone: "info",
    text: "That link has already been used. If your address is confirmed, just sign in.",
  },
  unknown: {
    tone: "error",
    text: "That link is not valid. Sign in and we'll send a fresh one.",
  },
  google_unconfigured: {
    tone: "info",
    text: "Google sign-in isn't configured yet. Use your email and password for now.",
  },
  google_cancelled: {
    tone: "info",
    text: "Google sign-in was cancelled.",
  },
  google_expired: {
    tone: "info",
    text: "That Google sign-in took too long. Try again.",
  },
  google_state: {
    tone: "error",
    text: "That Google sign-in couldn't be matched to this browser. Try again.",
  },
  google_failed: {
    tone: "error",
    text: "Google sign-in didn't complete. Try again, or use your email and password.",
  },
  suspended: {
    tone: "error",
    text: "That account is suspended. Get in touch and we'll sort it out.",
  },
  signed_out: {
    tone: "info",
    text: "You're signed out.",
  },
};

const TONES = {
  success: { box: "border-success-line bg-success-soft text-success", Icon: CircleCheck },
  info: { box: "border-line bg-surface-muted text-ink", Icon: Info },
  error: { box: "border-danger-line bg-danger-soft text-danger", Icon: CircleAlert },
} as const;

export function AuthStatusNotice({ status }: { status?: string }) {
  const message = status ? MESSAGES[status] : undefined;
  if (!message) return null;

  const { box, Icon } = TONES[message.tone];
  return (
    <div
      role={message.tone === "error" ? "alert" : "status"}
      className={cn("mb-6 flex gap-3 rounded-xl border p-4 text-sm leading-relaxed", box)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>{message.text}</p>
    </div>
  );
}

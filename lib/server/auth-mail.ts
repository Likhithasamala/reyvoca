/**
 * The actual auth emails, in one file so their wording can be read together.
 *
 * Each one takes the request (to build an absolute link that works on
 * whatever host is serving) and the user. Each returns the send result, so a
 * route can tell the caller honestly whether a mail went out or only landed
 * in the development mailbox.
 */
import { routes } from "@/config/site";
import type { StoredUser } from "./db";
import { sendMail, type SendResult } from "./mail";
import { absoluteUrl } from "./origin";
import { issueToken } from "./tokens";

const firstName = (user: StoredUser): string => user.fullName.split(/\s+/)[0] ?? "there";

/**
 * "Confirm your email address."
 *
 * Sent on sign-up and whenever it is re-requested. The link carries a
 * single-use token; clicking it is the only thing that marks the address
 * confirmed.
 */
export async function sendVerificationEmail(
  request: Request,
  user: StoredUser,
): Promise<SendResult> {
  const { token } = await issueToken(user.id, "email_verify");
  // The API route, not the page: redeeming happens there, and it then
  // redirects to a clean URL with no token left in the address bar.
  const url = absoluteUrl(request, `/api/auth/verify-email?token=${token}`);

  return sendMail({
    to: user.email,
    subject: "Confirm your email address",
    heading: "Confirm your email address",
    body: [
      `Hi ${firstName(user)},`,
      "Welcome to Reyvoca. Confirm this address so we can reach you about your workspace and your agents.",
      "The link works once and expires in 24 hours.",
    ],
    action: { label: "Confirm email address", url },
    footer: "If you did not create a Reyvoca account, you can ignore this email.",
  });
}

/**
 * "Reset your password."
 *
 * Note what is *not* here: the email never says whether an account exists.
 * It is only sent when one does, and the endpoint answers identically either
 * way, so the flow cannot be used to discover who has an account.
 */
export async function sendPasswordResetEmail(
  request: Request,
  user: StoredUser,
): Promise<SendResult> {
  const { token } = await issueToken(user.id, "password_reset");
  const url = absoluteUrl(request, `${routes.resetPassword}?token=${token}`);

  return sendMail({
    to: user.email,
    subject: "Reset your Reyvoca password",
    heading: "Reset your password",
    body: [
      `Hi ${firstName(user)},`,
      "Use the button below to choose a new password. The link works once and expires in 30 minutes.",
      "Setting a new password signs you out on every other device.",
    ],
    action: { label: "Choose a new password", url },
    footer:
      "If you did not ask for this, nothing has changed and you can ignore this email. Your current password still works.",
  });
}

/**
 * "Confirm your new email address."
 *
 * Sent to the *new* address. The change only takes effect when that link is
 * clicked, which is what proves the person asking owns the new mailbox.
 */
export async function sendEmailChangeEmail(
  request: Request,
  user: StoredUser,
  pendingEmail: string,
): Promise<SendResult> {
  const { token } = await issueToken(user.id, "email_change", { pendingEmail });
  const url = absoluteUrl(request, `${routes.account}?emailToken=${token}`);

  return sendMail({
    to: pendingEmail,
    subject: "Confirm your new email address",
    heading: "Confirm your new email address",
    body: [
      `Hi ${firstName(user)},`,
      `You asked to change the email on your Reyvoca account from <strong>${user.email}</strong> to this address.`,
      "Confirm it below. The link works once and expires in an hour.",
    ],
    action: { label: "Confirm this address", url },
    footer: "If you did not ask for this, ignore this email and the change will not happen.",
  });
}

/**
 * "Your password was changed."
 *
 * A notification, not a request — there is nothing to click. This is the mail
 * that lets someone notice an account takeover, so it goes out on every
 * password change and every reset, without exception.
 */
export async function sendPasswordChangedEmail(
  request: Request,
  user: StoredUser,
): Promise<SendResult> {
  return sendMail({
    to: user.email,
    subject: "Your Reyvoca password was changed",
    heading: "Your password was changed",
    body: [
      `Hi ${firstName(user)},`,
      "The password on your Reyvoca account was just changed, and every other signed-in device was signed out.",
    ],
    action: { label: "Review your account", url: absoluteUrl(request, routes.account) },
    footer:
      "If this was not you, reset your password immediately and contact us — someone else may have had access.",
  });
}

/**
 * "Your email address was changed."
 *
 * Sent to the *old* address after a change completes, so losing control of an
 * account cannot be hidden from the person who owned it.
 */
export async function sendEmailChangedNotice(
  request: Request,
  user: StoredUser,
  previousEmail: string,
): Promise<SendResult> {
  return sendMail({
    to: previousEmail,
    subject: "Your Reyvoca email address was changed",
    heading: "Your email address was changed",
    body: [
      `Hi ${firstName(user)},`,
      `The email on your Reyvoca account was changed from this address to <strong>${user.email}</strong>.`,
    ],
    footer: "If this was not you, contact us straight away — this address can no longer sign in.",
  });
}

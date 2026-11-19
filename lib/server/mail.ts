/**
 * Outgoing transactional email.
 *
 * One function, `sendMail`, with two backends chosen by configuration:
 *
 *  - **Resend** when `RESEND_API_KEY` is set. Called over its HTTP API with
 *    `fetch`, so there is no SDK dependency to keep current.
 *  - **the dev mailbox** when it is not. Nothing is sent; the link is written
 *    to the terminal and kept in the database so it can be clicked from
 *    `/admin/mailbox`. This is what makes the whole flow testable on
 *    localhost before any provider exists — and it never pretends a mail
 *    went out when it did not.
 *
 * Every send is recorded in `mailLog` either way. In Resend mode the link is
 * deliberately NOT recorded: a reset link in a log file is a reset link in
 * the wrong hands.
 */
import { mutate, newId, type StoredMailLog } from "./db";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** Where mail appears to come from. Must be a domain verified with Resend. */
const from = (): string => process.env.REYVOCA_MAIL_FROM ?? "Reyvoca <onboarding@resend.dev>";

export const mailConfigured = (): boolean => Boolean(process.env.RESEND_API_KEY);

export type MailContent = {
  to: string;
  subject: string;
  /** Big line at the top of the message. */
  heading: string;
  /** One paragraph per entry. */
  body: string[];
  action?: { label: string; url: string };
  /** Small print under the button — what to do if it wasn't you. */
  footer?: string;
};

/**
 * Renders the message.
 *
 * Email clients are a decade behind browsers, so this stays inside the subset
 * they all agree on: inline styles, no flexbox, no custom fonts, a table for
 * the button. The palette is Ink & Ember so the mail looks like the product.
 */
function render(content: MailContent): { html: string; text: string } {
  const paragraphs = content.body
    .map(
      (line) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#45413c;">${line}</p>`,
    )
    .join("");

  const button = content.action
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
         <tr><td style="border-radius:999px;background:#e4501c;">
           <a href="${content.action.url}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px;">${content.action.label}</a>
         </td></tr>
       </table>
       <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#78736c;">
         If the button does not work, paste this into your browser:<br>
         <a href="${content.action.url}" style="color:#b23c10;word-break:break-all;">${content.action.url}</a>
       </p>`
    : "";

  const footer = content.footer
    ? `<p style="margin:24px 0 0;padding-top:20px;border-top:1px solid #e7e2d8;font-size:13px;line-height:1.6;color:#78736c;">${content.footer}</p>`
    : "";

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${content.subject}</title></head>
<body style="margin:0;padding:0;background:#faf7f2;">
  <div style="display:none;max-height:0;overflow:hidden;">${content.heading}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e7e2d8;border-radius:16px;overflow:hidden;">
        <tr><td style="background:#1c1a17;padding:20px 28px;">
          <span style="font-size:17px;font-weight:600;letter-spacing:-0.02em;color:#ffffff;">Reyvoca</span>
        </td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 16px;font-size:21px;line-height:1.3;font-weight:600;letter-spacing:-0.02em;color:#1c1a17;">${content.heading}</h1>
          ${paragraphs}
          ${button}
          ${footer}
        </td></tr>
      </table>
      <p style="margin:20px 0 0;font-size:12px;color:#978f84;">Reyvoca — AI voice agents for real business conversations.</p>
    </td></tr>
  </table>
</body></html>`;

  const text = [
    content.heading,
    "",
    ...content.body.map((line) => line.replace(/<[^>]+>/g, "")),
    content.action ? `\n${content.action.label}: ${content.action.url}` : "",
    content.footer ? `\n${content.footer.replace(/<[^>]+>/g, "")}` : "",
    "\n— Reyvoca",
  ].join("\n");

  return { html, text };
}

export type SendResult = { delivered: boolean; provider: "resend" | "dev"; error?: string };

/** Sends the message, or records it in the dev mailbox when unconfigured. */
export async function sendMail(content: MailContent): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const { html, text } = render(content);

  const log = async (row: Omit<StoredMailLog, "id" | "createdAt">) => {
    await mutate((db) => {
      db.mailLog.unshift({ ...row, id: newId(), createdAt: new Date().toISOString() });
      // The mailbox is a development convenience, not an archive.
      db.mailLog = db.mailLog.slice(0, 50);
    });
  };

  if (!apiKey) {
    // No provider: be honest and useful rather than silent.
    console.info(
      `[reyvoca mail] no RESEND_API_KEY — "${content.subject}" for ${content.to} was not sent.` +
        (content.action ? `\n[reyvoca mail] link: ${content.action.url}` : ""),
    );
    await log({
      to: content.to,
      subject: content.subject,
      provider: "dev",
      status: "sent",
      actionUrl: content.action?.url,
    });
    return { delivered: false, provider: "dev" };
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: from(), to: [content.to], subject: content.subject, html, text }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      // Resend's own message is the useful part (unverified domain, bad key).
      const error = `Resend returned ${response.status}. ${detail.slice(0, 300)}`;
      console.error(`[reyvoca mail] ${error}`);
      await log({ to: content.to, subject: content.subject, provider: "resend", status: "failed", error });
      return { delivered: false, provider: "resend", error };
    }

    // Deliberately no actionUrl: the live link never enters the database.
    await log({ to: content.to, subject: content.subject, provider: "resend", status: "sent" });
    return { delivered: true, provider: "resend" };
  } catch (cause) {
    const error = cause instanceof Error ? cause.message : "Unknown mail error.";
    console.error(`[reyvoca mail] ${error}`);
    await log({ to: content.to, subject: content.subject, provider: "resend", status: "failed", error });
    return { delivered: false, provider: "resend", error };
  }
}

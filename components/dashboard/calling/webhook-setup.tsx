"use client";

import { Check, Copy, KeyRound, RefreshCw, Send } from "lucide-react";
import { useState } from "react";
import { Action } from "@/components/panel/action";
import { SectionCard } from "@/components/panel/section-card";
import { StatusBadge, type StatusTone } from "@/components/panel/status-badge";
import { EXAMPLE_LEAD_EVENT, webhookConfig } from "@/lib/calling/integration-service";
import type { WebhookEvent } from "@/types/calling";

const resultTones: Record<WebhookEvent["status"], StatusTone> = {
  accepted: "positive",
  duplicate: "attention",
  rejected: "neutral",
};

function CopyRow({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be blocked; the value stays selectable in the field.
    }
  }

  return (
    <div>
      <p className="mb-1.5 text-[0.8125rem] font-medium text-ink">{label}</p>
      <div className="flex items-stretch gap-2">
        <code
          className={`min-w-0 flex-1 truncate rounded-lg border border-line bg-surface-muted px-3 py-2 text-xs text-ink ${
            mono ? "font-mono" : ""
          }`}
        >
          {value}
        </code>
        <Action variant="secondary" size="sm" onClick={copy} aria-label={`Copy ${label}`}>
          {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
          {copied ? "Copied" : "Copy"}
        </Action>
      </div>
    </div>
  );
}

/**
 * Webhook configuration.
 *
 * The endpoint is shown as a preview: the route is issued per workspace when
 * calling is enabled, and the signing secret is generated server-side and
 * revealed once at that point. No secret is ever stored in or served from the
 * frontend, so the field here is a placeholder, not a masked real value.
 */
export function WebhookSetup({
  events,
  onSendTestEvent,
  onReplayLastEvent,
}: {
  events: WebhookEvent[];
  /** Runs the example payload through the real validation path, locally. */
  onSendTestEvent: () => void;
  /** Re-sends the last payload with its original key, to prove de-duplication. */
  onReplayLastEvent: () => void;
  }) {
  return (
    <div className="space-y-4">
      <SectionCard
        title="Endpoint"
        description="Post a lead event here and Reyvoca normalises it into the internal lead.created event."
      >
        <div className="space-y-4">
          <CopyRow label="Webhook URL" value={webhookConfig.previewUrl} />

          <div>
            <p className="mb-1.5 text-[0.8125rem] font-medium text-ink">Signing secret</p>
            <div className="flex items-center gap-2.5 rounded-lg border border-line bg-surface-muted px-3 py-2">
              <KeyRound className="size-4 shrink-0 text-ink-subtle" strokeWidth={1.75} aria-hidden="true" />
              <code className="min-w-0 flex-1 truncate font-mono text-xs text-ink-subtle">
                {webhookConfig.secretPlaceholder}
              </code>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-subtle text-pretty">
              Generated server-side and shown once when your endpoint is issued. Reyvoca signs every delivery with it in
              the <code className="font-mono">{webhookConfig.signatureHeader}</code> header — verify that signature
              before trusting a payload.
            </p>
          </div>

          <p className="rounded-lg border border-line bg-surface-muted px-3.5 py-2.5 text-xs leading-relaxed text-ink-muted">
            <span className="font-medium text-ink">Preview.</span> This URL is the shape your endpoint will take. It is
            not live yet, so posting to it will not reach Reyvoca.
          </p>
        </div>
      </SectionCard>

      <SectionCard
        title="Expected payload"
        description="Any source can send this. Reyvoca maps it onto one internal event, so nothing downstream is tied to a particular provider."
      >
        <pre className="overflow-x-auto rounded-lg border border-line bg-night px-3.5 py-3 text-xs leading-relaxed text-night-text">
          <code className="font-mono">{EXAMPLE_LEAD_EVENT}</code>
        </pre>
        <p className="mt-2.5 text-xs leading-relaxed text-ink-subtle text-pretty">
          Only <code className="font-mono">phone</code> is required. Send{" "}
          <code className="font-mono">idempotency_key</code> (or <code className="font-mono">external_id</code>) so a
          retried delivery is recognised instead of producing a second call.
        </p>
      </SectionCard>

      <SectionCard
        title="Deliveries"
        description="The most recent events Reyvoca accepted or rejected."
        action={
          <div className="flex items-center gap-2">
            <Action
              variant="secondary"
              size="sm"
              onClick={onReplayLastEvent}
              disabled={events.length === 0}
              title="Re-send the last payload with the same idempotency key"
            >
              <RefreshCw className="size-4" aria-hidden="true" /> Replay
            </Action>
            <Action variant="secondary" size="sm" onClick={onSendTestEvent}>
              <Send className="size-4" aria-hidden="true" /> Send test event
            </Action>
          </div>
        }
      >
        {events.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line-strong px-3.5 py-6 text-center text-xs leading-relaxed text-ink-muted">
            No deliveries yet. Send a test event to see how a lead is validated, queued or rejected.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {events.map((event) => (
              <li key={event.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <code className="font-mono text-xs text-ink">{event.event}</code>
                    <StatusBadge status={event.status} tone={resultTones[event.status]} />
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-muted text-pretty">{event.message}</p>
                </div>
                <time className="shrink-0 text-[0.6875rem] text-ink-subtle tabular-nums">
                  {new Date(event.receivedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </time>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-ink-subtle">
          Test events run locally through the same validation rules a real delivery will use. Nothing is sent over the
          network and no call is placed. <span className="font-medium text-ink">Replay</span> re-sends the last payload
          with its original key — it should be recorded as a duplicate, not queued a second time.
        </p>
      </SectionCard>
    </div>
  );
}

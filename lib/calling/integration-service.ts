"use client";

/**
 * Integration catalogue and defaults.
 *
 * This file decides what Reyvoca *says* it can do. Every entry carries an
 * honest availability flag, because the calling infrastructure does not exist
 * yet and the UI must not imply a live connection. Nothing here performs OAuth
 * or holds a credential — provider secrets belong server-side.
 */
import type {
  ActionAvailability,
  CallingRules,
  LeadSource,
  PostCallAction,
  PostCallActionType,
} from "@/types/calling";

/* ------------------------------------------------------------------ */
/* Lead sources                                                        */
/* ------------------------------------------------------------------ */

export type SourceStatus = "available_for_setup" | "requires_webhook" | "planned";

export const SOURCE_STATUS_LABELS: Record<SourceStatus, string> = {
  available_for_setup: "Available for setup",
  requires_webhook: "Requires webhook",
  planned: "Planned integration",
};

export type SourceOption = {
  source: LeadSource;
  title: string;
  description: string;
  status: SourceStatus;
};

/**
 * What a customer can point at Reyvoca.
 *
 * Everything funnels into the same `lead.created` event, so adding a source
 * later changes this list and nothing downstream.
 */
export const LEAD_SOURCES: SourceOption[] = [
  {
    source: "webhook",
    title: "Webhook",
    description: "Post a lead to Reyvoca from any system that can send JSON.",
    status: "available_for_setup",
  },
  {
    source: "website_form",
    title: "Website Form",
    description: "Send submissions from your own site or landing page.",
    status: "requires_webhook",
  },
  {
    source: "meta_lead_ads",
    title: "Meta Lead Ads",
    description: "Instagram and Facebook lead forms, forwarded as lead events.",
    status: "planned",
  },
  {
    source: "crm",
    title: "CRM",
    description: "Push new records from your CRM as they are created.",
    status: "planned",
  },
  {
    source: "api",
    title: "API",
    description: "Create leads directly from your own backend.",
    status: "planned",
  },
  {
    source: "custom",
    title: "Custom Integration",
    description: "Anything that can deliver a lead event — automation tools included.",
    status: "requires_webhook",
  },
];

/* ------------------------------------------------------------------ */
/* Post-call actions                                                   */
/* ------------------------------------------------------------------ */

/**
 * What Reyvoca does once the conversation ends.
 *
 * Only "update_lead" is `available`: it is Reyvoca writing to its own record.
 * Everything else needs a connector that does not exist, and says so.
 */
export const POST_CALL_ACTIONS: PostCallAction[] = [
  {
    type: "update_lead",
    label: "Update lead in Reyvoca",
    description: "Write the outcome, summary and next action onto the lead record.",
    availability: "available",
  },
  {
    type: "create_callback",
    label: "Create callback",
    description: "Schedule a follow-up call when the customer asks to be called back.",
    availability: "available",
  },
  {
    type: "assign_human",
    label: "Assign human follow-up",
    description: "Flag the lead for a teammate when the agent cannot finish the job.",
    availability: "available",
  },
  {
    type: "book_meeting",
    label: "Book meeting",
    description: "Offer a free slot, confirm it and create the calendar event.",
    availability: "requires_integration",
    requires: "Ready when a calendar is connected",
  },
  {
    type: "send_email",
    label: "Send follow-up email",
    description: "Send a confirmation or information email after the call.",
    availability: "requires_integration",
    requires: "Requires an email sender",
  },
  {
    type: "update_crm",
    label: "Update CRM",
    description: "Write the outcome back to the matching record in your CRM.",
    availability: "requires_integration",
    requires: "Requires a CRM connection",
  },
  {
    type: "send_webhook",
    label: "Send webhook",
    description: "Post the structured result to a URL of your choice.",
    availability: "planned",
  },
  {
    type: "create_task",
    label: "Create task",
    description: "Open a task for your team from the call result.",
    availability: "planned",
  },
];

export const AVAILABILITY_LABELS: Record<ActionAvailability, string> = {
  available: "Available",
  requires_integration: "Requires integration",
  planned: "Planned",
};

/** Actions Reyvoca can perform on its own, enabled by default. */
export const DEFAULT_ACTIONS: PostCallActionType[] = ["update_lead", "create_callback"];

export const getAction = (type: PostCallActionType): PostCallAction =>
  POST_CALL_ACTIONS.find((action) => action.type === type) ?? POST_CALL_ACTIONS[0];

/* ------------------------------------------------------------------ */
/* Webhook configuration                                               */
/* ------------------------------------------------------------------ */

/**
 * The endpoint shape a customer will post to.
 *
 * This is a preview, not a live endpoint — the workspace segment is a
 * placeholder and the route does not exist until calling is enabled.
 */
export const webhookConfig = {
  previewUrl: "https://api.reyvoca.com/v1/workspaces/{workspace_id}/leads",
  /**
   * Never a real value. The signing secret is generated server-side and shown
   * once at issue time; it is not stored in or served from the frontend.
   */
  secretPlaceholder: "whsec_" + "•".repeat(28),
  signatureHeader: "Reyvoca-Signature",
};

/** Documentation payload. Fictional contact details only. */
export const EXAMPLE_LEAD_EVENT = `{
  "event": "lead.created",
  "idempotency_key": "crm-8f21c0",
  "lead": {
    "name": "Demo Customer",
    "phone": "+910000000001",
    "email": "demo@example.com",
    "source": "meta_lead_ads",
    "requirement": "Looking for a 3BHK apartment",
    "external_id": "DEMO-1001",
    "metadata": {
      "campaign": "October Campaign"
    }
  }
}`;

/* ------------------------------------------------------------------ */
/* Defaults                                                            */
/* ------------------------------------------------------------------ */

/**
 * Conservative defaults. Repeated dialling is a compliance risk, so retries
 * start low and the calling window is a normal working day.
 */
export const DEFAULT_CALLING_RULES: CallingRules = {
  window: { start: "09:00", end: "19:00", timezone: "Workspace timezone" },
  retry: { retryOnNoAnswer: true, maxRetries: 2, retryDelayMinutes: 60 },
  respectDoNotCall: true,
};

/**
 * Selectable pace. The ceiling is intentionally modest: the real rate depends
 * on the telephony provider, voice provider, concurrency and local regulation.
 */
export const PACE_OPTIONS = [1, 3, 5, 10] as const;
export const MAX_CONCURRENT_OPTIONS = [1, 2, 5, 10] as const;

export const TIMEZONE_OPTIONS = [
  "Workspace timezone",
  "Contact's local time",
  "(UTC+05:30) India Standard Time",
  "(UTC+00:00) Coordinated Universal Time",
  "(UTC−08:00) Pacific Time",
] as const;

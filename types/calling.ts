/**
 * Reyvoca calling domain model.
 *
 * Instant Leads and Bulk Campaigns are two ways of *starting* a call. Once a
 * call exists, both produce the same normalised Lead record, so there is one
 * leads table, one conversation record and one set of outcomes — never a
 * separate database per channel.
 *
 * Nothing here is provider-specific. Telephony, voice, CRM, calendar and email
 * all sit behind the connector interfaces at the bottom of this file.
 */

/* ------------------------------------------------------------------ */
/* Lead identity                                                       */
/* ------------------------------------------------------------------ */

/** How the call was started. Drives the Leads & Results channel filter. */
export type LeadChannel = "instant" | "bulk" | "inbound";

/** Where the contact originally came from. Normalised from every integration. */
export type LeadSource =
  | "webhook"
  | "website_form"
  | "meta_lead_ads"
  | "crm"
  | "api"
  | "csv_upload"
  | "custom";

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  webhook: "Webhook",
  website_form: "Website Form",
  meta_lead_ads: "Meta Lead Ads",
  crm: "CRM",
  api: "API",
  csv_upload: "CSV Upload",
  custom: "Custom Integration",
};

export const LEAD_CHANNEL_LABELS: Record<LeadChannel, string> = {
  instant: "Instant",
  bulk: "Bulk",
  inbound: "Inbound",
};

/* ------------------------------------------------------------------ */
/* Call lifecycle                                                      */
/* ------------------------------------------------------------------ */

/**
 * Where a lead sits in the calling pipeline. Terminal states are listed in
 * TERMINAL_CALL_STATUSES below.
 */
export type CallStatus =
  | "received"
  | "validating"
  | "invalid"
  | "queued"
  | "calling"
  | "connected"
  | "in_conversation"
  | "processing"
  | "completed"
  | "no_answer"
  | "busy"
  | "failed"
  | "cancelled";

export const CALL_STATUS_LABELS: Record<CallStatus, string> = {
  received: "Received",
  validating: "Validating",
  invalid: "Invalid Lead",
  queued: "Queued",
  calling: "Calling",
  connected: "Connected",
  in_conversation: "Conversation",
  processing: "Processing result",
  completed: "Completed",
  no_answer: "No Answer",
  busy: "Busy",
  failed: "Failed",
  cancelled: "Cancelled",
};

/** Statuses where no further work happens without a retry. */
export const TERMINAL_CALL_STATUSES: readonly CallStatus[] = [
  "invalid",
  "completed",
  "no_answer",
  "busy",
  "failed",
  "cancelled",
];

/**
 * Why a call could not be completed. Kept separate from CallStatus so the UI
 * can explain the actual problem instead of a generic failure message.
 */
export type CallFailureReason =
  | "invalid_number"
  | "provider_unavailable"
  | "busy"
  | "no_answer"
  | "agent_unavailable"
  | "call_failed"
  | "do_not_call"
  | "outside_calling_hours";

export const CALL_FAILURE_LABELS: Record<CallFailureReason, string> = {
  invalid_number: "Invalid number",
  provider_unavailable: "Calling provider unavailable",
  busy: "Line busy",
  no_answer: "No answer",
  agent_unavailable: "Agent unavailable",
  call_failed: "Call failed",
  do_not_call: "On Do Not Call list",
  outside_calling_hours: "Outside calling hours",
};

/* ------------------------------------------------------------------ */
/* Outcomes                                                            */
/* ------------------------------------------------------------------ */

/** What the conversation achieved. Shared by both calling channels. */
export type CallOutcome =
  | "qualified"
  | "interested"
  | "meeting_booked"
  | "callback"
  | "not_interested"
  | "no_answer"
  | "wrong_number"
  | "do_not_call"
  | "unknown";

export const CALL_OUTCOME_LABELS: Record<CallOutcome, string> = {
  qualified: "Qualified",
  interested: "Interested",
  meeting_booked: "Meeting Booked",
  callback: "Callback",
  not_interested: "Not Interested",
  no_answer: "No Answer",
  wrong_number: "Wrong Number",
  do_not_call: "Do Not Call",
  unknown: "Unknown",
};

export type InterestLevel = "high" | "medium" | "low" | "none";

/**
 * Structured data the agent extracts from a conversation.
 *
 * This is the contract the backend will fill — the UI reads it, it is never
 * authored in the frontend. Every field is optional because an agent only
 * captures what the configured qualification goals ask for.
 */
export type StructuredOutcome = {
  outcome: CallOutcome;
  interestLevel?: InterestLevel;
  requirement?: string;
  budget?: string;
  location?: string;
  preferredDate?: string;
  callbackRequested?: boolean;
  callbackAt?: string;
  meetingRequested?: boolean;
  emailConfirmed?: boolean;
  doNotCall?: boolean;
  summary?: string;
  notes?: string;
  /** Extra fields driven by the configured qualification goals. */
  fields?: Record<string, string>;
};

/** Fields an agent can be asked to capture. Configured per setup/campaign. */
export type QualificationGoal =
  | "interest_level"
  | "requirement"
  | "budget"
  | "location"
  | "preferred_date"
  | "callback_requested"
  | "meeting_requested"
  | "email_confirmed"
  | "notes";

export const QUALIFICATION_GOAL_LABELS: Record<QualificationGoal, string> = {
  interest_level: "Interest Level",
  requirement: "Requirement",
  budget: "Budget",
  location: "Location",
  preferred_date: "Preferred Date",
  callback_requested: "Callback Requested",
  meeting_requested: "Meeting Requested",
  email_confirmed: "Email Confirmed",
  notes: "Notes",
};

/* ------------------------------------------------------------------ */
/* Human follow-up                                                     */
/* ------------------------------------------------------------------ */

export type HumanFollowUpReason =
  | "customer_requested_human"
  | "agent_uncertain"
  | "pricing_question"
  | "complaint"
  | "high_value_lead"
  | "complex_requirement";

export const HUMAN_FOLLOW_UP_LABELS: Record<HumanFollowUpReason, string> = {
  customer_requested_human: "Customer requested a human",
  agent_uncertain: "Agent was uncertain",
  pricing_question: "Pricing question",
  complaint: "Complaint",
  high_value_lead: "High value lead",
  complex_requirement: "Complex requirement",
};

/* ------------------------------------------------------------------ */
/* The normalised lead                                                 */
/* ------------------------------------------------------------------ */

/**
 * One record per contact, whatever started the call.
 *
 * externalId keeps the Reyvoca lead linked to the record in the customer's own
 * CRM, so an update can be written back to the right place.
 */
export type Lead = {
  id: string;
  name?: string;
  /** The only genuinely required field — without it no call can be placed. */
  phone: string;
  email?: string;
  source: LeadSource;
  channel: LeadChannel;
  agentId?: string;
  agentName?: string;
  campaignId?: string;
  /** Identifier in the source system (CRM record id, form submission id…). */
  externalId?: string;
  status: CallStatus;
  outcome?: CallOutcome;
  failureReason?: CallFailureReason;
  interestLevel?: InterestLevel;
  requirement?: string;
  summary?: string;
  callbackAt?: string;
  meetingId?: string;
  conversationId?: string;
  lastCallAt?: string;
  /** Short human-readable description of what happens next. */
  nextAction?: string;
  needsHuman?: HumanFollowUpReason;
  doNotCall?: boolean;
  attempts: number;
  /** Unmapped CSV columns and webhook metadata are preserved here. */
  metadata?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};

/* ------------------------------------------------------------------ */
/* Incoming lead events                                                */
/* ------------------------------------------------------------------ */

/**
 * Internal event name. Every integration — Meta, a website form, a CRM, a raw
 * webhook — is normalised to this, so nothing downstream is Meta-specific.
 */
export type LeadEventType =
  | "lead.created"
  | "lead.updated"
  | "lead.qualified"
  | "lead.callback_requested";

/** The payload shape Reyvoca accepts on the inbound webhook. */
export type LeadEventPayload = {
  event: LeadEventType;
  /**
   * Caller-supplied unique id for this delivery. A CRM that retries a webhook
   * sends the same key, and the second delivery is ignored rather than
   * producing a duplicate call.
   */
  idempotencyKey?: string;
  lead: {
    name?: string;
    phone?: string;
    email?: string;
    source?: string;
    requirement?: string;
    externalId?: string;
    language?: string;
    city?: string;
    metadata?: Record<string, string>;
  };
};

/** Result of validating an inbound payload before anything is queued. */
export type LeadValidation =
  | { valid: true; lead: Lead }
  | { valid: false; reason: string; detail?: string };

/** One row in the webhook delivery log. */
export type WebhookEvent = {
  id: string;
  event: LeadEventType;
  receivedAt: string;
  status: "accepted" | "rejected" | "duplicate";
  message: string;
  leadId?: string;
};

/* ------------------------------------------------------------------ */
/* Calling rules                                                       */
/* ------------------------------------------------------------------ */

export type CallingWindow = {
  /** 24h local time, e.g. "09:00". */
  start: string;
  end: string;
  timezone: string;
};

export type RetryPolicy = {
  retryOnNoAnswer: boolean;
  /** Conservative by default — repeated dialling is a compliance risk. */
  maxRetries: number;
  /** Minutes between attempts. */
  retryDelayMinutes: number;
};

export type CallingRules = {
  window: CallingWindow;
  retry: RetryPolicy;
  /** The Do Not Call list is always honoured; this is not user-disableable. */
  respectDoNotCall: true;
};

/** Instant-specific: how soon after the event the call is placed. */
export type InstantTiming = {
  mode: "immediate" | "delayed";
  delayMinutes: number;
};

/** Bulk-specific: how fast the list is worked through. */
export type CampaignPace = {
  callsPerMinute: number;
  maxConcurrentCalls: number;
};

/* ------------------------------------------------------------------ */
/* Post-call actions                                                   */
/* ------------------------------------------------------------------ */

export type PostCallActionType =
  | "update_lead"
  | "update_crm"
  | "book_meeting"
  | "create_callback"
  | "send_email"
  | "send_webhook"
  | "assign_human"
  | "create_task";

/**
 * Whether an action can actually run.
 *
 * "available" is reserved for things Reyvoca does itself. Anything needing an
 * outside system stays "requires_integration" until that connector exists —
 * the UI must never imply a connection that is not there.
 */
export type ActionAvailability = "available" | "requires_integration" | "planned";

export type PostCallAction = {
  type: PostCallActionType;
  label: string;
  description: string;
  availability: ActionAvailability;
  /** What has to be connected first, shown next to the action. */
  requires?: string;
};

/** Configuration for the send-email action. */
export type EmailActionConfig = {
  template:
    | "meeting_confirmation"
    | "product_information"
    | "brochure"
    | "callback_confirmation"
    | "thank_you";
  recipient: "lead_email" | "custom";
  subject: string;
};

/** Configuration for the book-meeting action. */
export type MeetingActionConfig = {
  calendar: "google" | "calendly" | "crm" | "custom";
  durationMinutes: number;
  meetingType: "online" | "phone" | "in_person";
  confirmation: "email" | "sms" | "none";
};

/* ------------------------------------------------------------------ */
/* Instant Leads setup                                                 */
/* ------------------------------------------------------------------ */

export type InstantSetupStatus = "not_configured" | "ready" | "active" | "paused";

export const INSTANT_STATUS_LABELS: Record<InstantSetupStatus, string> = {
  not_configured: "Not configured",
  ready: "Ready",
  active: "Active",
  paused: "Paused",
};

export type InstantSetup = {
  status: InstantSetupStatus;
  source?: LeadSource;
  agentId?: string;
  agentName?: string;
  timing: InstantTiming;
  rules: CallingRules;
  goals: QualificationGoal[];
  actions: PostCallActionType[];
  updatedAt?: string;
};

/* ------------------------------------------------------------------ */
/* Bulk campaigns                                                      */
/* ------------------------------------------------------------------ */

export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "running"
  | "paused"
  | "completed"
  | "stopped"
  | "failed";

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  running: "Running",
  paused: "Paused",
  completed: "Completed",
  stopped: "Stopped",
  failed: "Failed",
};

export type CampaignType =
  | "lead_qualification"
  | "follow_up"
  | "renewal"
  | "appointment"
  | "recruitment"
  | "custom";

export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  lead_qualification: "Lead Qualification",
  follow_up: "Follow-up",
  renewal: "Renewal",
  appointment: "Appointment",
  recruitment: "Recruitment",
  custom: "Custom",
};

/** A contact row after CSV parsing, mapping and validation. */
export type CampaignContact = {
  id: string;
  name?: string;
  phone: string;
  email?: string;
  requirement?: string;
  language?: string;
  city?: string;
  externalId?: string;
  notes?: string;
  /** Unmapped columns, preserved so nothing the customer uploaded is lost. */
  metadata?: Record<string, string>;
  status: CallStatus;
  outcome?: CallOutcome;
  /** Set when the row cannot be called; the row is kept but never dialled. */
  invalidReason?: string;
  excluded?: boolean;
};

export type CampaignProgress = {
  total: number;
  queued: number;
  calling: number;
  connected: number;
  completed: number;
  qualified: number;
  callbacks: number;
  failed: number;
};

export type Campaign = {
  id: string;
  name: string;
  description?: string;
  type: CampaignType;
  status: CampaignStatus;
  agentId?: string;
  agentName?: string;
  contacts: CampaignContact[];
  pace: CampaignPace;
  rules: CallingRules;
  goals: QualificationGoal[];
  actions: PostCallActionType[];
  outcomes: CallOutcome[];
  scheduledFor?: string;
  createdAt: string;
  updatedAt: string;
  /** Marks the seeded example campaign so the UI can label it honestly. */
  isDemo?: boolean;
};

/* ------------------------------------------------------------------ */
/* Realtime                                                            */
/* ------------------------------------------------------------------ */

/**
 * Events the backend will emit once calling is live. The UI subscribes to
 * these names today through a local emitter, so swapping in a WebSocket or
 * SSE transport later does not touch any component.
 */
export type CallEventType =
  | "lead.received"
  | "lead.updated"
  | "call.queued"
  | "call.started"
  | "call.connected"
  | "call.completed"
  | "meeting.booked"
  | "campaign.progress"
  | "campaign.completed";

export type CallEvent =
  | { type: "lead.received"; at: string; lead: Lead }
  | { type: "lead.updated"; at: string; lead: Lead }
  | { type: "call.queued"; at: string; leadId: string }
  | { type: "call.started"; at: string; leadId: string }
  | { type: "call.connected"; at: string; leadId: string }
  | { type: "call.completed"; at: string; leadId: string; outcome: StructuredOutcome }
  | { type: "meeting.booked"; at: string; leadId: string; meetingId: string }
  | { type: "campaign.progress"; at: string; campaignId: string; progress: CampaignProgress }
  | { type: "campaign.completed"; at: string; campaignId: string };

/** Transport-agnostic subscription. A WebSocket/SSE client implements this. */
export interface RealtimeChannel {
  subscribe(listener: (event: CallEvent) => void): () => void;
  /** True only when connected to a real backend stream. */
  readonly isLive: boolean;
}

/* ------------------------------------------------------------------ */
/* Provider abstraction                                                */
/* ------------------------------------------------------------------ */

/**
 * Reyvoca talks to these interfaces, never to a vendor SDK. No part of Instant
 * Leads or Bulk Campaigns assumes a particular telephony or voice supplier.
 */
export interface TelephonyProvider {
  readonly name: string;
  readonly maxConcurrentCalls: number;
}

export interface VoiceProvider {
  readonly name: string;
  readonly languages: string[];
}

export interface CRMConnector {
  readonly name: string;
  readonly connected: boolean;
}

export interface CalendarConnector {
  readonly name: string;
  readonly connected: boolean;
}

export interface EmailConnector {
  readonly name: string;
  readonly connected: boolean;
}

export interface LeadSourceConnector {
  readonly source: LeadSource;
  readonly connected: boolean;
}

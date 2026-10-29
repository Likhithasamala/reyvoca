/**
 * Server-side lead handling.
 *
 * Validation, de-duplication and normalisation live here rather than in the
 * browser: a webhook from a CRM never runs client code, so the server has to
 * be the authority on what becomes a callable lead.
 */
import {
  isValidPhone,
  normalizePhone,
  normalizeSource,
} from "@/lib/calling/normalize";
import type {
  Lead,
  LeadChannel,
  LeadEventPayload,
  LeadValidation,
  WebhookEvent,
} from "@/types/calling";
import { mutate, newId, type Database } from "./db";

export type IngestContext = {
  workspaceId: string;
  channel: LeadChannel;
  agentId?: string;
  agentName?: string;
  campaignId?: string;
};

const now = () => new Date().toISOString();

function logEvent(
  db: Database,
  workspaceId: string,
  entry: Omit<WebhookEvent, "id" | "receivedAt">,
): void {
  db.webhookEvents.unshift({ ...entry, workspaceId, id: newId(), receivedAt: now() });
  // Keep the log bounded; it is a debugging aid, not a record of truth.
  db.webhookEvents = db.webhookEvents.slice(0, 200);
}

/**
 * Validates an inbound lead event and, if callable, stores it.
 *
 * Returns a failed validation rather than throwing, because the caller is an
 * HTTP handler that has to answer with a reason.
 */
export async function ingestLead(
  payload: LeadEventPayload,
  context: IngestContext,
): Promise<LeadValidation> {
  const key = payload.idempotencyKey ?? payload.lead.externalId;
  const phone = payload.lead.phone?.trim();

  return mutate((db): LeadValidation => {
    // A CRM that retries a delivery sends the same key; the replay is recorded
    // and no second call is prepared.
    if (key) {
      const seen = db.idempotencyKeys.find(
        (entry) => entry.workspaceId === context.workspaceId && entry.key === key,
      );
      if (seen) {
        logEvent(db, context.workspaceId, {
          event: payload.event,
          status: "duplicate",
          message: `Already processed delivery "${key}" — no second call prepared.`,
          leadId: seen.leadId,
        });
        return { valid: false, reason: "Duplicate event", detail: `Delivery "${key}" was already accepted.` };
      }
    }

    if (!phone) {
      logEvent(db, context.workspaceId, {
        event: payload.event,
        status: "rejected",
        message: "Phone number required.",
      });
      return { valid: false, reason: "Invalid Lead", detail: "Phone number required." };
    }

    if (!isValidPhone(phone)) {
      logEvent(db, context.workspaceId, {
        event: payload.event,
        status: "rejected",
        message: `Phone number "${phone}" is not callable.`,
      });
      return { valid: false, reason: "Invalid Lead", detail: "Phone number is not a callable format." };
    }

    const normalized = normalizePhone(phone);

    // Someone who asked not to be called is never queued again.
    const suppressed = db.leads.find(
      (lead) => lead.workspaceId === context.workspaceId && lead.phone === normalized && lead.doNotCall,
    );
    if (suppressed) {
      logEvent(db, context.workspaceId, {
        event: payload.event,
        status: "rejected",
        message: "Contact is on the Do Not Call list.",
      });
      return { valid: false, reason: "Do Not Call", detail: "This contact asked not to be called again." };
    }

    const lead: Lead = {
      id: newId(),
      name: payload.lead.name?.trim() || undefined,
      phone: normalized,
      email: payload.lead.email?.trim() || undefined,
      source: normalizeSource(payload.lead.source),
      channel: context.channel,
      agentId: context.agentId,
      agentName: context.agentName,
      campaignId: context.campaignId,
      externalId: payload.lead.externalId,
      status: "queued",
      requirement: payload.lead.requirement,
      attempts: 0,
      metadata: payload.lead.metadata,
      nextAction: "Call queued",
      createdAt: now(),
      updatedAt: now(),
    };

    db.leads.unshift({ ...lead, workspaceId: context.workspaceId });
    if (key) {
      db.idempotencyKeys.unshift({
        workspaceId: context.workspaceId,
        key,
        leadId: lead.id,
        seenAt: now(),
      });
      db.idempotencyKeys = db.idempotencyKeys.slice(0, 1000);
    }

    logEvent(db, context.workspaceId, {
      event: payload.event,
      status: "accepted",
      message: `Lead accepted and queued for ${context.agentName ?? "the assigned agent"}.`,
      leadId: lead.id,
    });

    return { valid: true, lead };
  });
}

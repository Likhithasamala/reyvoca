"use client";

/**
 * Lead service — the client's view of leads, served by the Reyvoca API.
 *
 * Instant Leads and Bulk Campaigns both end up as the same normalised Lead on
 * the server, so this reads one endpoint and Leads & Results shows one table.
 *
 * Validation and de-duplication deliberately live on the server
 * (`lib/server/leads.ts`): a webhook from a CRM never runs client code, so the
 * browser cannot be the authority on what becomes a callable lead.
 */
import type { Lead, LeadChannel, LeadEventPayload, WebhookEvent } from "@/types/calling";
import { apiFetch, createRemoteStore } from "./remote-store";

export {
  describeNextAction,
  isValidEmail,
  isValidPhone,
  normalizePhone,
  normalizeSource,
} from "./normalize";

const leadStore = createRemoteStore<Lead[]>("/leads", (body) => (body.leads as Lead[]) ?? [], []);
const webhookLogStore = createRemoteStore<WebhookEvent[]>(
  "/webhook-events",
  (body) => (body.events as WebhookEvent[]) ?? [],
  [],
);

export type IngestResult =
  | { valid: true; lead: Lead }
  | { valid: false; reason: string; detail?: string };

export const leadService = {
  list(): Lead[] {
    return leadStore.get();
  },

  get(id: string): Lead | undefined {
    return leadStore.get().find((lead) => lead.id === id);
  },

  /**
   * Posts a lead event to the API.
   *
   * Returns the server's verdict rather than throwing, because callers need to
   * show why a lead was rejected or recognised as a duplicate.
   */
  async ingest(
    payload: LeadEventPayload,
    context: { channel: LeadChannel } = { channel: "instant" },
  ): Promise<IngestResult> {
    try {
      const { lead } = await apiFetch<{ lead: Lead }>("/leads", {
        method: "POST",
        body: JSON.stringify({ ...payload, channel: context.channel }),
      });
      await Promise.all([leadStore.refresh(), webhookLogStore.refresh()]);
      return { valid: true, lead };
    } catch (error) {
      await webhookLogStore.refresh();
      return { valid: false, reason: "Rejected", detail: (error as Error).message };
    }
  },

  refresh: () => Promise.all([leadStore.refresh(), webhookLogStore.refresh()]),

  useLeads: leadStore.use,
  useWebhookLog: webhookLogStore.use,
};

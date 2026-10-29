/**
 * Seeded example data for the calling modules.
 *
 * Every record here is fictional and every surface that renders it is labelled
 * as demo data. Phone numbers use reserved-looking placeholders and example.com
 * addresses — no real contact details are committed to this repository.
 */
import type { Campaign, CampaignContact, Lead } from "@/types/calling";

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3600_000).toISOString();

/* ------------------------------------------------------------------ */
/* Instant Leads — recent activity                                     */
/* ------------------------------------------------------------------ */

export const demoInstantLeads: Lead[] = [
  {
    id: "demo_lead_1",
    name: "Demo Customer",
    phone: "+910000000001",
    email: "demo1@example.com",
    source: "meta_lead_ads",
    channel: "instant",
    agentName: "Sales Agent",
    externalId: "DEMO-1001",
    status: "completed",
    outcome: "meeting_booked",
    interestLevel: "high",
    requirement: "Looking for a 3BHK apartment",
    summary: "Confirmed budget and location, booked a site visit for Thursday.",
    meetingId: "demo_meeting_1",
    lastCallAt: hoursAgo(1),
    nextAction: "Meeting booked",
    attempts: 1,
    createdAt: hoursAgo(1.1),
    updatedAt: hoursAgo(1),
  },
  {
    id: "demo_lead_2",
    name: "Sample Contact",
    phone: "+910000000002",
    email: "demo2@example.com",
    source: "website_form",
    channel: "instant",
    agentName: "Sales Agent",
    externalId: "DEMO-1002",
    status: "completed",
    outcome: "callback",
    interestLevel: "medium",
    requirement: "Pricing for a 20-seat plan",
    summary: "Asked to be called back after 4 PM to discuss pricing.",
    callbackAt: new Date(Date.now() + 5 * 3600_000).toISOString(),
    lastCallAt: hoursAgo(2),
    nextAction: "Call back 4:00 PM",
    attempts: 1,
    createdAt: hoursAgo(2.1),
    updatedAt: hoursAgo(2),
  },
  {
    id: "demo_lead_3",
    name: "Example Lead",
    phone: "+910000000003",
    source: "webhook",
    channel: "instant",
    agentName: "Sales Agent",
    status: "completed",
    outcome: "qualified",
    interestLevel: "high",
    requirement: "Renewal for an existing policy",
    summary: "Customer confirmed renewal intent; asked for a written quote.",
    needsHuman: "pricing_question",
    lastCallAt: hoursAgo(3),
    nextAction: "Hand to sales",
    attempts: 1,
    createdAt: hoursAgo(3.1),
    updatedAt: hoursAgo(3),
  },
  {
    id: "demo_lead_4",
    name: "Test Enquiry",
    phone: "+910000000004",
    source: "meta_lead_ads",
    channel: "instant",
    agentName: "Sales Agent",
    status: "no_answer",
    outcome: "no_answer",
    failureReason: "no_answer",
    lastCallAt: hoursAgo(4),
    nextAction: "Retry later",
    attempts: 2,
    createdAt: hoursAgo(4.2),
    updatedAt: hoursAgo(4),
  },
  {
    id: "demo_lead_5",
    phone: "+910000000005",
    source: "crm",
    channel: "instant",
    status: "invalid",
    failureReason: "invalid_number",
    nextAction: "Phone number required",
    attempts: 0,
    createdAt: hoursAgo(5),
    updatedAt: hoursAgo(5),
  },
];

/* ------------------------------------------------------------------ */
/* Bulk Campaigns — one example campaign mid-run                       */
/* ------------------------------------------------------------------ */

const DEMO_CONTACT_NAMES = [
  "Demo Customer",
  "Sample Contact",
  "Example Lead",
  "Test Enquiry",
  "Demo Prospect",
  "Sample Renewal",
  "Example Follow-up",
  "Test Contact",
];

/**
 * Builds a believable mid-run contact list: a block completed, a couple in
 * flight and the rest still queued.
 */
function buildDemoContacts(): CampaignContact[] {
  const outcomes = ["qualified", "interested", "callback", "not_interested", "no_answer"] as const;

  return Array.from({ length: 48 }, (_, index) => {
    const base: CampaignContact = {
      id: `demo_contact_${index + 1}`,
      name: `${DEMO_CONTACT_NAMES[index % DEMO_CONTACT_NAMES.length]} ${index + 1}`,
      phone: `+9100000${String(10000 + index).slice(-5)}`,
      email: `demo${index + 1}@example.com`,
      requirement: index % 3 === 0 ? "Renewal enquiry" : "Product information",
      language: index % 4 === 0 ? "Hindi" : "English",
      city: index % 2 === 0 ? "Hyderabad" : "Bengaluru",
      externalId: `DEMO-${2000 + index}`,
      status: "queued",
    };

    if (index < 29) {
      const outcome = outcomes[index % outcomes.length];
      return {
        ...base,
        status: outcome === "no_answer" ? "no_answer" : "completed",
        outcome,
      };
    }
    if (index === 29) return { ...base, status: "connected", outcome: undefined };
    if (index === 30) return { ...base, status: "calling", outcome: undefined };
    if (index === 46) return { ...base, invalidReason: "Duplicate phone number" };
    if (index === 47) return { ...base, phone: "", invalidReason: "Phone number required" };
    return base;
  });
}

/**
 * The example campaign shown on an empty workspace.
 *
 * `isDemo` makes every view label it, and the service appends it rather than
 * persisting it, so it can never be confused with a real campaign.
 */
export const demoCampaign: Campaign = {
  id: "demo_campaign",
  name: "Renewal follow-up (example)",
  description: "Example campaign showing how a running list looks in Reyvoca.",
  type: "renewal",
  status: "running",
  agentName: "Renewal Agent",
  contacts: buildDemoContacts(),
  pace: { callsPerMinute: 3, maxConcurrentCalls: 2 },
  rules: {
    window: { start: "09:00", end: "19:00", timezone: "Workspace timezone" },
    retry: { retryOnNoAnswer: true, maxRetries: 2, retryDelayMinutes: 60 },
    respectDoNotCall: true,
  },
  goals: ["interest_level", "requirement", "callback_requested"],
  actions: ["update_lead", "create_callback"],
  outcomes: ["qualified", "interested", "callback", "not_interested", "no_answer"],
  createdAt: hoursAgo(6),
  updatedAt: hoursAgo(0.2),
  isDemo: true,
};

/** Leads the example campaign has produced, for Leads & Results. */
export const demoBulkLeads: Lead[] = [
  {
    id: "demo_bulk_1",
    name: "Demo Customer 1",
    phone: "+910000010000",
    email: "demo1@example.com",
    source: "csv_upload",
    channel: "bulk",
    agentName: "Renewal Agent",
    campaignId: "demo_campaign",
    externalId: "DEMO-2000",
    status: "completed",
    outcome: "qualified",
    interestLevel: "high",
    requirement: "Renewal enquiry",
    summary: "Confirmed renewal and asked for the updated policy document.",
    lastCallAt: hoursAgo(1.5),
    nextAction: "Hand to sales",
    attempts: 1,
    createdAt: hoursAgo(6),
    updatedAt: hoursAgo(1.5),
  },
  {
    id: "demo_bulk_2",
    name: "Sample Contact 2",
    phone: "+910000010001",
    source: "csv_upload",
    channel: "bulk",
    agentName: "Renewal Agent",
    campaignId: "demo_campaign",
    externalId: "DEMO-2001",
    status: "completed",
    outcome: "callback",
    interestLevel: "medium",
    callbackAt: new Date(Date.now() + 20 * 3600_000).toISOString(),
    summary: "Asked to be called back tomorrow morning.",
    lastCallAt: hoursAgo(2.5),
    nextAction: "Call back tomorrow 11:00",
    attempts: 1,
    createdAt: hoursAgo(6),
    updatedAt: hoursAgo(2.5),
  },
  {
    id: "demo_bulk_3",
    name: "Example Lead 3",
    phone: "+910000010002",
    source: "csv_upload",
    channel: "bulk",
    agentName: "Renewal Agent",
    campaignId: "demo_campaign",
    status: "completed",
    outcome: "do_not_call",
    doNotCall: true,
    summary: "Customer asked not to be contacted again.",
    lastCallAt: hoursAgo(3.5),
    nextAction: "Do not call",
    attempts: 1,
    createdAt: hoursAgo(6),
    updatedAt: hoursAgo(3.5),
  },
];

/** Everything the example workspace shows in Leads & Results. */
export const demoLeads: Lead[] = [...demoInstantLeads, ...demoBulkLeads];

"use client";

/**
 * Campaign service, backed by the Reyvoca API.
 *
 * Campaigns are created and stored server-side (`/api/campaigns`). Creating one
 * does NOT place calls — it records the campaign and holds it, because the
 * telephony layer is not connected yet.
 */
import type {
  Campaign,
  CampaignContact,
  CampaignPace,
  CampaignProgress,
  CampaignStatus,
  CampaignType,
  CallOutcome,
  CallingRules,
  PostCallActionType,
  QualificationGoal,
} from "@/types/calling";
import { DEFAULT_ACTIONS, DEFAULT_CALLING_RULES } from "./integration-service";
import { apiFetch, createRemoteStore } from "./remote-store";
import { demoCampaign } from "./demo-data";

export const DEFAULT_PACE: CampaignPace = { callsPerMinute: 3, maxConcurrentCalls: 2 };

export const DEFAULT_OUTCOMES: CallOutcome[] = [
  "qualified",
  "interested",
  "meeting_booked",
  "callback",
  "not_interested",
  "no_answer",
];

export type CampaignDraft = {
  name: string;
  description?: string;
  type: CampaignType;
  agentId?: string;
  agentName?: string;
  contacts: CampaignContact[];
  pace: CampaignPace;
  rules: CallingRules;
  goals: QualificationGoal[];
  actions: PostCallActionType[];
  outcomes: CallOutcome[];
  scheduledFor?: string;
};

const campaignStore = createRemoteStore<Campaign[]>(
  "/campaigns",
  (body) => (body.campaigns as Campaign[]) ?? [],
  [],
);

export const campaignService = {
  /**
   * Stored campaigns plus the seeded example.
   *
   * The example is appended rather than persisted, so it cannot be edited or
   * mistaken for the user's own work.
   */
  list(): Campaign[] {
    return [...campaignStore.get(), demoCampaign];
  },

  get(id: string): Campaign | undefined {
    return campaignService.list().find((campaign) => campaign.id === id);
  },

  async create(draft: CampaignDraft, status: CampaignStatus = "scheduled"): Promise<Campaign> {
    const { campaign } = await apiFetch<{ campaign: Campaign }>("/campaigns", {
      method: "POST",
      body: JSON.stringify({ ...draft, status }),
    });
    await campaignStore.refresh();
    return campaign;
  },

  async setStatus(id: string, status: CampaignStatus): Promise<void> {
    await apiFetch(`/campaigns/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    await campaignStore.refresh();
  },

  async remove(id: string): Promise<void> {
    await apiFetch(`/campaigns/${id}`, { method: "DELETE" });
    await campaignStore.refresh();
  },

  useCampaigns(): { campaigns: Campaign[]; ready: boolean; error?: string } {
    const { value, ready, error } = campaignStore.use();
    return { campaigns: [...value, demoCampaign], ready, error };
  },
};

/** Derives progress counters from the contact list — never stored separately. */
export function campaignProgress(campaign: Campaign): CampaignProgress {
  const callable = campaign.contacts.filter((contact) => !contact.invalidReason && !contact.excluded);
  const count = (predicate: (contact: CampaignContact) => boolean) => callable.filter(predicate).length;

  return {
    total: callable.length,
    queued: count((contact) => contact.status === "queued"),
    calling: count((contact) => contact.status === "calling" || contact.status === "connected"),
    connected: count((contact) => contact.status === "connected" || contact.status === "in_conversation"),
    completed: count((contact) => contact.status === "completed"),
    qualified: count((contact) => contact.outcome === "qualified"),
    callbacks: count((contact) => contact.outcome === "callback"),
    failed: count(
      (contact) =>
        contact.status === "failed" || contact.status === "no_answer" || contact.status === "busy",
    ),
  };
}

/** Contacts that will actually be dialled. */
export const callableContacts = (campaign: Campaign): CampaignContact[] =>
  campaign.contacts.filter((contact) => !contact.invalidReason && !contact.excluded);

export const defaultDraft = (): Omit<CampaignDraft, "name"> => ({
  type: "lead_qualification",
  contacts: [],
  pace: DEFAULT_PACE,
  rules: DEFAULT_CALLING_RULES,
  goals: ["interest_level", "requirement"],
  actions: DEFAULT_ACTIONS,
  outcomes: DEFAULT_OUTCOMES,
});

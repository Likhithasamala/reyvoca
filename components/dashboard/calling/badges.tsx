import {
  AVAILABILITY_LABELS,
  getAction,
} from "@/lib/calling/integration-service";
import {
  CALL_OUTCOME_LABELS,
  CALL_STATUS_LABELS,
  CAMPAIGN_STATUS_LABELS,
  type ActionAvailability,
  type CallOutcome,
  type CallStatus,
  type CampaignStatus,
  type PostCallActionType,
} from "@/types/calling";
import { StatusBadge, type StatusTone } from "@/components/dashboard/ui/status-badge";

/**
 * Domain enums rendered through the dashboard's existing four-tone badge.
 *
 * Every badge carries its label as text, so status is never communicated by
 * colour alone.
 */

const outcomeTones: Record<CallOutcome, StatusTone> = {
  qualified: "positive",
  meeting_booked: "positive",
  interested: "accent",
  callback: "attention",
  do_not_call: "attention",
  not_interested: "neutral",
  no_answer: "neutral",
  wrong_number: "neutral",
  unknown: "neutral",
};

export function OutcomeBadge({ outcome }: { outcome: CallOutcome }) {
  return <StatusBadge status={CALL_OUTCOME_LABELS[outcome]} tone={outcomeTones[outcome]} />;
}

const statusTones: Record<CallStatus, StatusTone> = {
  received: "neutral",
  validating: "neutral",
  invalid: "attention",
  queued: "neutral",
  calling: "accent",
  connected: "accent",
  in_conversation: "accent",
  processing: "neutral",
  completed: "positive",
  no_answer: "neutral",
  busy: "neutral",
  failed: "attention",
  cancelled: "neutral",
};

/** Live states carry a dot so an in-flight call reads at a glance. */
const liveStatuses: readonly CallStatus[] = ["calling", "connected", "in_conversation"];

export function CallStatusBadge({ status }: { status: CallStatus }) {
  return (
    <StatusBadge
      status={CALL_STATUS_LABELS[status]}
      tone={statusTones[status]}
      dot={liveStatuses.includes(status)}
    />
  );
}

const campaignTones: Record<CampaignStatus, StatusTone> = {
  draft: "neutral",
  scheduled: "accent",
  running: "positive",
  paused: "attention",
  completed: "positive",
  stopped: "neutral",
  failed: "attention",
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <StatusBadge
      status={CAMPAIGN_STATUS_LABELS[status]}
      tone={campaignTones[status]}
      dot={status === "running"}
    />
  );
}

const availabilityTones: Record<ActionAvailability, StatusTone> = {
  available: "positive",
  requires_integration: "attention",
  planned: "neutral",
};

/** Shows whether a post-call action can actually run today. */
export function AvailabilityBadge({ availability }: { availability: ActionAvailability }) {
  return (
    <StatusBadge status={AVAILABILITY_LABELS[availability]} tone={availabilityTones[availability]} />
  );
}

/** Compact label for an action configured on a setup or campaign. */
export function ActionBadge({ type }: { type: PostCallActionType }) {
  const action = getAction(type);
  return <StatusBadge status={action.label} tone={availabilityTones[action.availability]} />;
}

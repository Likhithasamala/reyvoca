"use client";

import Link from "next/link";
import { ChevronLeft, Megaphone } from "lucide-react";
import { ActionLink } from "@/components/panel/action";
import { DemoTag } from "@/components/panel/demo-tag";
import { EmptyState } from "@/components/panel/empty-state";
import { StatusBadge } from "@/components/panel/status-badge";
import { CampaignStatusBadge } from "@/components/dashboard/calling/badges";
import { callableContacts, campaignService } from "@/lib/calling/campaign-service";
import { CALL_OUTCOME_LABELS, type CallStatus, type CampaignContact } from "@/types/calling";

/** Three plain states, so the table reads without a legend. */
function callStatusLabel(status: CallStatus): "Completed" | "Calling" | "Waiting" {
  if (status === "calling" || status === "connected" || status === "in_conversation") return "Calling";
  if (status === "queued" || status === "received" || status === "validating") return "Waiting";
  return "Completed";
}

function resultLabel(contact: CampaignContact): string {
  if (contact.outcome) return CALL_OUTCOME_LABELS[contact.outcome];
  if (contact.status === "no_answer") return "No Answer";
  return "—";
}

export function CampaignDetailView({ id }: { id: string }) {
  const { campaigns, ready } = campaignService.useCampaigns();
  const campaign = campaigns.find((item) => item.id === id);

  if (!ready) {
    return <div className="mx-auto h-80 max-w-4xl rounded-2xl border border-line bg-surface-muted/50" />;
  }

  if (!campaign) {
    return (
      <div className="mx-auto max-w-2xl pt-6">
        <EmptyState
          icon={Megaphone}
          title="Campaign not found"
          description="Campaigns created in this review build are stored in this browser, so they are only visible here."
          action={<ActionLink href="/dashboard/calling/bulk">Back to Bulk Campaigns</ActionLink>}
        />
      </div>
    );
  }

  const contacts = callableContacts(campaign);
  const total = contacts.length;
  const called = contacts.filter((contact) => callStatusLabel(contact.status) === "Completed").length;
  // "Interested" covers every outcome that shows real buying intent.
  const interested = contacts.filter(
    (contact) =>
      contact.outcome === "interested" ||
      contact.outcome === "qualified" ||
      contact.outcome === "meeting_booked",
  ).length;
  const remaining = total - called;
  const percent = total ? Math.round((called / total) * 100) : 0;

  const metrics = [
    { label: "Total", value: total },
    { label: "Called", value: called },
    { label: "Interested", value: interested },
    { label: "Remaining", value: remaining },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="pt-2">
        <Link
          href="/dashboard/calling/bulk"
          className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted transition-colors hover:text-ink"
        >
          <ChevronLeft className="size-3.5" aria-hidden="true" /> Bulk Campaigns
        </Link>
      </div>

      <header className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{campaign.name}</h1>
        <div className="flex items-center gap-2">
          <CampaignStatusBadge status={campaign.status} />
          {campaign.isDemo && <DemoTag label="Demo campaign" />}
        </div>
      </header>

      <section className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <h2 className="sr-only">Campaign figures</h2>
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-line bg-surface px-4 py-4 sm:px-5 sm:py-5">
            <p className="text-3xl font-semibold tracking-tight text-ink tabular-nums">{metric.value}</p>
            <p className="mt-1 text-sm text-ink-muted">{metric.label}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-surface px-5 py-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm text-ink tabular-nums">
            <span className="font-semibold">{called}</span>
            <span className="text-ink-muted"> / {total}</span>
          </p>
          <p className="text-sm font-semibold text-ink tabular-nums">{percent}%</p>
        </div>
        <div
          className="mt-2.5 h-2 overflow-hidden rounded-full bg-surface-muted"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Campaign progress"
        >
          <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${percent}%` }} />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="sr-only">Contacts</h2>
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Campaign contacts and results</caption>
              <thead className="border-b border-line bg-surface-muted text-ink-subtle">
                <tr>
                  <th scope="col" className="px-4 py-2.5 text-xs font-medium">Name</th>
                  <th scope="col" className="px-4 py-2.5 text-xs font-medium">Call Status</th>
                  <th scope="col" className="px-4 py-2.5 text-xs font-medium">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {contacts.slice(0, 12).map((contact) => {
                  const status = callStatusLabel(contact.status);
                  return (
                    <tr key={contact.id}>
                      <th scope="row" className="px-4 py-3 font-medium text-ink">
                        {contact.name ?? contact.phone}
                      </th>
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={status}
                          tone={status === "Completed" ? "positive" : status === "Calling" ? "accent" : "neutral"}
                          dot={status === "Calling"}
                        />
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{resultLabel(contact)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="border-t border-line bg-surface-muted px-4 py-2.5 text-xs text-ink-subtle">
            {campaign.isDemo
              ? "Example campaign. Results update live once calling is connected."
              : "Held until calling is connected — results will update here as calls finish."}
          </p>
        </div>
      </section>
    </div>
  );
}

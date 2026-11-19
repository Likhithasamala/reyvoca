"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ActionLink } from "@/components/panel/action";
import { StepFlow, type FlowStep } from "@/components/marketing/step-flow";
import {
  CallingListVisual,
  ProgressVisual,
  UploadVisual,
} from "@/components/marketing/flow-visuals";
import { CampaignStatusBadge } from "@/components/dashboard/calling/badges";
import { campaignProgress, campaignService } from "@/lib/calling/campaign-service";

const STEPS: FlowStep[] = [
  {
    number: "01",
    title: "Upload your list",
    visual: <UploadVisual />,
    description: "Upload a structured CSV containing the people you want Reyvoca to call.",
  },
  {
    number: "02",
    title: "Reyvoca calls automatically",
    visual: <CallingListVisual />,
    description: "Your selected AI agent works through the list automatically.",
  },
  {
    number: "03",
    title: "Watch results live",
    visual: <ProgressVisual />,
    description: "See campaign progress and results update as calls finish.",
  },
];

export function BulkCampaignsView() {
  const { campaigns, ready } = campaignService.useCampaigns();

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mx-auto max-w-2xl pt-4 text-center sm:pt-8">
        <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-accent-strong uppercase">
          Bulk Campaigns
        </p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink text-balance sm:text-3xl lg:text-[2.25rem] lg:leading-[1.15]">
          Upload one list.
          <br />
          Reyvoca works through it automatically.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ink-muted text-pretty sm:text-base">
          Upload your contacts, choose an AI agent and let Reyvoca call the list while you watch the results update
          live.
        </p>
      </header>

      <div className="mt-12 sm:mt-14">
        <StepFlow steps={STEPS} label="How Bulk Campaigns works" />
      </div>

      <div className="mt-12 flex flex-col items-center sm:mt-14">
        <ActionLink href="/dashboard/calling/bulk/new" variant="accent" size="lg">
          Create Campaign
        </ActionLink>
        <p className="mt-4 text-xs text-ink-subtle">Four short steps. Nothing is called until you start it.</p>
      </div>

      {/* The only supporting content: a way back into campaigns already made. */}
      {ready && campaigns.length > 0 && (
        <section className="mt-14 border-t border-line pt-8">
          <h2 className="text-xs font-medium tracking-[0.08em] text-ink-subtle uppercase">Your campaigns</h2>
          <ul className="mt-3 divide-y divide-line">
            {campaigns.map((campaign) => {
              const progress = campaignProgress(campaign);
              const called = progress.completed + progress.failed;
              const percent = progress.total ? Math.round((called / progress.total) * 100) : 0;

              return (
                <li key={campaign.id}>
                  <Link
                    href={`/dashboard/calling/bulk/${campaign.id}`}
                    className="group flex items-center justify-between gap-4 py-3.5 transition-colors"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink">{campaign.name}</span>
                      <span className="mt-0.5 block text-xs text-ink-subtle tabular-nums">
                        {called} of {progress.total} called · {percent}%
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <CampaignStatusBadge status={campaign.status} />
                      <ArrowRight
                        className="size-4 text-ink-subtle transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

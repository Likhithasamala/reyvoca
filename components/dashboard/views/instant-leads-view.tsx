"use client";

import { useMemo, useState } from "react";
import { Action } from "@/components/panel/action";
import { DemoTag } from "@/components/panel/demo-tag";
import { InstantSetupDrawer } from "@/components/dashboard/calling/instant-setup-drawer";
import { LeadActivityTable } from "@/components/dashboard/calling/lead-activity-table";
import { StepFlow, type FlowStep } from "@/components/marketing/step-flow";
import {
  CallingVisual,
  LeadArrivesVisual,
  ResultVisual,
} from "@/components/marketing/flow-visuals";
import { demoInstantLeads } from "@/lib/calling/demo-data";
import { instantService } from "@/lib/calling/instant-service";
import { leadService } from "@/lib/calling/lead-service";
import { LEAD_SOURCE_LABELS } from "@/types/calling";

const STEPS: FlowStep[] = [
  {
    number: "01",
    title: "New lead arrives",
    visual: <LeadArrivesVisual />,
    description: "A customer submits an enquiry from any connected source.",
  },
  {
    number: "02",
    title: "Reyvoca calls instantly",
    visual: <CallingVisual />,
    description: "Your AI agent starts the conversation within seconds.",
  },
  {
    number: "03",
    title: "Result captured",
    visual: <ResultVisual />,
    description: "The result is saved automatically and ready for the next action.",
  },
];

export function InstantLeadsView() {
  const { value: setup, ready } = instantService.useSetup();
  const { value: storedLeads } = leadService.useLeads();
  const [setupOpen, setSetupOpen] = useState(false);
  // Bumped on open so the drawer's form remounts with the saved values.
  const [session, setSession] = useState(0);

  /**
   * Leads this module has produced, with the seeded examples underneath.
   *
   * Mirrors Leads & Results: the workspace's own instant leads sit on top, so
   * the section reads as real activity the moment there is any, and as a
   * worked example before that. Bulk Campaigns gets the same treatment from
   * its appended example campaign.
   */
  const leads = useMemo(
    () => [...storedLeads.filter((lead) => lead.channel === "instant"), ...demoInstantLeads],
    [storedLeads],
  );

  const realCount = leads.length - demoInstantLeads.length;

  function openSetup() {
    setSession((value) => value + 1);
    setSetupOpen(true);
  }

  const configured = ready && setup.status !== "not_configured";

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mx-auto max-w-2xl pt-4 text-center sm:pt-8">
        <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-accent-strong uppercase">
          Instant Leads
        </p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink text-balance sm:text-3xl lg:text-[2.25rem] lg:leading-[1.15]">
          A new lead comes in.
          <br />
          Reyvoca calls within seconds.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ink-muted text-pretty sm:text-base">
          Connect your lead source and let Reyvoca contact new enquiries immediately, qualify them and capture the
          result.
        </p>
      </header>

      <div className="mt-12 sm:mt-14">
        <StepFlow steps={STEPS} label="How Instant Leads works" />
      </div>

      <div className="mt-12 flex flex-col items-center sm:mt-14">
        <Action variant="accent" size="lg" onClick={openSetup}>
          {configured ? "Edit Instant Leads setup" : "Set Up Instant Leads"}
        </Action>

        {configured ? (
          <p className="mt-4 text-xs text-ink-subtle">
            {setup.source ? LEAD_SOURCE_LABELS[setup.source] : "Source selected"}
            {setup.agentName ? ` · ${setup.agentName}` : ""} · calling starts when the service is live
          </p>
        ) : (
          <p className="mt-4 text-xs text-ink-subtle">Takes about a minute. Nothing is called until you set it up.</p>
        )}
      </div>

      {/* What the module produces, shown on the module's own page rather than
          only in Leads & Results. */}
      <section className="mt-14 border-t border-line pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs font-medium tracking-[0.08em] text-ink-subtle uppercase">Recent instant leads</h2>
          <DemoTag label={realCount > 0 ? "Includes demo data" : "Demo data"} />
        </div>
        <div className="mt-4">
          <LeadActivityTable leads={leads} />
        </div>
      </section>

      <InstantSetupDrawer
        open={setupOpen}
        session={session}
        setup={setup}
        onClose={() => setSetupOpen(false)}
      />
    </div>
  );
}

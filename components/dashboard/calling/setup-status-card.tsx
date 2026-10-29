"use client";

import { Bot, Pause, Play, Radio, Settings2, Webhook } from "lucide-react";
import type { ReactNode } from "react";
import { Action } from "@/components/dashboard/ui/action";
import { StatusBadge } from "@/components/dashboard/ui/status-badge";
import {
  INSTANT_STATUS_LABELS,
  LEAD_SOURCE_LABELS,
  type InstantSetup,
} from "@/types/calling";
import type { StatusTone } from "@/components/dashboard/ui/status-badge";

const statusTones: Record<InstantSetup["status"], StatusTone> = {
  not_configured: "neutral",
  ready: "accent",
  active: "positive",
  paused: "attention",
};

function Field({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.6875rem] font-medium tracking-[0.06em] text-ink-subtle uppercase">{label}</dt>
      <dd className="mt-1 flex items-center gap-1.5 text-sm text-ink">
        <span className="shrink-0 text-ink-subtle" aria-hidden="true">
          {icon}
        </span>
        <span className="truncate">{value}</span>
      </dd>
    </div>
  );
}

/**
 * System status for instant calling.
 *
 * Response time is deliberately described rather than measured — there is no
 * calling backend, so no average exists to report.
 */
export function SetupStatusCard({
  setup,
  onConfigure,
  onToggleActive,
}: {
  setup: InstantSetup;
  onConfigure: () => void;
  onToggleActive: () => void;
}) {
  const configured = setup.status !== "not_configured";
  const active = setup.status === "active";

  return (
    <section className="rounded-xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-sm font-semibold text-ink">Instant Lead Calling</h2>
            <StatusBadge
              status={INSTANT_STATUS_LABELS[setup.status]}
              tone={statusTones[setup.status]}
              dot={active}
            />
          </div>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted text-pretty">
            {configured
              ? "Reyvoca will call a new lead as soon as a valid lead event arrives."
              : "Connect a source and choose an agent to start calling new leads automatically."}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {configured && (
            <Action variant="secondary" size="sm" onClick={onToggleActive}>
              {active ? (
                <>
                  <Pause className="size-4" aria-hidden="true" /> Pause
                </>
              ) : (
                <>
                  <Play className="size-4" aria-hidden="true" /> Activate
                </>
              )}
            </Action>
          )}
          <Action size="sm" onClick={onConfigure}>
            <Settings2 className="size-4" aria-hidden="true" />
            {configured ? "Edit Setup" : "Configure Instant Leads"}
          </Action>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-4 border-t border-line pt-4 sm:grid-cols-3">
        <Field
          label="Agent"
          value={setup.agentName ?? "Not selected"}
          icon={<Bot className="size-3.5" strokeWidth={1.75} />}
        />
        <Field
          label="Source"
          value={setup.source ? LEAD_SOURCE_LABELS[setup.source] : "Not selected"}
          icon={<Webhook className="size-3.5" strokeWidth={1.75} />}
        />
        <Field
          label="Response"
          value="Starts when a valid lead event is received"
          icon={<Radio className="size-3.5" strokeWidth={1.75} />}
        />
      </dl>
    </section>
  );
}

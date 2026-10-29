"use client";

import { Webhook } from "lucide-react";
import { useState } from "react";
import type { WorkspaceIdentity } from "@/types";
import { SelectField, TextField } from "@/components/dashboard/ui/field";
import { Notice } from "@/components/dashboard/ui/notice";
import { PageHeader } from "@/components/dashboard/ui/page-header";
import { SectionCard } from "@/components/dashboard/ui/section-card";
import { SectionTabs } from "@/components/dashboard/ui/section-tabs";

const TABS = ["General", "Workspace", "Notifications", "Developer"] as const;

const notificationPreferences = [
  { label: "Call summaries", description: "A recap after each conversation your agents handle." },
  { label: "Qualified leads", description: "When an agent marks a lead as qualified." },
  { label: "Campaign finished", description: "When a bulk campaign completes." },
  { label: "Weekly performance", description: "A Monday summary of the previous week." },
];

/**
 * Workspace settings.
 *
 * The identity is resolved from the session by the page and passed in, so the
 * workspace name and account shown here are the real ones. Preferences
 * themselves have no endpoint behind them yet, which the notice says.
 */
export function SettingsView({ workspace }: { workspace: WorkspaceIdentity }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("General");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Settings" description="Workspace preferences for this Reyvoca account." />

      <SectionTabs tabs={TABS} active={tab} onChange={(next) => setTab(next as (typeof TABS)[number])} label="Settings sections" />

      <Notice title="Preferences are not saved yet.">
        Settings are stored with your workspace once accounts are connected. Changes here are not persisted.
      </Notice>

      {tab === "General" && (
        <SectionCard title="General" description="How this workspace behaves by default.">
          <div className="space-y-5">
            <div>
              <p className="mb-1.5 text-[0.8125rem] font-medium text-ink">Signed in as</p>
              <p className="rounded-lg border border-line bg-surface-muted px-3.5 py-3 text-xs leading-relaxed text-ink-muted">
                {workspace.signedIn
                  ? `${workspace.user} · ${workspace.email}`
                  : "Nobody is signed in. The dashboard is open on the shared development workspace."}
              </p>
            </div>
            <SelectField
              id="settings-timezone"
              label="Timezone"
              options={["(UTC+05:30) India Standard Time", "(UTC+00:00) Coordinated Universal Time", "(UTC−08:00) Pacific Time"]}
              hint="Used for calling windows, business hours and reporting."
            />
            <SelectField
              id="settings-language"
              label="Default language"
              options={["English", "Hindi"]}
              hint="New agents start in this language. Each agent can override it."
            />
          </div>
        </SectionCard>
      )}

      {tab === "Workspace" && (
        <SectionCard title="Workspace" description="Identity of this workspace.">
          <div className="space-y-5">
            <TextField
              id="settings-workspace-name"
              label="Workspace name"
              defaultValue={workspace.name}
              hint="Shown in the sidebar and on reports."
            />
            <div>
              <p className="mb-1.5 text-[0.8125rem] font-medium text-ink">Team members</p>
              <p className="rounded-lg border border-dashed border-line-strong px-3.5 py-3 text-xs leading-relaxed text-ink-muted">
                {workspace.signedIn
                  ? "Inviting teammates arrives with team accounts. This workspace currently has one member."
                  : "Inviting teammates arrives with accounts. This is the shared development workspace."}
              </p>
            </div>
          </div>
        </SectionCard>
      )}

      {tab === "Notifications" && (
        <SectionCard title="Notifications" description="What Reyvoca should tell you about.">
          <ul className="divide-y divide-line">
            {notificationPreferences.map((preference) => (
              <li key={preference.label} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{preference.label}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-muted text-pretty">{preference.description}</p>
                </div>
                <label className="flex shrink-0 items-center gap-2 text-xs text-ink-subtle">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-line-strong accent-brand"
                    aria-label={`Enable ${preference.label}`}
                  />
                  Email
                </label>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {tab === "Developer" && (
        <SectionCard title="Developer" description="Programmatic access to this workspace.">
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 rounded-lg border border-dashed border-line-strong px-3.5 py-3">
              <Webhook className="mt-0.5 size-4 shrink-0 text-ink-subtle" strokeWidth={1.75} aria-hidden="true" />
              <p className="text-xs leading-relaxed text-ink-muted text-pretty">
                API keys and webhook endpoints are issued from the backend once it is connected. Keys are shown once at
                creation and never displayed again — nothing sensitive is kept in this interface.
              </p>
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

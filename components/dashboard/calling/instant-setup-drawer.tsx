"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Action, ActionLink } from "@/components/panel/action";
import { useAgents } from "@/lib/agents/store";
import { instantService } from "@/lib/calling/instant-service";
import type { InstantSetup, LeadSource, PostCallActionType } from "@/types/calling";
import { cn } from "@/lib/cn";

/** The four sources a workspace can pick, in plain language. */
const SOURCES: { value: LeadSource; label: string; hint: string }[] = [
  { value: "webhook", label: "Website / Webhook", hint: "Your site, landing page or any system that can send a lead" },
  { value: "meta_lead_ads", label: "Meta Lead Form", hint: "Facebook and Instagram lead ads" },
  { value: "crm", label: "CRM", hint: "New records from your CRM" },
  { value: "custom", label: "Custom", hint: "Anything else that can deliver a lead" },
];

/** What Reyvoca does once the call ends. */
const AFTER_CALL: { value: PostCallActionType; label: string; note?: string }[] = [
  { value: "update_lead", label: "Save result" },
  { value: "create_callback", label: "Create callback" },
  { value: "book_meeting", label: "Book meeting", note: "Available when a calendar is connected" },
  { value: "update_crm", label: "Update CRM", note: "Available when a CRM is connected" },
];

function StepHeading({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-baseline gap-2.5">
      <span className="text-[0.6875rem] font-semibold tracking-[0.16em] text-accent-strong tabular-nums">
        {number}
      </span>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
    </div>
  );
}

const optionClass = (selected: boolean) =>
  cn(
    "w-full rounded-xl border px-3.5 py-3 text-left transition-colors",
    selected ? "border-accent-soft bg-accent-wash" : "border-line bg-surface hover:border-line-strong",
  );

/**
 * The three choices.
 *
 * Split out and remounted by `key` whenever the drawer opens, so its state
 * starts from the saved setup without copying props into state in an effect.
 */
function SetupForm({ setup, onSaved }: { setup: InstantSetup; onSaved: () => void }) {
  const { agents, ready } = useAgents();
  const [source, setSource] = useState(setup.source);
  const [agentId, setAgentId] = useState(setup.agentId);
  const [actions, setActions] = useState<PostCallActionType[]>(setup.actions);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  async function save() {
    const agent = agents.find((candidate) => candidate.id === agentId);
    setSaving(true);
    try {
      // One request: the server merges the patch and resolves the status.
      await instantService.save({
        source,
        agentId,
        agentName: agent?.name,
        actions,
        status: "active",
      });
      onSaved();
    } catch (caught) {
      setSaving(false);
      setError((caught as Error).message);
    }
  }

  const toggleAction = (value: PostCallActionType) =>
    setActions((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );

  return (
    <>
      <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
        {/* 01 — source */}
        <section>
          <StepHeading number="01" title="Choose source" />
          <div role="radiogroup" aria-label="Lead source" className="mt-3 space-y-2">
            {SOURCES.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={source === option.value}
                onClick={() => setSource(option.value)}
                className={optionClass(source === option.value)}
              >
                <span className="block text-sm font-medium text-ink">{option.label}</span>
                <span className="mt-0.5 block text-xs text-ink-subtle">{option.hint}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 02 — agent */}
        <section>
          <StepHeading number="02" title="Choose agent" />
          {!ready ? (
            <div className="mt-3 h-20 rounded-xl border border-line bg-surface-muted/50" />
          ) : agents.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-line-strong px-3.5 py-4">
              <p className="text-xs leading-relaxed text-ink-muted">Create an agent first — it will appear here.</p>
              <ActionLink href="/dashboard/agents/create" size="sm" className="mt-3">
                <Plus className="size-4" aria-hidden="true" /> Create Agent
              </ActionLink>
            </div>
          ) : (
            <div role="radiogroup" aria-label="Agent" className="mt-3 space-y-2">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  role="radio"
                  aria-checked={agentId === agent.id}
                  onClick={() => setAgentId(agent.id)}
                  className={optionClass(agentId === agent.id)}
                >
                  <span className="block truncate text-sm font-medium text-ink">{agent.name}</span>
                  <span className="mt-0.5 block truncate text-xs text-ink-subtle">
                    {agent.role} · {agent.language}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* 03 — after the call */}
        <section>
          <StepHeading number="03" title="After the call" />
          <div className="mt-3 space-y-2">
            {AFTER_CALL.map((option) => {
              const inputId = `after-${option.value}`;
              return (
                <label
                  key={option.value}
                  htmlFor={inputId}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 transition-colors hover:border-line-strong"
                >
                  <input
                    id={inputId}
                    type="checkbox"
                    checked={actions.includes(option.value)}
                    onChange={() => toggleAction(option.value)}
                    className="mt-0.5 size-4 shrink-0 rounded border-line-strong accent-brand"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm text-ink">{option.label}</span>
                    {option.note && <span className="mt-0.5 block text-xs text-ink-subtle">{option.note}</span>}
                  </span>
                </label>
              );
            })}
          </div>
        </section>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line px-6 py-4">
        <p className="text-xs text-ink-subtle">
          {error ?? "Calling starts when the service is live."}
        </p>
        <Action onClick={save} disabled={!source || !agentId || saving}>
          {saving ? "Saving…" : "Save setup"}
        </Action>
      </div>
    </>
  );
}

/**
 * Setup lives behind the main CTA, so the page itself stays a three-step story.
 * Three short choices: where leads come from, who calls, what happens after.
 */
export function InstantSetupDrawer({
  open,
  session,
  setup,
  onClose,
}: {
  open: boolean;
  /** Changes each time the drawer opens; remounts the form with saved values. */
  session: number;
  setup: InstantSetup;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <div className={cn("fixed inset-0 z-50", !open && "pointer-events-none")} aria-hidden={!open}>
      <div
        className={cn("absolute inset-0 bg-night/40 transition-opacity", open ? "opacity-100" : "opacity-0")}
        onClick={onClose}
      />

      <div
        inert={!open}
        role="dialog"
        aria-label="Set up Instant Leads"
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-canvas shadow-float transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-6 py-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-ink">Set up Instant Leads</h2>
            <p className="mt-0.5 text-xs text-ink-muted">Three choices and you&apos;re done.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close setup"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        <SetupForm key={session} setup={setup} onSaved={onClose} />
      </div>
    </div>
  );
}

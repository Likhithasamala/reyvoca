"use client";

import { useRouter } from "next/navigation";
import { Check, ChevronLeft, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Action, ActionLink } from "@/components/dashboard/ui/action";
import { TextField } from "@/components/dashboard/ui/field";
import { CsvUploader } from "./csv-uploader";
import { campaignService, DEFAULT_OUTCOMES, DEFAULT_PACE } from "@/lib/calling/campaign-service";
import { DEFAULT_ACTIONS, DEFAULT_CALLING_RULES } from "@/lib/calling/integration-service";
import { parseCsv, suggestMapping, validateContacts } from "@/lib/calling/csv";
import { useAgents } from "@/lib/agents/store";
import type { CampaignContact } from "@/types/calling";
import { cn } from "@/lib/cn";

const STEPS = ["Upload CSV", "Preview Contacts", "Choose Agent", "Start Campaign"] as const;

/** Compact progress indicator — four dots and the current step's name. */
function StepRail({ step }: { step: number }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2">
        {STEPS.map((label, index) => (
          <span key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-[0.625rem] font-semibold transition-colors",
                index < step && "bg-ink text-white",
                index === step && "bg-accent text-white",
                index > step && "border border-line-strong text-ink-subtle",
              )}
              aria-current={index === step ? "step" : undefined}
            >
              {index < step ? <Check className="size-3" strokeWidth={3} aria-hidden="true" /> : index + 1}
            </span>
            {index < STEPS.length - 1 && <span aria-hidden="true" className="h-px w-6 bg-line-strong sm:w-10" />}
          </span>
        ))}
      </div>
      <p className="mt-3 text-sm font-medium text-ink">{STEPS[step]}</p>
      <p className="mt-0.5 text-xs text-ink-subtle">
        Step {step + 1} of {STEPS.length}
      </p>
    </div>
  );
}

export function CampaignWizard() {
  const router = useRouter();
  const { agents, ready: agentsReady } = useAgents();

  const [step, setStep] = useState(0);
  const [fileName, setFileName] = useState<string>();
  const [contacts, setContacts] = useState<CampaignContact[]>([]);
  const [name, setName] = useState("");
  const [agentId, setAgentId] = useState<string>();
  const [error, setError] = useState<string>();
  const [starting, setStarting] = useState(false);

  const callable = useMemo(() => contacts.filter((contact) => !contact.invalidReason), [contacts]);
  const skipped = contacts.length - callable.length;
  const agent = agents.find((candidate) => candidate.id === agentId);

  function handleFile(text: string, uploadedName: string) {
    const parsed = parseCsv(text);
    const { contacts: parsedContacts } = validateContacts(parsed, suggestMapping(parsed.headers));
    setContacts(parsedContacts);
    setFileName(uploadedName);
    // A sensible default the user can change at the last step.
    if (!name) setName(uploadedName.replace(/\.csv$/i, "").replace(/[_-]+/g, " ").trim());
    setError(undefined);
  }

  function next() {
    if (step === 0 && callable.length === 0) {
      setError(contacts.length ? "No row in this file has a usable phone number." : "Upload a CSV to continue.");
      return;
    }
    if (step === 2 && !agentId) {
      setError("Choose the agent that will make these calls.");
      return;
    }
    setError(undefined);
    setStep((value) => Math.min(value + 1, STEPS.length - 1));
  }

  async function start() {
    if (!name.trim()) {
      setError("Give the campaign a name.");
      return;
    }
    setStarting(true);
    try {
      const campaign = await campaignService.create(
        {
          name: name.trim(),
          type: "lead_qualification",
          agentId,
          agentName: agent?.name,
          contacts,
          pace: DEFAULT_PACE,
          rules: DEFAULT_CALLING_RULES,
          goals: ["interest_level", "requirement"],
          actions: DEFAULT_ACTIONS,
          outcomes: DEFAULT_OUTCOMES,
        },
        "running",
      );
      router.push(`/dashboard/calling/bulk/${campaign.id}`);
    } catch (caught) {
      setStarting(false);
      setError((caught as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-3 pt-2">
        <ActionLink href="/dashboard/calling/bulk" variant="ghost" size="sm">
          <ChevronLeft className="size-4" aria-hidden="true" /> Bulk Campaigns
        </ActionLink>
      </div>

      <div className="mt-6">
        <StepRail step={step} />
      </div>

      <div className="mt-10">
        {step === 0 && (
          <div>
            <h1 className="text-center text-xl font-semibold tracking-tight text-ink">Upload your contacts</h1>
            <p className="mx-auto mt-2 max-w-md text-center text-sm leading-relaxed text-ink-muted text-pretty">
              A CSV with one person per row. Name and phone number are required — email, requirement, language and
              notes are optional.
            </p>
            <div className="mt-6">
              <CsvUploader onFile={handleFile} fileName={fileName} />
            </div>
            {contacts.length > 0 && (
              <p className="mt-4 text-center text-sm text-ink">
                <span className="font-semibold tabular-nums">{callable.length}</span> contacts ready
                {skipped > 0 && <span className="text-ink-subtle"> · {skipped} skipped</span>}
              </p>
            )}
          </div>
        )}

        {step === 1 && (
          <div>
            <h1 className="text-center text-xl font-semibold tracking-tight text-ink">Does this look right?</h1>
            <p className="mx-auto mt-2 max-w-md text-center text-sm leading-relaxed text-ink-muted">
              The first few contacts from your file.
            </p>

            <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-surface">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">Preview of uploaded contacts</caption>
                  <thead className="border-b border-line bg-surface-muted text-ink-subtle">
                    <tr>
                      <th scope="col" className="px-4 py-2.5 text-xs font-medium">Name</th>
                      <th scope="col" className="px-4 py-2.5 text-xs font-medium">Phone</th>
                      <th scope="col" className="hidden px-4 py-2.5 text-xs font-medium sm:table-cell">Requirement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {callable.slice(0, 6).map((contact) => (
                      <tr key={contact.id}>
                        <th scope="row" className="px-4 py-3 font-medium text-ink">{contact.name ?? "—"}</th>
                        <td className="px-4 py-3 font-mono text-xs text-ink-muted tabular-nums">{contact.phone}</td>
                        <td className="hidden max-w-48 truncate px-4 py-3 text-ink-muted sm:table-cell">
                          {contact.requirement ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="border-t border-line bg-surface-muted px-4 py-2.5 text-xs text-ink-subtle">
                {callable.length} contacts will be called
                {skipped > 0 && ` · ${skipped} row${skipped === 1 ? "" : "s"} skipped (no usable phone number)`}
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="text-center text-xl font-semibold tracking-tight text-ink">Who should make these calls?</h1>
            <p className="mx-auto mt-2 max-w-md text-center text-sm leading-relaxed text-ink-muted">
              Choose one Reyvoca agent for this campaign.
            </p>

            <div className="mt-6">
              {!agentsReady ? (
                <div className="h-24 rounded-2xl border border-line bg-surface-muted/50" />
              ) : agents.length === 0 ? (
                <div className="flex flex-col items-center rounded-2xl border border-dashed border-line-strong px-6 py-10 text-center">
                  <p className="text-sm text-ink-muted">Create an agent first — it will appear here.</p>
                  <ActionLink href="/dashboard/agents/create" size="sm" className="mt-4">
                    <Plus className="size-4" aria-hidden="true" /> Create Agent
                  </ActionLink>
                </div>
              ) : (
                <div role="radiogroup" aria-label="Agent" className="space-y-2">
                  {agents.map((candidate) => {
                    const selected = agentId === candidate.id;
                    return (
                      <button
                        key={candidate.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setAgentId(candidate.id)}
                        className={cn(
                          "w-full rounded-2xl border px-4 py-3.5 text-left transition-colors",
                          selected
                            ? "border-accent-soft bg-accent-wash"
                            : "border-line bg-surface hover:border-line-strong",
                        )}
                      >
                        <span className="block truncate text-sm font-medium text-ink">{candidate.name}</span>
                        <span className="mt-0.5 block truncate text-xs text-ink-subtle">
                          {candidate.purpose || `${candidate.role} · ${candidate.language}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="text-center text-xl font-semibold tracking-tight text-ink">Ready to start</h1>
            <p className="mx-auto mt-2 max-w-md text-center text-sm leading-relaxed text-ink-muted">
              Check the details, then start the campaign.
            </p>

            <div className="mt-6 space-y-5 rounded-2xl border border-line bg-surface px-5 py-5">
              <TextField
                id="campaign-name"
                label="Campaign name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="October renewal follow-up"
              />
              <dl className="divide-y divide-line border-t border-line pt-1">
                <div className="flex items-baseline justify-between gap-4 py-2.5">
                  <dt className="text-sm text-ink-muted">Contacts</dt>
                  <dd className="text-sm font-semibold text-ink tabular-nums">{callable.length}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 py-2.5">
                  <dt className="text-sm text-ink-muted">Agent</dt>
                  <dd className="text-sm font-medium text-ink">{agent?.name ?? "—"}</dd>
                </div>
              </dl>
            </div>

            <p className="mt-4 text-center text-xs leading-relaxed text-ink-subtle text-pretty">
              Calling infrastructure is not connected yet, so the campaign is created and held — no one is dialled.
            </p>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-5 text-center text-xs font-medium text-danger">
          {error}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        <Action
          variant="ghost"
          onClick={() => {
            setError(undefined);
            setStep((value) => Math.max(value - 1, 0));
          }}
          disabled={step === 0}
        >
          Back
        </Action>

        {step < STEPS.length - 1 ? (
          <Action onClick={next}>Continue</Action>
        ) : (
          <Action variant="accent" onClick={start} disabled={starting}>
            {starting ? "Starting…" : "Start Campaign"}
          </Action>
        )}
      </div>
    </div>
  );
}

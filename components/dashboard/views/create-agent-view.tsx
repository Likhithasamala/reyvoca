"use client";

import {
  Bot,
  ChevronRight,
  Cpu,
  Headphones,
  Link2,
  MessageSquare,
  Mic,
  Plus,
  Sparkles,
  Volume2,
  Wrench,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Action } from "@/components/dashboard/ui/action";
import { PageHeader } from "@/components/dashboard/ui/page-header";
import { AgentEditor, type EditableAgent } from "@/components/dashboard/agents/agent-editor";
import { emptyAgentConfig } from "@/lib/agents/types";
import {
  AGENT_TEMPLATES,
  SCRATCH_WELCOME,
  providerLabel,
  resolveSelections,
  type AgentTemplate,
  type ConnectedProviders,
} from "@/lib/agents/templates";
import { connectedProviders, useProviders } from "@/lib/providers/store";

/** Builds a ready-to-edit agent from a template, with model/voice/stt auto-selected. */
function fromTemplate(template: AgentTemplate | null, providers: ConnectedProviders): EditableAgent {
  const config = emptyAgentConfig();
  config.llmProvider = providers.llm[0] ?? "";
  config.voiceProvider = providers.tts[0] ?? "";
  config.sttProvider = providers.stt[0] ?? "";

  if (!template) {
    return {
      name: "",
      purpose: "",
      role: "Custom",
      firstMessage: SCRATCH_WELCOME,
      instructions: "",
      status: "Draft",
      config,
    };
  }

  const selection = resolveSelections(template, providers);
  return {
    name: template.name,
    purpose: template.desc,
    role: template.role,
    firstMessage: template.welcome,
    instructions: template.instructions,
    status: "Draft",
    config: {
      ...config,
      template: template.id,
      llmProvider: selection.llm.provider,
      llmModel: selection.llm.model,
      voiceProvider: selection.tts,
      sttProvider: selection.stt,
      maxCallSeconds: template.maxCallSeconds,
      tools: template.tools.map((tool, index) => ({ ...tool, id: `${template.id}-tool-${index}` })),
    },
  };
}

function TemplatePreview({
  template,
  providers,
  onClose,
  onCreate,
}: {
  template: AgentTemplate;
  providers: ConnectedProviders;
  onClose: () => void;
  onCreate: (template: AgentTemplate) => void;
}) {
  const selection = resolveSelections(template, providers);
  const modelText = selection.llm.provider
    ? providerLabel(selection.llm.provider) + (selection.llm.model ? " · " + selection.llm.model : "")
    : "Connect an LLM provider";
  const voiceText = selection.tts ? providerLabel(selection.tts) : "Connect a TTS provider";
  const sttText = selection.stt ? providerLabel(selection.stt) : "Connect an STT provider";
  const Icon = template.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${template.name} preview`}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-float"
      >
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-muted text-ink">
            <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">{template.name}</p>
            <p className="truncate text-xs text-ink-muted">{template.desc}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
          >
            <X className="size-[18px]" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <div className="grid gap-2.5 sm:grid-cols-3">
            {[
              [Cpu, "Model", modelText],
              [Volume2, "Voice", voiceText],
              [Mic, "Transcription", sttText],
            ].map(([TileIcon, label, value]) => (
              <div key={label as string} className="flex items-start gap-2.5 rounded-lg border border-line bg-surface-muted/50 px-3 py-2.5">
                <TileIcon className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-[0.6875rem] font-semibold tracking-[0.12em] text-ink-subtle uppercase">
                    {label as string}
                  </p>
                  <p className="text-xs font-medium text-ink">{value as string}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="flex items-start gap-1.5 text-xs leading-relaxed text-ink-subtle">
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-accent-strong" aria-hidden="true" />
            Model and voice are auto-picked as the best fit for this task from the providers you&rsquo;ve connected. You
            can change anything before saving.
          </p>

          <div>
            <p className="flex items-center gap-1.5 text-[0.6875rem] font-semibold tracking-[0.14em] text-ink-subtle uppercase">
              <MessageSquare className="size-3.5" aria-hidden="true" /> First thing it says
            </p>
            <p className="mt-2 rounded-lg border border-line bg-surface-muted px-3.5 py-3 text-sm leading-relaxed text-ink">
              &ldquo;{template.welcome}&rdquo;
            </p>
          </div>

          <div>
            <p className="flex items-center gap-1.5 text-[0.6875rem] font-semibold tracking-[0.14em] text-ink-subtle uppercase">
              <Bot className="size-3.5" aria-hidden="true" /> How it behaves
            </p>
            <pre className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-line bg-surface-muted px-3.5 py-3 font-sans text-xs leading-relaxed whitespace-pre-wrap text-ink-muted">
              {template.instructions}
            </pre>
          </div>

          {template.variables.length > 0 && (
            <div>
              <p className="flex items-center gap-1.5 text-[0.6875rem] font-semibold tracking-[0.14em] text-ink-subtle uppercase">
                <Sparkles className="size-3.5" aria-hidden="true" /> Fill-in variables
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {template.variables.map((variable) => (
                  <code
                    key={variable}
                    className="rounded-md border border-line bg-surface-muted px-2 py-0.5 text-xs text-ink-muted"
                  >
                    {"{{" + variable + "}}"}
                  </code>
                ))}
              </div>
            </div>
          )}

          {template.tools.length > 0 && (
            <div>
              <p className="flex items-center gap-1.5 text-[0.6875rem] font-semibold tracking-[0.14em] text-ink-subtle uppercase">
                <Wrench className="size-3.5" aria-hidden="true" /> Prebuilt tools
              </p>
              <div className="mt-2 space-y-2">
                {template.tools.map((tool) => (
                  <div key={tool.name} className="flex items-center gap-3 rounded-lg border border-line bg-surface-muted/50 px-3 py-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-line bg-surface text-ink-muted">
                      <Link2 className="size-3.5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.8125rem] font-medium text-ink">
                        {tool.name} <span className="font-mono text-xs text-ink-subtle">{tool.method}</span>
                      </p>
                      <p className="truncate text-xs text-ink-muted">{tool.description}</p>
                    </div>
                    <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-xs text-ink-muted whitespace-nowrap">
                      {tool.runWhen === "end" ? "At end" : "During call"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3.5">
          <Action variant="secondary" onClick={onClose}>
            Close
          </Action>
          <Action variant="accent" onClick={() => onCreate(template)}>
            <Plus className="size-4" aria-hidden="true" /> Create this agent
          </Action>
        </div>
      </div>
    </div>
  );
}

export function CreateAgentView() {
  const router = useRouter();
  const { providers: records } = useProviders();
  const providers = connectedProviders(records);
  const [editing, setEditing] = useState<EditableAgent | null>(null);
  const [preview, setPreview] = useState<AgentTemplate | null>(null);

  const pick = (template: AgentTemplate | null) => {
    setPreview(null);
    setEditing(fromTemplate(template, providers));
  };

  if (editing) {
    return (
      <AgentEditor
        initial={editing}
        providers={providers}
        backLabel="Templates"
        onCancel={() => setEditing(null)}
        onDone={(agent) => router.push(`/dashboard/agents/${agent.id}`)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Create a voice agent"
        description="Start from a prebuilt template, or build your own from scratch."
      />

      <div>
        <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-ink-subtle uppercase">
          Start from a template
        </p>
        <div className="mt-3 space-y-2.5">
          {AGENT_TEMPLATES.map((template) => {
            const Icon = template.icon;
            return (
              <div
                key={template.id}
                role="button"
                tabIndex={0}
                onClick={() => pick(template)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    pick(template);
                  }
                }}
                className="group flex cursor-pointer flex-wrap items-center gap-4 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong hover:bg-surface-muted/40 sm:flex-nowrap"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-muted text-ink">
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-ink">{template.name}</h3>
                  <p className="text-xs leading-relaxed text-ink-muted">{template.desc}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Action
                    size="sm"
                    variant="secondary"
                    onClick={(event) => {
                      event.stopPropagation();
                      setPreview(template);
                    }}
                  >
                    <Headphones className="size-3.5" aria-hidden="true" /> Preview
                  </Action>
                  <Action
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      pick(template);
                    }}
                  >
                    <Plus className="size-3.5" aria-hidden="true" /> Create
                  </Action>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => pick(null)}
            className="flex w-full items-center gap-4 rounded-xl border border-dashed border-line-strong bg-surface p-4 text-left transition-colors hover:border-ink-subtle hover:bg-surface-muted/40"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-dashed border-line-strong bg-surface-muted text-ink-muted">
              <Plus className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-ink">Start from scratch</h3>
              <p className="text-xs leading-relaxed text-ink-muted">A blank agent you configure yourself.</p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-ink-subtle" aria-hidden="true" />
          </button>
        </div>
      </div>

      {preview && (
        <TemplatePreview
          template={preview}
          providers={providers}
          onClose={() => setPreview(null)}
          onCreate={pick}
        />
      )}
    </div>
  );
}

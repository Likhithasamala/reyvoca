"use client";

import {
  ArrowLeft,
  Check,
  ChevronDown,
  Clock,
  Globe,
  Link2,
  Loader2,
  MessageSquare,
  PhoneCall,
  Plus,
  Sparkles,
  Trash2,
  Volume2,
  Wrench,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Action } from "@/components/dashboard/ui/action";
import { SelectField, TextField, TextareaField } from "@/components/dashboard/ui/field";
import { cn } from "@/lib/cn";
import {
  createAgent,
  updateAgent,
  AGENT_ROLES,
  type Agent,
  type AgentConfig,
  type AgentRole,
  type AgentTool,
} from "@/lib/agents/store";
import {
  LLM_MODELS,
  TOOL_METHODS,
  TOOL_RUN_WHEN,
  VOICE_CATALOG,
  langsFor,
  newToolId,
  pickVoiceFromList,
  providerLabel,
  templateById,
  type ConnectedProviders,
  type Voice,
} from "@/lib/agents/templates";
import { fetchProviderVoices } from "@/lib/providers/store";
import { TestChat } from "./test-chat";
import { WebCall } from "./web-call";

export type EditableAgent = {
  id?: string;
  name: string;
  purpose: string;
  role: AgentRole;
  firstMessage: string;
  instructions: string;
  status: Agent["status"];
  config: AgentConfig;
};

/* ── Tool editor ────────────────────────────────────────────────── */
function ToolForm({
  tool,
  onSave,
  onCancel,
}: {
  tool?: AgentTool;
  onSave: (tool: AgentTool) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<AgentTool>(
    tool ?? { id: "", name: "", description: "", method: "POST", url: "", runWhen: "during" },
  );
  const up = <K extends keyof AgentTool>(key: K, value: AgentTool[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  return (
    <div className="space-y-3.5 rounded-lg border border-line bg-surface-muted/50 p-3.5">
      <TextField
        id="tool-name"
        label="Tool name"
        value={draft.name}
        onChange={(event) => up("name", event.target.value)}
        placeholder="Check Availability"
      />
      <TextField
        id="tool-description"
        label="Description"
        hint="Tells the agent when to call it."
        value={draft.description}
        onChange={(event) => up("description", event.target.value)}
        placeholder="Fetches open appointment slots for a date"
      />
      <div className="grid gap-3.5 sm:grid-cols-[7rem_1fr]">
        <SelectField
          id="tool-method"
          label="Method"
          options={TOOL_METHODS}
          value={draft.method}
          onChange={(event) => up("method", event.target.value as AgentTool["method"])}
        />
        <TextField
          id="tool-url"
          label="Webhook URL"
          value={draft.url}
          onChange={(event) => up("url", event.target.value)}
          placeholder="https://api.yourbackend.com/book"
        />
      </div>
      <div>
        <label htmlFor="tool-run-when" className="mb-1.5 block text-[0.8125rem] font-medium text-ink">
          Runs
        </label>
        <select
          id="tool-run-when"
          value={draft.runWhen}
          onChange={(event) => up("runWhen", event.target.value as AgentTool["runWhen"])}
          className="block h-10 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink focus:border-ink focus:ring-4 focus:ring-surface-muted focus:outline-none"
        >
          {TOOL_RUN_WHEN.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <Action
          size="sm"
          disabled={!draft.name.trim() || !draft.url.trim()}
          onClick={() => onSave({ ...draft, id: draft.id || newToolId() })}
        >
          Save tool
        </Action>
        <Action size="sm" variant="secondary" onClick={onCancel}>
          Cancel
        </Action>
      </div>
    </div>
  );
}

/* ── Secondary-language multi-select ────────────────────────────── */
function LangMultiSelect({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (language: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const shown = options.filter((language) =>
    language.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const summary = selected.length
    ? selected.length <= 3
      ? selected.join(", ")
      : `${selected.length} languages selected`
    : "Select languages…";

  return (
    <div className="relative" ref={wrap}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-line-strong bg-surface px-3 text-sm transition-colors hover:border-ink-subtle focus:border-ink focus:ring-4 focus:ring-surface-muted focus:outline-none"
      >
        <span className={cn("truncate", selected.length ? "text-ink" : "text-ink-subtle")}>{summary}</span>
        <ChevronDown className={cn("size-4 shrink-0 text-ink-subtle transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-line bg-surface shadow-lift">
          <div className="border-b border-line p-2">
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search languages…"
              aria-label="Search languages"
              className="block h-8 w-full rounded-md border border-line bg-surface-muted/50 px-2.5 text-sm text-ink placeholder:text-ink-subtle focus:border-ink focus:outline-none"
            />
          </div>
          <div className="max-h-52 overflow-y-auto p-1">
            {shown.length === 0 && <p className="px-2.5 py-2 text-xs text-ink-subtle">No match</p>}
            {shown.map((language) => {
              const on = selected.includes(language);
              return (
                <label
                  key={language}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-surface-muted",
                    on ? "font-medium text-ink" : "text-ink-muted",
                  )}
                >
                  <input type="checkbox" className="sr-only" checked={on} onChange={() => onToggle(language)} />
                  <span
                    className={cn(
                      "flex size-4 items-center justify-center rounded border",
                      on ? "border-ink bg-brand text-white" : "border-line-strong bg-surface",
                    )}
                    aria-hidden="true"
                  >
                    {on && <Check className="size-3" />}
                  </span>
                  {language}
                </label>
              );
            })}
          </div>
          {selected.length > 0 && (
            <div className="flex items-center justify-between border-t border-line px-2.5 py-1.5">
              <button
                type="button"
                onClick={() => [...selected].forEach(onToggle)}
                className="text-xs font-medium text-accent-strong hover:underline"
              >
                Clear all
              </button>
              <span className="text-xs text-ink-subtle">{selected.length} selected</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Side-panel helpers ─────────────────────────────────────────── */
function SideTitle({ icon: Icon, children, first = false }: { icon: typeof Volume2; children: string; first?: boolean }) {
  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-[0.6875rem] font-semibold tracking-[0.14em] text-ink-subtle uppercase",
        !first && "mt-6",
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {children}
    </p>
  );
}

function NoProviderNote({ type }: { type: string }) {
  return (
    <p className="rounded-lg border border-line bg-surface-muted px-3 py-2.5 text-xs leading-relaxed text-ink-muted">
      No {type} provider configured. Add one under <b>Providers</b> in the sidebar.
    </p>
  );
}

/* ── Editor ─────────────────────────────────────────────────────── */
export function AgentEditor({
  initial,
  providers,
  onDone,
  onCancel,
  backLabel = "My Agents",
}: {
  initial: EditableAgent;
  providers: ConnectedProviders;
  onDone: (agent: Agent) => void;
  onCancel: () => void;
  backLabel?: string;
}) {
  const [agent, setAgent] = useState<EditableAgent>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // The loaded voice library, tagged with the provider it belongs to. Voices
  // for a different provider than the current one are never shown, so there is
  // no state to clear synchronously when the provider changes.
  const [voiceLib, setVoiceLib] = useState<{ provider: string; voices: Voice[]; live: boolean }>({
    provider: "",
    voices: [],
    live: false,
  });
  const [toolEdit, setToolEdit] = useState<AgentTool | "new" | null>(null);
  const [testing, setTesting] = useState(false);
  const [calling, setCalling] = useState(false);

  const c = agent.config;
  const set = <K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) =>
    setAgent((current) => ({ ...current, config: { ...current.config, [key]: value } }));
  const setField = <K extends keyof EditableAgent>(key: K, value: EditableAgent[K]) =>
    setAgent((current) => ({ ...current, [key]: value }));
  const models = LLM_MODELS[c.llmProvider] ?? [];

  const voices = c.voiceProvider && voiceLib.provider === c.voiceProvider ? voiceLib.voices : [];
  const voicesLive = voiceLib.provider === c.voiceProvider && voiceLib.live;
  const voicesBusy = !!c.voiceProvider && voiceLib.provider !== c.voiceProvider;

  // Load the voice library whenever the TTS provider changes: live from the
  // provider when a key is saved, otherwise the curated fallback catalogue.
  useEffect(() => {
    const provider = c.voiceProvider;
    if (!provider) return;
    let liveEffect = true;
    fetchProviderVoices(provider)
      .then((result) => ({
        list: result.live && result.voices.length ? result.voices : VOICE_CATALOG[provider] ?? [],
        live: result.live,
      }))
      .catch(() => ({ list: VOICE_CATALOG[provider] ?? [], live: false }))
      .then(({ list, live }) => {
        if (!liveEffect) return;
        setVoiceLib({ provider, voices: list, live });
        // Auto-select the best-fit voice for this template if none is chosen yet.
        if (list.length) {
          setAgent((current) => {
            if (current.config.voiceId || current.config.voiceProvider !== provider) return current;
            const pick = pickVoiceFromList(current.config.template, list);
            if (!pick) return current;
            return { ...current, config: { ...current.config, voiceId: pick.id, voiceName: pick.name } };
          });
        }
      });
    return () => {
      liveEffect = false;
    };
  }, [c.voiceProvider]);

  async function save() {
    if (!agent.name.trim()) {
      setError("Give your agent a name.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: agent.name.trim(),
        purpose: agent.purpose,
        role: agent.role,
        firstMessage: agent.firstMessage,
        instructions: agent.instructions,
        config: agent.config,
      };
      const saved = agent.id ? await updateAgent(agent.id, payload) : await createAgent(payload);
      onDone(saved);
    } catch (cause) {
      setError("Could not save: " + (cause as Error).message);
      setSaving(false);
    }
  }

  const pickVoice = (id: string) => {
    const voice = voices.find((entry) => entry.id === id);
    setAgent((current) => ({
      ...current,
      config: { ...current.config, voiceId: id, voiceName: voice?.name ?? "" },
    }));
  };
  const toggleSecondary = (language: string) =>
    set(
      "secondaryLanguages",
      c.secondaryLanguages.includes(language)
        ? c.secondaryLanguages.filter((entry) => entry !== language)
        : [...c.secondaryLanguages, language],
    );
  const saveTool = (tool: AgentTool) => {
    const list = c.tools;
    const index = list.findIndex((entry) => entry.id === tool.id);
    set("tools", index >= 0 ? list.map((entry) => (entry.id === tool.id ? tool : entry)) : [...list, tool]);
    setToolEdit(null);
  };
  const deleteTool = (id: string) => set("tools", c.tools.filter((entry) => entry.id !== id));

  const providerSelect = (
    type: keyof ConnectedProviders,
    label: string,
    value: string,
    onChange: (next: string) => void,
  ) => {
    const list = providers[type];
    return (
      <div>
        <label className="mb-1.5 block text-[0.8125rem] font-medium text-ink">{label}</label>
        {list.length === 0 ? (
          <NoProviderNote type={type.toUpperCase()} />
        ) : (
          <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-label={label}
            className="block h-10 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink focus:border-ink focus:ring-4 focus:ring-surface-muted focus:outline-none"
          >
            {!list.includes(value) && <option value="">Select…</option>}
            {list.map((provider) => (
              <option key={provider} value={provider}>
                {providerLabel(provider)}
              </option>
            ))}
          </select>
        )}
      </div>
    );
  };

  const template = templateById(c.template);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" /> {backLabel}
        </button>
        <input
          value={agent.name}
          onChange={(event) => setField("name", event.target.value)}
          placeholder="Agent name"
          aria-label="Agent name"
          className="h-10 min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 text-lg font-semibold tracking-tight text-ink transition-colors placeholder:text-ink-subtle hover:border-line focus:border-ink focus:bg-surface focus:outline-none"
        />
        <div className="flex items-center gap-2">
          <Action variant="secondary" onClick={() => setTesting(true)}>
            <MessageSquare className="size-4" aria-hidden="true" /> Test
          </Action>
          <Action variant="secondary" onClick={() => setCalling(true)}>
            <PhoneCall className="size-4" aria-hidden="true" /> Web call
          </Action>
          <Action variant="accent" onClick={save} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Saving…
              </>
            ) : (
              "Save agent"
            )}
          </Action>
        </div>
      </div>

      {template && (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-muted px-4 py-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-ink">
            <template.icon className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Prebuilt from &ldquo;{template.name}&rdquo;</p>
            <p className="text-xs text-ink-muted">
              Prompt, welcome message, model and voice are filled in and ready — edit anything below.
            </p>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-lg border border-danger-line bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        {/* Main column */}
        <div className="space-y-5">
          <div className="space-y-5 rounded-xl border border-line bg-surface p-4 sm:p-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                id="agent-purpose"
                label="Purpose"
                value={agent.purpose}
                onChange={(event) => setField("purpose", event.target.value)}
                placeholder="What is this agent for?"
              />
              <SelectField
                id="agent-role"
                label="Role"
                options={AGENT_ROLES}
                value={agent.role}
                onChange={(event) => setField("role", event.target.value as AgentRole)}
              />
            </div>
            <TextareaField
              id="agent-instructions"
              label="Instructions"
              hint="What the agent should do and how it should behave on a call."
              rows={14}
              value={agent.instructions}
              onChange={(event) => setField("instructions", event.target.value)}
              placeholder="Describe the agent's role, goals, tone, and the steps it should follow on a call…"
            />
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="agent-welcome" className="block text-[0.8125rem] font-medium text-ink">
                  Welcome message
                </label>
                <label className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <input
                    type="checkbox"
                    checked={c.skipWelcome}
                    onChange={(event) => set("skipWelcome", event.target.checked)}
                    className="size-3.5 accent-[var(--color-brand)]"
                  />
                  Skip — let the caller speak first
                </label>
              </div>
              <textarea
                id="agent-welcome"
                rows={3}
                value={agent.firstMessage}
                disabled={c.skipWelcome}
                onChange={(event) => setField("firstMessage", event.target.value)}
                placeholder="Hi! How can I help you today?"
                className="block w-full resize-y rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-sm leading-relaxed text-ink transition-colors placeholder:text-ink-subtle hover:border-ink-subtle focus:border-ink focus:ring-4 focus:ring-surface-muted focus:outline-none disabled:bg-surface-muted disabled:text-ink-subtle"
              />
              <p className="mt-1.5 text-xs text-ink-subtle">The first thing the agent says when the call connects.</p>
            </div>
          </div>

          {/* Tools */}
          <div className="rounded-xl border border-line bg-surface p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Wrench className="mt-0.5 size-4 text-ink-muted" aria-hidden="true" />
                <div>
                  <h2 className="text-sm font-semibold text-ink">Tools</h2>
                  <p className="text-xs text-ink-muted">Actions the agent can trigger during a call via HTTP webhooks.</p>
                </div>
              </div>
              {toolEdit === null && (
                <Action size="sm" variant="secondary" onClick={() => setToolEdit("new")}>
                  <Plus className="size-3.5" aria-hidden="true" /> Add tool
                </Action>
              )}
            </div>

            {c.tools.length > 0 && (
              <div className="mt-4 space-y-2">
                {c.tools.map((tool) => (
                  <div key={tool.id} className="flex items-center gap-3 rounded-lg border border-line bg-surface-muted/50 px-3 py-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-line bg-surface text-ink-muted">
                      <Link2 className="size-3.5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.8125rem] font-medium text-ink">
                        {tool.name} <span className="font-mono text-xs text-ink-subtle">{tool.method}</span>
                      </p>
                      <p className="truncate text-xs text-ink-muted">{tool.description || tool.url}</p>
                    </div>
                    <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-xs text-ink-muted whitespace-nowrap">
                      {tool.runWhen === "end" ? "At end" : "During call"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setToolEdit(tool)}
                      className="text-xs font-medium text-ink-muted hover:text-ink"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteTool(tool.id)}
                      aria-label={`Delete ${tool.name}`}
                      className="rounded-md p-1 text-ink-subtle transition-colors hover:bg-danger-soft hover:text-danger"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {toolEdit !== null && (
              <div className="mt-4">
                <ToolForm
                  tool={toolEdit === "new" ? undefined : toolEdit}
                  onSave={saveTool}
                  onCancel={() => setToolEdit(null)}
                />
              </div>
            )}
            {c.tools.length === 0 && toolEdit === null && (
              <p className="mt-3 text-xs text-ink-subtle">
                No tools yet. Add one to let the agent book, look up, or send things during a call.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-line bg-surface p-4 sm:p-5">
            <TextField
              id="agent-inbound-webhook"
              label="Inbound webhook (optional)"
              hint="Reyvoca POSTs call events here for your automations."
              value={c.inboundWebhook}
              onChange={(event) => set("inboundWebhook", event.target.value)}
              placeholder="https://api.yourbackend.com/reyvoca/inbound"
            />
          </div>
        </div>

        {/* Side column */}
        <aside className="h-fit rounded-xl border border-line bg-surface p-4 sm:p-5">
          <SideTitle icon={Volume2} first>
            Voice & Language
          </SideTitle>
          <div className="mt-3 space-y-4">
            {providerSelect("tts", "Voice provider (TTS)", c.voiceProvider, (next) => {
              const languages = langsFor(next);
              setAgent((current) => ({
                ...current,
                config: {
                  ...current.config,
                  voiceProvider: next,
                  voiceId: "",
                  voiceName: "",
                  primaryLanguage: languages.includes(current.config.primaryLanguage)
                    ? current.config.primaryLanguage
                    : languages[0],
                  secondaryLanguages: current.config.secondaryLanguages.filter((lang) => languages.includes(lang)),
                },
              }));
            })}

            {c.voiceProvider && (
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[0.8125rem] font-medium text-ink">
                  Voice
                  {voicesBusy && <Loader2 className="size-3 animate-spin text-ink-subtle" aria-hidden="true" />}
                </label>
                {voices.length === 0 && !voicesBusy ? (
                  <p className="rounded-lg border border-line bg-surface-muted px-3 py-2.5 text-xs leading-relaxed text-ink-muted">
                    No voices available. Save a {providerLabel(c.voiceProvider)} key under Providers to load its voices.
                  </p>
                ) : (
                  <>
                    <select
                      value={c.voiceId}
                      onChange={(event) => pickVoice(event.target.value)}
                      aria-label="Voice"
                      className="block h-10 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink focus:border-ink focus:ring-4 focus:ring-surface-muted focus:outline-none"
                    >
                      <option value="">Select a voice</option>
                      {voices.map((voice) => (
                        <option key={voice.id} value={voice.id}>
                          {voice.name}
                          {voice.language ? " · " + voice.language : ""}
                        </option>
                      ))}
                    </select>
                    {!voicesLive && voices.length > 0 && (
                      <p className="mt-1.5 text-xs leading-relaxed text-ink-subtle">
                        Showing {voices.length} default voices. Add your {providerLabel(c.voiceProvider)} key under{" "}
                        <b>Providers → Text-to-Speech</b> to load the full library.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-[0.8125rem] font-medium text-ink">
                <Globe className="size-3.5 text-ink-muted" aria-hidden="true" /> Primary language
              </label>
              <select
                value={c.primaryLanguage}
                onChange={(event) => set("primaryLanguage", event.target.value)}
                aria-label="Primary language"
                className="block h-10 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink focus:border-ink focus:ring-4 focus:ring-surface-muted focus:outline-none"
              >
                {langsFor(c.voiceProvider).map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-ink-subtle">The call starts in this language.</p>
            </div>

            <div>
              <label className="mb-1.5 block text-[0.8125rem] font-medium text-ink">Secondary languages</label>
              <LangMultiSelect
                options={langsFor(c.voiceProvider).filter((language) => language !== c.primaryLanguage)}
                selected={c.secondaryLanguages.filter((language) => language !== c.primaryLanguage)}
                onToggle={toggleSecondary}
              />
              <p className="mt-1.5 text-xs text-ink-subtle">The agent may switch to these mid-call.</p>
            </div>
          </div>

          <SideTitle icon={Sparkles}>Model</SideTitle>
          <div className="mt-3 space-y-4">
            {providerSelect("llm", "Language model (LLM)", c.llmProvider, (next) => {
              setAgent((current) => ({
                ...current,
                config: { ...current.config, llmProvider: next, llmModel: "" },
              }));
            })}
            {models.length > 0 && (
              <div>
                <label className="mb-1.5 block text-[0.8125rem] font-medium text-ink">Model</label>
                <select
                  value={c.llmModel}
                  onChange={(event) => set("llmModel", event.target.value)}
                  aria-label="Model"
                  className="block h-10 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink focus:border-ink focus:ring-4 focus:ring-surface-muted focus:outline-none"
                >
                  <option value="">Default</option>
                  {models.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {providerSelect("stt", "Speech-to-Text", c.sttProvider, (next) => set("sttProvider", next))}
          </div>

          <SideTitle icon={Clock}>Call</SideTitle>
          <div className="mt-3">
            <TextField
              id="agent-max-call"
              label="Maximum call length (minutes)"
              type="number"
              min={1}
              max={60}
              value={Math.round((c.maxCallSeconds || 300) / 60)}
              onChange={(event) =>
                set("maxCallSeconds", Math.max(1, Math.min(60, Number(event.target.value) || 1)) * 60)
              }
            />
          </div>

          <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-accent-soft bg-accent-wash px-3 py-2.5">
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-accent-strong" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-ink-muted">
              Voice, model and transcription use the API keys you saved under <b>Providers</b>. Test and Web call run on
              them right here in the browser.
            </p>
          </div>
        </aside>
      </div>

      {testing && (
        <TestChat
          config={c}
          firstMessage={agent.firstMessage}
          instructions={agent.instructions}
          name={agent.name}
          onClose={() => setTesting(false)}
        />
      )}
      {calling && (
        <WebCall
          config={c}
          firstMessage={agent.firstMessage}
          instructions={agent.instructions}
          name={agent.name}
          onClose={() => setCalling(false)}
        />
      )}
    </div>
  );
}

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
  Play,
  Plus,
  Sparkles,
  Square,
  Trash2,
  Volume2,
  Wrench,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Action } from "@/components/panel/action";
import { SelectField, TextField, TextareaField } from "@/components/panel/field";
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
  LANGUAGES,
  TOOL_METHODS,
  TOOL_RUN_WHEN,
  newToolId,
  pickVoiceFromList,
  templateById,
  type Voice,
} from "@/lib/agents/templates";
import { apiFetch } from "@/lib/calling/remote-store";
import { useEngine } from "@/lib/engine/store";
import { TestChat } from "./test-chat";
import { SamvaadCall, type SamvaadIds } from "./samvaad-call";
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

/* ── Voice picker with per-voice preview ────────────────────────── */
function VoicePicker({
  voices,
  value,
  onPick,
  language,
}: {
  voices: Voice[];
  value: string;
  onPick: (id: string) => void;
  language: string;
}) {
  const [open, setOpen] = useState(false);
  const [playingId, setPlayingId] = useState("");
  const [loadingId, setLoadingId] = useState("");
  const [note, setNote] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const selected = voices.find((voice) => voice.id === value);
  const voiceMeta = (voice: Voice) => [voice.gender, voice.language].filter(Boolean).join(" · ");

  // Close the list when clicking anywhere outside it.
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const stopPreview = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlayingId("");
  };
  useEffect(() => stopPreview, []); // never keep audio playing after unmount

  async function preview(voice: Voice) {
    if (playingId === voice.id) {
      stopPreview();
      return;
    }
    stopPreview();
    setLoadingId(voice.id);
    setNote("");
    try {
      const d = await apiFetch<{ audio?: string; mime?: string }>("/agents/speak", {
        method: "POST",
        body: JSON.stringify({
          voiceId: voice.id,
          text: "Hi there! I'm " + (voice.name.split(/[–·(]/)[0].trim() || "your agent") + ", and this is how I sound on a call.",
          language,
        }),
      });
      if (!d.audio) throw new Error("No audio came back for this voice.");
      const audio = new Audio("data:" + (d.mime || "audio/mpeg") + ";base64," + d.audio);
      audioRef.current = audio;
      audio.onended = () => setPlayingId((current) => (current === voice.id ? "" : current));
      await audio.play();
      setPlayingId(voice.id);
    } catch (cause) {
      setNote((cause as Error).message || "Could not preview this voice.");
    } finally {
      setLoadingId("");
    }
  }

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Voice"
        className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink focus:border-ink focus:ring-4 focus:ring-surface-muted focus:outline-none"
      >
        {selected ? (
          <span className="flex min-w-0 items-baseline gap-1.5">
            <span className="truncate">{selected.name}</span>
            {voiceMeta(selected) && <span className="shrink-0 text-xs text-ink-subtle">{voiceMeta(selected)}</span>}
          </span>
        ) : (
          <span className="text-ink-subtle">Select a voice</span>
        )}
        <ChevronDown className={cn("size-4 shrink-0 text-ink-muted transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Voices"
          className="absolute z-20 mt-1.5 max-h-72 w-full overflow-y-auto rounded-lg border border-line-strong bg-surface p-1 shadow-lg"
        >
          {voices.map((voice) => (
            <li
              key={voice.id}
              role="option"
              aria-selected={voice.id === value}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5",
                voice.id === value ? "bg-surface-muted" : "hover:bg-surface-muted/60",
              )}
            >
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  void preview(voice);
                }}
                aria-label={(playingId === voice.id ? "Stop preview of " : "Preview ") + voice.name}
                title={playingId === voice.id ? "Stop" : "Listen"}
                className="flex size-6 shrink-0 items-center justify-center rounded-full border border-line text-ink-muted transition-colors hover:border-ink hover:text-ink"
              >
                {loadingId === voice.id ? (
                  <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                ) : playingId === voice.id ? (
                  <Square className="size-2.5 fill-current" aria-hidden="true" />
                ) : (
                  <Play className="ml-px size-3 fill-current" aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  onPick(voice.id);
                  setOpen(false);
                }}
                className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left text-sm text-ink"
              >
                <span className="truncate">{voice.name}</span>
                <span className="flex shrink-0 items-center gap-1.5">
                  {voiceMeta(voice) && <span className="text-xs text-ink-subtle">{voiceMeta(voice)}</span>}
                  {voice.id === value && <Check className="size-3.5 text-ink" aria-hidden="true" />}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-1.5 text-xs text-ink-subtle">
        {note || voices.length + " voices · press ▸ to hear a sample."}
      </p>
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

/**
 * Shown when a leg of the engine is not available yet.
 *
 * Deliberately vendor-free: which service is missing is a Reyvoca operations
 * matter, not something to explain to a customer.
 */
function EngineGap({ what }: { what: string }) {
  return (
    <p className="rounded-lg border border-line bg-surface-muted px-3 py-2.5 text-xs leading-relaxed text-ink-muted">
      {what} is not switched on for this workspace yet. Reyvoca support can enable it.
    </p>
  );
}

/** One leg of the engine, as a live / pending row. */
function EngineRow({ label, on, ready }: { label: string; on: boolean; ready: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 text-[0.8125rem]">
      <span className="text-ink">{label}</span>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
          !ready
            ? "border-line bg-surface-muted text-ink-subtle"
            : on
              ? "border-success-line bg-success-soft text-success"
              : "border-line bg-surface-muted text-ink-muted",
        )}
      >
        <span
          aria-hidden="true"
          className={cn("size-1.5 rounded-full", ready && on ? "bg-success" : "bg-ink-subtle")}
        />
        {!ready ? "Checking…" : on ? "Live" : "Pending"}
      </span>
    </div>
  );
}

/* ── Editor ─────────────────────────────────────────────────────── */
export function AgentEditor({
  initial,
  onDone,
  onCancel,
  backLabel = "My Agents",
}: {
  initial: EditableAgent;
  onDone: (agent: Agent) => void;
  onCancel: () => void;
  backLabel?: string;
}) {
  const [agent, setAgent] = useState<EditableAgent>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // Voices and languages come from the engine, resolved on the server. The
  // editor never learns — or needs — which vendor is behind them.
  const { engine, ready: engineReady } = useEngine();
  const [toolEdit, setToolEdit] = useState<AgentTool | "new" | null>(null);
  const [testing, setTesting] = useState(false);
  const [calling, setCalling] = useState(false);
  // When Sarvam is configured, web calls run there; otherwise the in-browser
  // pipeline below stays as the fallback.
  const [samvaad, setSamvaad] = useState<SamvaadIds | null>(null);
  useEffect(() => {
    let alive = true;
    apiFetch<{ samvaad: SamvaadIds | null }>("/calls/web")
      .then((data) => alive && setSamvaad(data.samvaad))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const set = <K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) =>
    setAgent((current) => ({ ...current, config: { ...current.config, [key]: value } }));
  const setField = <K extends keyof EditableAgent>(key: K, value: EditableAgent[K]) =>
    setAgent((current) => ({ ...current, [key]: value }));
  const voices = engine.voices;
  const voicesBusy = !engineReady;
  const languages = engine.languages.length ? engine.languages : LANGUAGES;

  /**
   * The config as it actually applies, reconciled with the engine.
   *
   * Reyvoca owns the engine, so the voices and languages on offer can change
   * under an agent that was saved months ago. Rather than writing corrections
   * back into state, the editor derives them while rendering: the best-fit
   * voice stands in for one the engine no longer has, and the language pickers
   * never show a language the current voice cannot speak. What is shown is
   * what gets saved.
   */
  const stored = agent.config;
  const autoVoice = voices.some((voice) => voice.id === stored.voiceId)
    ? null
    : pickVoiceFromList(stored.template, voices);
  const primaryLanguage = languages.includes(stored.primaryLanguage)
    ? stored.primaryLanguage
    : languages[0];
  const c: AgentConfig = {
    ...stored,
    voiceId: autoVoice ? autoVoice.id : stored.voiceId,
    voiceName: autoVoice ? autoVoice.name : stored.voiceName,
    primaryLanguage,
    secondaryLanguages: stored.secondaryLanguages.filter(
      (language) => languages.includes(language) && language !== primaryLanguage,
    ),
  };

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
        config: c,
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
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-[0.8125rem] font-medium text-ink">
                Voice
                {voicesBusy && <Loader2 className="size-3 animate-spin text-ink-subtle" aria-hidden="true" />}
              </label>
              {voices.length === 0 && !voicesBusy ? (
                <EngineGap what="A Reyvoca voice" />
              ) : (
                <VoicePicker
                  voices={voices}
                  value={c.voiceId}
                  onPick={pickVoice}
                  language={c.primaryLanguage}
                />
              )}
            </div>

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
                {languages.map((language) => (
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
                options={languages.filter((language) => language !== c.primaryLanguage)}
                selected={c.secondaryLanguages.filter((language) => language !== c.primaryLanguage)}
                onToggle={toggleSecondary}
              />
              <p className="mt-1.5 text-xs text-ink-subtle">The agent may switch to these mid-call.</p>
            </div>
          </div>

          <SideTitle icon={Sparkles}>Engine</SideTitle>
          <div className="mt-3 space-y-2.5">
            {/* Reyvoca picks and tunes the stack behind a call; the customer
                sees whether each leg is live, not who supplies it. */}
            <EngineRow label="Conversation" on={engine.intelligence} ready={engineReady} />
            <EngineRow label="Speech recognition" on={engine.transcription} ready={engineReady} />
            <EngineRow label="Voice synthesis" on={engine.voice} ready={engineReady} />
            {engineReady && !engine.intelligence && (
              <EngineGap what="Live conversation" />
            )}
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
              Voice, conversation and transcription run on the managed <b>Reyvoca engine</b> — nothing to connect.
              Test and Web call use it right here in the browser.
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
      {calling && samvaad && (
        <SamvaadCall
          ids={samvaad}
          agentId={agent.id || undefined}
          config={c}
          firstMessage={agent.firstMessage}
          instructions={agent.instructions}
          name={agent.name}
          onClose={() => setCalling(false)}
        />
      )}
      {calling && !samvaad && (
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

/**
 * Agent types.
 *
 * Kept free of "use client" so both the browser store and the server routes
 * can import them without pulling a client module onto the server.
 */

export const AGENT_ROLES = ["Sales", "Support", "Recruiting", "Renewals", "Custom"] as const;

export type AgentRole = (typeof AGENT_ROLES)[number];
export type AgentStatus = "Draft" | "Ready" | "Live" | "Paused";

export type ToolMethod = "POST" | "GET" | "PUT" | "DELETE" | "PATCH";
export type ToolRunWhen = "during" | "end";

/** An HTTP action the agent may trigger during or after a call. */
export type AgentTool = {
  id: string;
  name: string;
  description: string;
  method: ToolMethod;
  url: string;
  runWhen: ToolRunWhen;
};

/**
 * Full voice configuration for an agent.
 *
 * Provider fields name entries saved under Providers (`llm` / `tts` / `stt`);
 * empty string means "not connected yet" — the agent stays a draft.
 */
export type AgentConfig = {
  /** Template id this agent started from ("scratch" for a blank agent). */
  template: string;
  /** Skip the welcome line and let the caller speak first. */
  skipWelcome: boolean;
  /** Call starts in this language. */
  primaryLanguage: string;
  /** Languages the agent may switch to mid-call. */
  secondaryLanguages: string[];
  llmProvider: string;
  llmModel: string;
  voiceProvider: string;
  voiceId: string;
  voiceName: string;
  sttProvider: string;
  maxCallSeconds: number;
  tools: AgentTool[];
  /** Optional webhook that receives call events for automations. */
  inboundWebhook: string;
};

export type Agent = {
  id: string;
  name: string;
  purpose: string;
  role: AgentRole;
  /** Primary language (mirrors config.primaryLanguage for older readers). */
  language: string;
  /** The first thing the agent says when the call connects. */
  firstMessage: string;
  instructions: string;
  status: AgentStatus;
  createdAt: string;
  config: AgentConfig;
};

/** `language` is derived from config.primaryLanguage on the server. */
export type AgentDraft = Omit<Agent, "id" | "status" | "createdAt" | "language">;

/** A fresh config with nothing connected. */
export function emptyAgentConfig(): AgentConfig {
  return {
    template: "scratch",
    skipWelcome: false,
    primaryLanguage: "English",
    secondaryLanguages: [],
    llmProvider: "",
    llmModel: "",
    voiceProvider: "",
    voiceId: "",
    voiceName: "",
    sttProvider: "",
    maxCallSeconds: 300,
    tools: [],
    inboundWebhook: "",
  };
}

/** Fills config defaults so agents saved by earlier versions keep loading. */
export function normalizeAgentConfig(config: unknown): AgentConfig {
  const partial = (typeof config === "object" && config !== null ? config : {}) as Partial<AgentConfig>;
  return { ...emptyAgentConfig(), ...partial };
}

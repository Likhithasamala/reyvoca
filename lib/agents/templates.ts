/**
 * Agent template catalogue + provider/language metadata.
 *
 * Each template is a fully prebuilt, plug-and-ready voice agent: a
 * production-grade system prompt (with {{variables}} to fill in), a welcome
 * line, suggested tools, and per-task preference lists that auto-pick the best
 * model / voice / transcription from the providers the workspace has connected.
 *
 * Client-safe: no server imports, usable from both editor UI and API routes.
 */
import {
  CalendarCheck,
  Lightbulb,
  LifeBuoy,
  TrendingUp,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { AgentRole, AgentTool, ToolMethod, ToolRunWhen } from "./types";

export type TemplateTool = {
  name: string;
  description: string;
  method: ToolMethod;
  url: string;
  runWhen: ToolRunWhen;
};

export type AgentTemplate = {
  id: string;
  name: string;
  desc: string;
  icon: LucideIcon;
  role: AgentRole;
  variables: string[];
  /** [provider, model] pairs, best fit for this task first. */
  modelPrefs: [string, string][];
  preferredVoiceNames: string[];
  maxCallSeconds: number;
  tools: TemplateTool[];
  welcome: string;
  instructions: string;
};

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: "faq",
    name: "FAQ Assistant",
    desc: "Answer common questions using information you provide",
    icon: LifeBuoy,
    role: "Support",
    variables: ["business_name", "agent_name", "business_hours"],
    // Fast + accurate + low latency matters most for a voice FAQ line.
    modelPrefs: [
      ["groq", "Llama 3.1 8B"],
      ["openai", "GPT-4o mini"],
      ["anthropic", "Claude Haiku 4.5"],
      ["google", "Gemini 1.5 Flash"],
      ["openai", "GPT-4o"],
      ["anthropic", "Claude Sonnet 4.5"],
      ["google", "Gemini 1.5 Pro"],
    ],
    preferredVoiceNames: ["rachel", "jenny", "bella", "anushka", "manisha", "swara"],
    maxCallSeconds: 300,
    tools: [],
    welcome:
      "Hi, thanks for calling {{business_name}}! This is {{agent_name}}. What can I help you with today?",
    instructions: `# Role
You are {{agent_name}}, the voice FAQ assistant for {{business_name}}. You answer callers' questions clearly and accurately using only the information in your knowledge base.

# Context
- Business: {{business_name}}
- Hours: {{business_hours}}
- You are on a live phone call, so keep answers short and natural — one or two sentences, then check if they need more.

# How to answer
1. Greet the caller warmly and ask how you can help.
2. Listen for the question and answer it directly from your knowledge base.
3. If a question has several parts, answer one part at a time.
4. If you are not certain or the answer isn't in your knowledge, say so honestly ("I'm not totally sure about that — let me get you to someone who can help") and offer a human handoff.
5. Before ending, ask "Is there anything else I can help you with?"

# Rules
- Never invent facts, prices, policies, or dates. Only use what you actually know.
- Do not give legal, medical, or financial advice.
- Keep a warm, concise, professional tone. Say numbers naturally for speech.
- If the caller is upset, stay calm and empathetic, and offer to connect them to a person.`,
  },
  {
    id: "appointment",
    name: "Appointment Intake",
    desc: "Collect appointment requests and confirm the details",
    icon: CalendarCheck,
    role: "Support",
    variables: ["business_name", "agent_name", "customer_term"],
    // Reliable step-following + structured data collection.
    modelPrefs: [
      ["openai", "GPT-4o"],
      ["anthropic", "Claude Sonnet 4.5"],
      ["google", "Gemini 1.5 Pro"],
      ["openai", "GPT-4o mini"],
      ["anthropic", "Claude Haiku 4.5"],
      ["google", "Gemini 1.5 Flash"],
      ["groq", "Llama 3.1 8B"],
    ],
    preferredVoiceNames: ["bella", "rachel", "jenny", "anushka", "manisha", "swara"],
    maxCallSeconds: 420,
    tools: [
      {
        name: "Check Availability",
        description: "Look up open appointment slots for a requested date",
        method: "GET",
        url: "https://api.yourbackend.com/availability",
        runWhen: "during",
      },
      {
        name: "Book Appointment",
        description: "Create the appointment once the caller confirms the details",
        method: "POST",
        url: "https://api.yourbackend.com/book",
        runWhen: "during",
      },
    ],
    welcome:
      "Hello! Thanks for calling {{business_name}}. I can help you book an appointment — may I start with your name?",
    instructions: `# Role
You are {{agent_name}}, the appointment booking assistant for {{business_name}}. Your job is to collect everything needed to book an appointment and confirm it back clearly.

# Information to collect (one at a time)
1. Caller's full name
2. Best contact number — confirm it back digit by digit
3. Reason for the appointment / service needed
4. Preferred date and time, plus one backup option
5. Whether they are a new or returning {{customer_term}}

# Flow
1. Greet warmly and let them know you can help book an appointment.
2. Collect each item above, one question at a time, acknowledging each answer.
3. If the Check Availability tool is connected, verify their preferred time before confirming.
4. Read the full appointment details back and ask them to confirm.
5. Use Book Appointment to create it, tell them what happens next, and close warmly.

# Rules
- Only collect the information listed above. Never ask for payment card or ID numbers.
- Always read back the date, time, and phone number to confirm accuracy.
- If the requested time is unavailable, offer the two closest alternatives.
- Stay warm, efficient, and reassuring. Keep each turn short for a phone call.`,
  },
  {
    id: "helpdesk",
    name: "IT Helpdesk",
    desc: "Guide callers through troubleshooting and next steps",
    icon: Wrench,
    role: "Support",
    variables: ["business_name", "agent_name"],
    // Strong step-by-step reasoning wins here.
    modelPrefs: [
      ["anthropic", "Claude Sonnet 4.5"],
      ["openai", "GPT-4o"],
      ["openai", "o1"],
      ["google", "Gemini 1.5 Pro"],
      ["groq", "Llama 3.1 8B"],
      ["anthropic", "Claude Haiku 4.5"],
      ["openai", "GPT-4o mini"],
      ["google", "Gemini 1.5 Flash"],
    ],
    preferredVoiceNames: ["adam", "guy", "antoni", "abhilash", "karun"],
    maxCallSeconds: 600,
    tools: [
      {
        name: "Create Ticket",
        description: "Open a support ticket when the issue needs a human engineer",
        method: "POST",
        url: "https://api.yourbackend.com/tickets",
        runWhen: "end",
      },
    ],
    welcome:
      "IT support here, this is {{agent_name}}. Can you tell me what's going wrong, and I'll help you sort it out?",
    instructions: `# Role
You are {{agent_name}}, a calm and patient IT support agent for {{business_name}}. You help callers resolve technical issues and escalate to a human engineer when needed.

# Flow
1. Greet the caller and ask them to describe the problem in their own words.
2. Ask focused clarifying questions: what they were doing, what they expected, what actually happened, and any error message shown.
3. Walk them through troubleshooting ONE step at a time. Wait for the result of each step before giving the next.
4. Confirm whether the issue is resolved.
5. If it isn't resolved after reasonable steps — or it is urgent or security-related — create a ticket, escalate to a human engineer, and summarize what was already tried.

# Rules
- Never ask for passwords, one-time codes, or full card numbers. Verify identity only with approved, non-sensitive details.
- Explain every step in plain, non-technical language. Avoid jargon.
- Be patient and never make the caller feel at fault.
- Keep steps short and confirm understanding before moving on.
- If the caller mentions data loss, a breach, or a locked account, treat it as high priority and escalate immediately.`,
  },
  {
    id: "sales",
    name: "Sales Outreach",
    desc: "Start sales conversations and identify interested prospects",
    icon: TrendingUp,
    role: "Sales",
    variables: ["business_name", "agent_name", "product_name", "qualifying_question", "next_step"],
    // Natural, warm, persuasive prose.
    modelPrefs: [
      ["anthropic", "Claude Sonnet 4.5"],
      ["openai", "GPT-4o"],
      ["google", "Gemini 1.5 Pro"],
      ["groq", "Llama 3.1 8B"],
      ["openai", "GPT-4o mini"],
      ["anthropic", "Claude Haiku 4.5"],
      ["google", "Gemini 1.5 Flash"],
    ],
    preferredVoiceNames: ["antoni", "adam", "rachel", "bella"],
    maxCallSeconds: 300,
    tools: [
      {
        name: "Log Lead",
        description: "Record the prospect outcome and any booked next step",
        method: "POST",
        url: "https://api.yourbackend.com/leads",
        runWhen: "end",
      },
    ],
    welcome: "Hi, this is {{agent_name}} calling from {{business_name}} — do you have a quick minute?",
    instructions: `# Role
You are {{agent_name}}, a friendly outbound representative for {{business_name}}. You introduce {{product_name}}, find out whether there's a genuine need, and move interested prospects to one clear next step.

# Flow
1. Open warmly, introduce yourself and {{business_name}}, and ask for a brief moment of their time.
2. In one or two sentences, explain what {{product_name}} does and its main benefit.
3. Ask one or two qualifying questions to learn whether they have a relevant need: {{qualifying_question}}
4. If interested: propose one specific next step — {{next_step}} — and confirm a time. Log the lead.
5. If not interested: thank them politely and end. Do not push.

# Rules
- Respect "no." If they decline or ask to be removed, apologize for the interruption, note the request, and end warmly.
- Be honest about what {{product_name}} does. Never overpromise or invent features, pricing, or guarantees.
- Keep it conversational and brief — this is a call, not a monologue.
- Follow calling regulations: identify yourself and {{business_name}} up front and honor do-not-call requests.`,
  },
  {
    id: "assistant",
    name: "Personal Assistant",
    desc: "Explore ideas and think through decisions out loud",
    icon: Lightbulb,
    role: "Custom",
    variables: ["agent_name", "owner_name"],
    // Thoughtful, balanced reasoning.
    modelPrefs: [
      ["anthropic", "Claude Sonnet 4.5"],
      ["openai", "GPT-4o"],
      ["openai", "o1"],
      ["google", "Gemini 1.5 Pro"],
      ["anthropic", "Claude Haiku 4.5"],
      ["openai", "GPT-4o mini"],
      ["google", "Gemini 1.5 Flash"],
      ["groq", "Llama 3.1 8B"],
    ],
    preferredVoiceNames: ["bella", "rachel", "sonic", "vidya", "arya"],
    maxCallSeconds: 600,
    tools: [],
    welcome: "Hey {{owner_name}}! It's {{agent_name}}. What's on your mind today?",
    instructions: `# Role
You are {{agent_name}}, a thoughtful personal assistant for {{owner_name}}. You help think through ideas, weigh decisions, and keep track of what matters.

# How you help
1. Greet {{owner_name}} and ask what's on their mind.
2. When they share an idea or decision, ask one or two clarifying questions to understand the goal and the constraints.
3. Offer balanced perspectives — lay out options with their trade-offs rather than pushing one answer.
4. Help break big tasks into concrete next steps.
5. Summarize the decisions and action items at the end.

# Rules
- Be concise and conversational — this is a spoken conversation, not an essay.
- Don't give professional legal, medical, or financial advice; suggest consulting a qualified professional for those.
- Be candid and honest, including about downsides. Don't just agree to please.
- Keep a calm, encouraging, and focused tone.`,
  },
];

export const SCRATCH_WELCOME = "Hello! How can I help you today?";

export const templateById = (id: string) => AGENT_TEMPLATES.find((t) => t.id === id);

/* ── Providers & models ─────────────────────────────────────────── */
export const PROVIDER_NAMES: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
  groq: "Groq",
  deepgram: "Deepgram",
  azure: "Azure",
  elevenlabs: "ElevenLabs",
  munsit: "Munsit",
  speechmatics: "Speechmatics",
  sarvam: "Sarvam AI",
  cartesia: "Cartesia",
  smallestai: "Smallest.ai",
};
export const providerLabel = (id: string) => PROVIDER_NAMES[id] ?? id;

export const LLM_MODELS: Record<string, string[]> = {
  anthropic: ["Claude Sonnet 4.5", "Claude Haiku 4.5"],
  openai: ["GPT-4o", "GPT-4o mini", "o1"],
  google: ["Gemini 1.5 Pro", "Gemini 1.5 Flash"],
  groq: ["Llama 3.1 8B"],
  sarvam: ["Sarvam 105B", "Sarvam 105B (base)"],
};

/** General provider preference orders (best general-purpose first). */
const TTS_ORDER = ["elevenlabs", "cartesia", "azure", "sarvam", "smallestai"];
const STT_ORDER = ["deepgram", "azure", "sarvam", "elevenlabs", "speechmatics", "munsit", "google"];

export type ConnectedProviders = { llm: string[]; tts: string[]; stt: string[] };

function pickModel(prefs: [string, string][], available: string[]) {
  for (const [provider, model] of prefs) {
    if (available.includes(provider) && (LLM_MODELS[provider] ?? []).includes(model)) {
      return { provider, model };
    }
  }
  return { provider: available[0] ?? "", model: "" };
}
function pickProvider(order: string[], available: string[]) {
  for (const provider of order) if (available.includes(provider)) return provider;
  return available[0] ?? "";
}

/** Resolves every automatic selection for a template given connected providers. */
export function resolveSelections(template: AgentTemplate, providers: ConnectedProviders) {
  return {
    llm: pickModel(template.modelPrefs, providers.llm),
    tts: pickProvider(TTS_ORDER, providers.tts),
    stt: pickProvider(STT_ORDER, providers.stt),
  };
}

/* ── Languages ──────────────────────────────────────────────────── */
export const LANGUAGES = [
  "English",
  "Hindi",
  "Telugu",
  "Tamil",
  "Kannada",
  "Marathi",
  "Bengali",
  "Gujarati",
  "Spanish",
  "Arabic",
  "French",
  "German",
];

/**
 * Languages each TTS provider can actually speak — drives the language pickers
 * so you only ever pick a language the chosen voice supports.
 */
const TTS_LANGUAGES: Record<string, string[]> = {
  cartesia: ["English", "Hindi", "Telugu", "Tamil", "Kannada", "Marathi", "Bengali", "Gujarati", "Malayalam", "Punjabi", "Odia", "Urdu", "Spanish", "French", "German", "Portuguese", "Italian", "Dutch", "Polish", "Russian", "Swedish", "Turkish", "Chinese", "Japanese", "Korean", "Arabic", "Hebrew", "Tagalog", "Bulgarian", "Romanian", "Czech", "Greek", "Finnish", "Croatian", "Malay", "Slovak", "Danish", "Ukrainian", "Hungarian", "Norwegian", "Vietnamese", "Thai", "Georgian", "Indonesian"],
  sarvam: ["English", "Hindi", "Telugu", "Tamil", "Kannada", "Marathi", "Bengali", "Gujarati"],
  smallestai: ["English", "Hindi", "Telugu", "Tamil", "Kannada", "Marathi", "Bengali", "Gujarati"],
  elevenlabs: ["English", "Hindi", "Spanish", "French", "German", "Portuguese", "Italian", "Dutch", "Polish", "Arabic", "Telugu", "Tamil"],
  azure: ["English", "Hindi", "Telugu", "Tamil", "Kannada", "Marathi", "Bengali", "Gujarati", "Spanish", "Arabic", "French", "German"],
};
export const langsFor = (ttsProvider: string) => TTS_LANGUAGES[ttsProvider] ?? LANGUAGES;

/** Browser speech-recognition locales per language. */
export const SR_LOCALE: Record<string, string> = {
  English: "en-US", Hindi: "hi-IN", Telugu: "te-IN", Tamil: "ta-IN", Kannada: "kn-IN",
  Marathi: "mr-IN", Bengali: "bn-IN", Gujarati: "gu-IN", Malayalam: "ml-IN", Punjabi: "pa-IN",
  Odia: "or-IN", Urdu: "ur-IN", Spanish: "es-ES", French: "fr-FR", German: "de-DE",
  Portuguese: "pt-BR", Italian: "it-IT", Dutch: "nl-NL", Polish: "pl-PL", Russian: "ru-RU",
  Swedish: "sv-SE", Turkish: "tr-TR", Chinese: "zh-CN", Japanese: "ja-JP", Korean: "ko-KR",
  Arabic: "ar-SA", Hebrew: "he-IL", Tagalog: "fil-PH", Bulgarian: "bg-BG", Romanian: "ro-RO",
  Czech: "cs-CZ", Greek: "el-GR", Finnish: "fi-FI", Croatian: "hr-HR", Malay: "ms-MY",
  Slovak: "sk-SK", Danish: "da-DK", Ukrainian: "uk-UA", Hungarian: "hu-HU", Norwegian: "nb-NO",
  Vietnamese: "vi-VN", Thai: "th-TH", Georgian: "ka-GE", Indonesian: "id-ID",
};

/**
 * Appends a language directive so the model actually replies in the call's
 * language (otherwise it answers in English and the voice synthesizes garbled
 * text). The allowed languages come from the agent's own settings.
 */
export function withLanguageDirective(
  instructions: string,
  primaryLanguage: string,
  secondaryLanguages: string[],
) {
  const base = (instructions || "").trim() || "You are a helpful, concise voice assistant.";
  const primary = primaryLanguage || "English";
  const secondaries = (secondaryLanguages ?? []).filter((l) => l && l !== primary);
  let line =
    "\n\nIMPORTANT: Keep answers short and natural for a spoken phone conversation.";
  if (secondaries.length) {
    const allowed = [primary, ...secondaries].join(", ");
    line +=
      " You may speak ONLY these languages: " +
      allowed +
      ". Start in " +
      primary +
      ". Switch languages only when the caller speaks one of the other allowed languages, matching them turn by turn. Never reply in any language outside this list — if the caller uses one, politely continue in " +
      primary +
      ".";
  } else {
    line +=
      " Reply ONLY in " +
      primary +
      " on every turn, no matter what language the caller speaks or asks for. If the caller uses another language, politely explain in " +
      primary +
      " that you can only assist in " +
      primary +
      ". Never switch languages.";
  }
  return base + line;
}

/**
 * Detects a text's language by its script, limited to the agent's allowed
 * languages, so TTS + the recognizer can follow the caller. Returns "" for
 * Latin/unknown (keep the current language — Latin scripts can't be told apart
 * by script alone).
 */
const SCRIPT_LANGS: [string, RegExp][] = [
  ["Telugu", /[ఀ-౿]/g], ["Kannada", /[ಀ-೿]/g], ["Tamil", /[஀-௿]/g],
  ["Malayalam", /[ഀ-ൿ]/g], ["Bengali", /[ঀ-৿]/g], ["Gujarati", /[઀-૿]/g],
  ["Punjabi", /[਀-੿]/g], ["Odia", /[଀-୿]/g], ["Hindi", /[ऀ-ॿ]/g],
  ["Arabic", /[؀-ۿ]/g], ["Hebrew", /[֐-׿]/g], ["Greek", /[Ͱ-Ͽ]/g],
  ["Thai", /[฀-๿]/g], ["Georgian", /[Ⴀ-ჿ]/g], ["Russian", /[Ѐ-ӿ]/g],
  ["Japanese", /[぀-ヿ]/g], ["Korean", /[가-힯]/g], ["Chinese", /[一-鿿]/g],
];
export function detectLang(text: string, allowed: string[]): string {
  const value = String(text || "");
  if (!value.trim()) return "";
  const set = (allowed ?? []).filter(Boolean);
  let best = "";
  let bestCount = 0;
  for (const [lang, re] of SCRIPT_LANGS) {
    const count = value.match(re)?.length ?? 0;
    if (count > bestCount) {
      bestCount = count;
      best = lang;
    }
  }
  if (!best) return "";
  // Shared scripts: fall back to a sibling language if the first isn't enabled.
  if (best === "Hindi" && !set.includes("Hindi") && set.includes("Marathi")) best = "Marathi";
  if (best === "Arabic" && !set.includes("Arabic") && set.includes("Urdu")) best = "Urdu";
  if (best === "Russian" && !set.includes("Russian")) {
    best = set.includes("Ukrainian") ? "Ukrainian" : set.includes("Bulgarian") ? "Bulgarian" : best;
  }
  return set.includes(best) ? best : "";
}

/* ── Voices ─────────────────────────────────────────────────────── */
export type Voice = { id: string; name: string; language?: string };

/** Curated fallback voices, used when a provider's live library isn't loaded. */
export const VOICE_CATALOG: Record<string, Voice[]> = {
  elevenlabs: [
    { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", language: "English" },
    { id: "pNInz6obpgDQGcFmaJgB", name: "Adam", language: "English" },
    { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", language: "English" },
    { id: "ErXwobaYiN019PkySvjV", name: "Antoni", language: "English" },
  ],
  // Cartesia voices are multilingual — the language comes from the call, not the
  // voice. Once a Cartesia key is saved under Providers, the dropdown replaces
  // this with the account's full live library.
  cartesia: [
    { id: "db6b0ed5-d5d3-463d-ae85-518a07d3c2b4", name: "Skylar – Friendly Guide", language: "US" },
    { id: "47c38ca4-5f35-497b-b1a3-415245fb35e1", name: "Daniel – Modern Assistant", language: "US" },
    { id: "9626c31c-bec5-4cca-baa8-f8ba9e84c8bc", name: "Jacqueline – Reassuring Agent", language: "US" },
    { id: "62ae83ad-4f6a-430b-af41-a9bede9286ca", name: "Gemma", language: "British" },
    { id: "ef191366-f52f-447a-a398-ed8c0f2943a1", name: "Archie", language: "British" },
  ],
  azure: [
    { id: "en-US-JennyNeural", name: "Jenny (US)", language: "English" },
    { id: "en-US-GuyNeural", name: "Guy (US)", language: "English" },
    { id: "hi-IN-SwaraNeural", name: "Swara (Hindi)", language: "Hindi" },
    { id: "te-IN-ShrutiNeural", name: "Shruti (Telugu)", language: "Telugu" },
  ],
  // Sarvam bulbul:v2 speakers — multilingual, language comes from the call.
  sarvam: [
    { id: "anushka", name: "Anushka · Female" },
    { id: "manisha", name: "Manisha · Female" },
    { id: "vidya", name: "Vidya · Female" },
    { id: "arya", name: "Arya · Female" },
    { id: "abhilash", name: "Abhilash · Male" },
    { id: "karun", name: "Karun · Male" },
    { id: "hitesh", name: "Hitesh · Male" },
  ],
  smallestai: [
    { id: "telugu-female-1", name: "Telugu · Female", language: "Telugu" },
    { id: "hindi-female-1", name: "Hindi · Female", language: "Hindi" },
  ],
};

/** Picks a voice for a template from a loaded list (preferred name, else first). */
export function pickVoiceFromList(templateId: string, voices: Voice[]): Voice | null {
  if (!voices.length) return null;
  const prefs = templateById(templateId)?.preferredVoiceNames ?? [];
  const match = voices.find((v) => prefs.some((p) => (v.name || "").toLowerCase().includes(p)));
  return match ?? voices[0];
}

export const TOOL_METHODS: ToolMethod[] = ["POST", "GET", "PUT", "DELETE", "PATCH"];
export const TOOL_RUN_WHEN: [ToolRunWhen, string][] = [
  ["during", "During call"],
  ["end", "At end of call"],
];

export function newToolId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return String(Date.now()) + Math.random().toString(16).slice(2);
  }
}

export type { AgentTool };

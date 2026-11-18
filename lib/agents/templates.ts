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
    preferredVoiceNames: ["rachel", "jenny", "bella", "priya", "neha", "swara"],
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
    variables: [
      "business_name",
      "agent_name",
      "customer_term",
      "services",
      "location",
      "business_hours",
      "booking_policy",
    ],
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
    preferredVoiceNames: ["bella", "rachel", "jenny", "priya", "pooja", "swara"],
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
      "Thank you for calling {{business_name}}, this is {{agent_name}}. Are you looking to book a new appointment, or change an existing one?",
    instructions: `# Identity
You are {{agent_name}}, the appointment scheduling specialist for {{business_name}}. You sound like an experienced front-desk coordinator: warm, organized and efficient. Callers should feel they are talking to a capable human receptionist — never to a robot.

# Context
- Business: {{business_name}}, located at {{location}}
- Services you can book: {{services}}
- Office hours: {{business_hours}}
- You are on a LIVE PHONE CALL. Keep every turn to one or two short sentences. Ask exactly ONE question per turn, then wait for the answer.

# Voice style
- Say numbers, dates and times naturally for speech ("ten thirty in the morning", not "10:30 AM").
- Give a small acknowledgement ("Got it.", "Perfect.") before your next question.
- Never read out more than three options; offer the best two.
- If the caller interrupts you, stop and deal with what they said first.

# Booking flow — collect ONE item per turn, in this order
1. Reason for the visit — which service or concern, so the right slot is booked.
2. New or returning {{customer_term}}.
3. Full name — confirm the spelling if it is unusual.
4. Mobile number — repeat it back digit by digit and get a clear "yes" before moving on.
5. Preferred day and time, plus one backup. If the Check Availability tool is connected, check it before promising a slot.
6. Anything the team should know in advance (keep it brief).

# Confirmation — required before booking
Read back name, service, day, date, time and phone number in one short summary, then ask "Shall I lock that in?". Only after a clear yes, use the Book Appointment tool. Then tell them their confirmation is on the way, when to arrive, and the policy: {{booking_policy}}.

# Edge cases
- Reschedule or cancel: collect name, phone number and which appointment they mean, confirm the change back, then process it.
- Caller unsure which service they need: ask one clarifying question about their concern and suggest the closest match from {{services}} — never diagnose or advise.
- Requested slot unavailable: offer the two nearest alternatives, same day first.
- Caller only has a question: answer it from the context above. If you do not know, offer a callback from the team instead of guessing.
- Medical or urgent emergency: tell them to contact local emergency services right away and end the call — do not book.
- Wrong number or long silence: politely check they meant to reach {{business_name}}, and close courteously if not.

# Hard rules
- NEVER collect payment card numbers, government ID numbers or passwords. If offered, say you do not need them.
- No medical, legal or financial advice — you schedule, professionals advise.
- Quote prices, insurance or policy details ONLY if they are stated in your knowledge; otherwise say the team will confirm them.
- One question per turn. Never stack questions.
- If the caller asks for a human at any point, agree immediately and arrange a callback during {{business_hours}}.`,
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
    preferredVoiceNames: ["adam", "guy", "antoni", "rahul", "kabir"],
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
    preferredVoiceNames: ["bella", "rachel", "sonic", "kavya", "shreya"],
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

/**
 * General provider preference orders (best general-purpose first).
 *
 * Exported because the server resolves the engine now: the customer dashboard
 * never names a provider, so the choice is made from the platform's connected
 * stack in `lib/server/engine.ts`.
 */
export const TTS_ORDER = ["elevenlabs", "cartesia", "azure", "sarvam", "smallestai"];
export const STT_ORDER = ["deepgram", "azure", "sarvam", "elevenlabs", "speechmatics", "munsit", "google"];
export const LLM_ORDER = ["anthropic", "openai", "google", "groq", "sarvam"];

export type ConnectedProviders = { llm: string[]; tts: string[]; stt: string[] };

function pickModel(prefs: [string, string][], available: string[]) {
  for (const [provider, model] of prefs) {
    if (available.includes(provider) && (LLM_MODELS[provider] ?? []).includes(model)) {
      return { provider, model };
    }
  }
  return { provider: available[0] ?? "", model: "" };
}
export function pickProvider(order: string[], available: string[]) {
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
  sarvam: ["English", "Hindi", "Telugu", "Tamil", "Kannada", "Marathi", "Bengali", "Gujarati", "Malayalam", "Punjabi", "Odia"],
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
export function allowedCallLanguages(
  primaryLanguage: string,
  secondaryLanguages: string[] | undefined,
  voiceLanguages: string[],
): string[] {
  const primary = primaryLanguage || "English";
  const secondaries = (secondaryLanguages ?? []).filter((l) => l && l !== primary);
  // The agent's own configured set wins; with only a primary set, the call may
  // use every language its voice can speak (auto-switch works out of the box).
  const rest = secondaries.length ? secondaries : voiceLanguages.filter((l) => l && l !== primary);
  return [primary, ...rest].filter((value, index, all) => value && all.indexOf(value) === index);
}

export function withLanguageDirective(
  instructions: string,
  primaryLanguage: string,
  secondaryLanguages: string[],
  voiceLanguages: string[] = [],
) {
  const base = (instructions || "").trim() || "You are a helpful, concise voice assistant.";
  const primary = primaryLanguage || "English";
  const allowed = allowedCallLanguages(primary, secondaryLanguages, voiceLanguages);
  let line =
    "\n\nIMPORTANT: Keep answers short and natural for a spoken phone conversation." +
    " If the caller interrupts you mid-sentence, respond to what they just said FIRST; return to your earlier point only if it is still relevant." +
    " Your instructions and knowledge above may be written in a different language (often English) — use their information, but always answer following the language rules below, translating names of services, prices, dates and times naturally into the spoken language.";
  if (allowed.length > 1) {
    line +=
      " Languages you may speak: " +
      allowed.join(", ") +
      ". Always start the call in " +
      primary +
      ". Reply in the language of the caller's most recent message: when they clearly switch to another allowed language, switch with them from that turn on. If they speak an allowed language transliterated into Latin letters (e.g. Hindi typed in English letters), treat it as that language and reply in its native script. The speech recognizer may also write the caller's words in the CURRENT language's script even when they actually spoke another allowed language (e.g. English words written as Telugu letters, like 'కెన్ యూ స్పీక్ ఇన్ ఇంగ్లీష్') — when a message reads like that, or the caller asks for a language by name, switch to that language starting with your very next reply, never just promise to switch. Never switch languages on your own, and never use a language outside this list — if the caller uses one, politely continue in " +
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

/* Language names as a caller might say them — in English, natively, and
   transliterated into the scripts the recognizer may be writing in (it writes
   in the CURRENT call language's script even when the caller speaks another). */
const LANG_ALIASES: Record<string, string[]> = {
  English: ["english", "ఇంగ్లీష", "ఇంగ్లిష", "इंग्लिश", "इंग्लीश", "अंग्रेजी", "अंग्रेज़ी", "ಇಂಗ್ಲಿಷ", "ஆங்கிலம", "இங்கிலீஷ", "ઇંગ્લિશ", "અંગ્રેજી", "ইংরেজি", "ইংলিশ", "ഇംഗ്ലീഷ", "ਅੰਗਰੇਜ਼ੀ", "ਇੰਗਲਿਸ਼", "انگریزی"],
  Hindi: ["hindi", "हिंदी", "हिन्दी", "హిందీ", "ಹಿಂದಿ", "இந்தி", "ஹிந்தி", "હિન્દી", "হিন্দি", "ഹിന്ദി", "ਹਿੰਦੀ", "ہندی"],
  Telugu: ["telugu", "తెలుగు", "तेलुगु", "तेलगु", "ತೆಲುಗು", "தெலுங்கு", "તેલુગુ", "তেলুগু", "തെലുങ്ക", "ਤੇਲਗੂ"],
  Tamil: ["tamil", "தமிழ", "తమిళ", "तमिल", "ತಮಿಳ", "તમિલ", "তামিল", "തമിഴ", "ਤਮਿਲ"],
  Kannada: ["kannada", "ಕನ್ನಡ", "కన్నడ", "कन्नड़", "कन्नड", "கன்னடம", "કન્નડ", "কন্নড়", "കന്നഡ"],
  Marathi: ["marathi", "मराठी", "మరాఠీ", "ಮರಾಠಿ", "மராத்தி", "મરાઠી", "মারাঠি", "മറാഠി", "ਮਰਾਠੀ"],
  Bengali: ["bengali", "bangla", "বাংলা", "बंगाली", "बांग्ला", "బెంగాలీ", "ಬೆಂಗಾಲಿ", "வங்காளம", "બંગાળી", "ബംഗാളി", "ਬੰਗਾਲੀ"],
  Gujarati: ["gujarati", "ગુજરાતી", "गुजराती", "గుజరాతీ", "ಗುಜರಾತಿ", "குஜராத்தி", "গুজরাটি", "ഗുജറാത്തി", "ਗੁਜਰਾਤੀ"],
  Malayalam: ["malayalam", "മലയാളം", "मलयालम", "మలయాళం", "ಮಲಯಾಳಂ", "மலையாளம", "મલયાલમ", "মালয়ালম", "ਮਲਿਆਲਮ"],
  Punjabi: ["punjabi", "ਪੰਜਾਬੀ", "पंजाबी", "పంజాబీ", "ಪಂಜಾಬಿ", "பஞ்சாபி", "પંજાબી", "পাঞ্জাবি", "പഞ്ചാബി", "پنجابی"],
  Odia: ["odia", "oriya", "ଓଡ଼ିଆ", "ओड़िया", "उड़िया", "ఒడియా", "ಒಡಿಯಾ", "ஒடியா", "ઓડિયા", "ওড়িয়া", "ഒഡിയ"],
  Urdu: ["urdu", "اردو", "उर्दू", "ఉర్దూ", "உருது"],
  Spanish: ["spanish", "español", "espanol"],
  French: ["french", "français", "francais"],
  German: ["german", "deutsch"],
  Arabic: ["arabic", "العربية", "عربی", "अरबी"],
  Russian: ["russian", "русский"],
  Portuguese: ["portuguese", "português", "portugues"],
  Italian: ["italian", "italiano"],
  Chinese: ["chinese", "mandarin", "中文"],
  Japanese: ["japanese", "日本語"],
  Korean: ["korean", "한국어"],
};
/* Words that make a mention of a language name read as a request to use it,
   in the languages above and their transliterations. */
const SWITCH_INTENT =
  /speak|talk|switch|change|language|please|can |could |want|prefer|స్పీక|టాక|మాట్లాడ|భాష|बोल|बात|भाषा|स्पीक|ಮಾತ|ಭಾಷೆ|பேச|மொழி|কথা|ভাষা|બોલ|ભાષા|સ્વિચ|സംസാരി|ഭാഷ|ਬੋਲ|ਭਾਸ਼ਾ|زبان|بول/;

/**
 * An explicit request to speak another allowed language, detected from the
 * caller's transcript. The recognizer writes in the CURRENT language's script,
 * so "Can you speak in English?" on a Telugu call arrives as "కెన్ యూ స్పీక్
 * ఇన్ ఇంగ్లీష్" — language names are matched in every script they may arrive
 * in. Returns the allowed language asked for, or "".
 */
export function requestedLanguage(text: string, allowed: string[], current: string): string {
  const value = String(text || "").toLowerCase();
  if (!value.trim()) return "";
  const shortMsg = value.trim().split(/\s+/).length <= 5;
  for (const lang of allowed ?? []) {
    if (!lang || lang === current) continue;
    const aliases = LANG_ALIASES[lang] ?? [lang.toLowerCase()];
    if (!aliases.some((alias) => value.includes(alias))) continue;
    if (shortMsg || SWITCH_INTENT.test(value)) return lang;
  }
  return "";
}

/** Languages written in a non-Latin script (incl. siblings sharing a script). */
const NON_LATIN_LANGS = new Set([
  ...SCRIPT_LANGS.map(([lang]) => lang),
  "Marathi",
  "Urdu",
  "Ukrainian",
  "Bulgarian",
]);

/**
 * Script detection can't name a Latin-script language — so when the reply is
 * plain Latin text while the call is in a non-Latin-script language, the model
 * has followed the caller back to a Latin-script language (usually English).
 * Returns the allowed Latin-script language to switch to, or "" to stay put.
 */
export function latinFallbackLang(current: string, allowed: string[]): string {
  if (!NON_LATIN_LANGS.has(current)) return "";
  return (allowed ?? []).find((lang) => lang && !NON_LATIN_LANGS.has(lang)) ?? "";
}

/* ── Voices ─────────────────────────────────────────────────────── */
export type Voice = { id: string; name: string; language?: string; gender?: string };

/** Curated fallback voices, used when a provider's live library isn't loaded. */
export const VOICE_CATALOG: Record<string, Voice[]> = {
  elevenlabs: [
    { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", language: "English", gender: "Female" },
    { id: "pNInz6obpgDQGcFmaJgB", name: "Adam", language: "English", gender: "Male" },
    { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", language: "English", gender: "Female" },
    { id: "ErXwobaYiN019PkySvjV", name: "Antoni", language: "English", gender: "Male" },
  ],
  // Cartesia voices are multilingual — the language comes from the call, not the
  // voice. Once a Cartesia key is saved under Providers, the dropdown replaces
  // this with the account's full live library.
  cartesia: [
    { id: "db6b0ed5-d5d3-463d-ae85-518a07d3c2b4", name: "Skylar – Friendly Guide", language: "US", gender: "Female" },
    { id: "47c38ca4-5f35-497b-b1a3-415245fb35e1", name: "Daniel – Modern Assistant", language: "US", gender: "Male" },
    { id: "9626c31c-bec5-4cca-baa8-f8ba9e84c8bc", name: "Jacqueline – Reassuring Agent", language: "US", gender: "Female" },
    { id: "62ae83ad-4f6a-430b-af41-a9bede9286ca", name: "Gemma", language: "British", gender: "Female" },
    { id: "ef191366-f52f-447a-a398-ed8c0f2943a1", name: "Archie", language: "British", gender: "Male" },
  ],
  azure: [
    { id: "en-US-JennyNeural", name: "Jenny (US)", language: "English", gender: "Female" },
    { id: "en-US-GuyNeural", name: "Guy (US)", language: "English", gender: "Male" },
    { id: "hi-IN-SwaraNeural", name: "Swara (Hindi)", language: "Hindi", gender: "Female" },
    { id: "te-IN-ShrutiNeural", name: "Shruti (Telugu)", language: "Telugu", gender: "Female" },
  ],
  // Sarvam bulbul:v3 speakers — the full library. Multilingual: the language
  // comes from the call, not the voice.
  sarvam: [
    { id: "priya", name: "Priya", gender: "Female" },
    { id: "neha", name: "Neha", gender: "Female" },
    { id: "pooja", name: "Pooja", gender: "Female" },
    { id: "kavya", name: "Kavya", gender: "Female" },
    { id: "shreya", name: "Shreya", gender: "Female" },
    { id: "ritu", name: "Ritu", gender: "Female" },
    { id: "tanya", name: "Tanya", gender: "Female" },
    { id: "suhani", name: "Suhani", gender: "Female" },
    { id: "simran", name: "Simran", gender: "Female" },
    { id: "ishita", name: "Ishita", gender: "Female" },
    { id: "shruti", name: "Shruti", gender: "Female" },
    { id: "kavitha", name: "Kavitha", gender: "Female" },
    { id: "roopa", name: "Roopa", gender: "Female" },
    { id: "rupali", name: "Rupali", gender: "Female" },
    { id: "shubh", name: "Shubh", gender: "Male" },
    { id: "rahul", name: "Rahul", gender: "Male" },
    { id: "kabir", name: "Kabir", gender: "Male" },
    { id: "aditya", name: "Aditya", gender: "Male" },
    { id: "anand", name: "Anand", gender: "Male" },
    { id: "vijay", name: "Vijay", gender: "Male" },
    { id: "gokul", name: "Gokul", gender: "Male" },
    { id: "rohan", name: "Rohan", gender: "Male" },
    { id: "amit", name: "Amit", gender: "Male" },
    { id: "dev", name: "Dev", gender: "Male" },
    { id: "varun", name: "Varun", gender: "Male" },
    { id: "manan", name: "Manan", gender: "Male" },
    { id: "sumit", name: "Sumit", gender: "Male" },
    { id: "ashutosh", name: "Ashutosh", gender: "Male" },
    { id: "ratan", name: "Ratan", gender: "Male" },
    { id: "aayan", name: "Aayan", gender: "Male" },
    { id: "advait", name: "Advait", gender: "Male" },
    { id: "tarun", name: "Tarun", gender: "Male" },
    { id: "sunny", name: "Sunny", gender: "Male" },
    { id: "mani", name: "Mani", gender: "Male" },
    { id: "mohit", name: "Mohit", gender: "Male" },
    { id: "rehan", name: "Rehan", gender: "Male" },
    { id: "soham", name: "Soham", gender: "Male" },
  ],
  smallestai: [
    { id: "telugu-female-1", name: "Telugu · Female", language: "Telugu", gender: "Female" },
    { id: "hindi-female-1", name: "Hindi · Female", language: "Hindi", gender: "Female" },
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

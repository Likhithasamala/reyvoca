/**
 * Server-side provider integrations: API-key validation, chat completion for
 * agent testing / web calls, text-to-speech synthesis and live voice libraries.
 *
 * Every function talks to the provider with the workspace's own stored key.
 * Raw keys never reach the browser.
 */
import crypto from "node:crypto";
import { VOICE_CATALOG } from "@/lib/agents/templates";
import { read } from "./db";
import { PLATFORM_WORKSPACE_ID } from "./scope";

const TIMEOUT_MS = 20000;

async function http(url: string, opts: RequestInit = {}): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

/* ── Key lookup ─────────────────────────────────────────────────── */

/**
 * The key to call a provider with: the workspace's own if it has one, else the
 * platform key the Reyvoca operator saved under `/admin/providers`.
 */
export async function providerKey(
  workspaceId: string,
  providerType: "llm" | "stt" | "tts",
  providerName: string,
) {
  const rows = await read((db) =>
    db.providerConfigs.filter(
      (row) =>
        (row.workspaceId === workspaceId || row.workspaceId === PLATFORM_WORKSPACE_ID) &&
        row.providerType === providerType &&
        row.providerName === providerName &&
        row.apiKey,
    ),
  );
  // A key the workspace owns wins over the platform one (an enterprise may
  // bring its own), then a validated key over an unverified one.
  const hit = rows.sort(
    (a, b) =>
      (a.workspaceId === workspaceId ? -1 : 1) - (b.workspaceId === workspaceId ? -1 : 1) ||
      (b.isValidated ? 1 : 0) - (a.isValidated ? 1 : 0),
  )[0];
  return hit ? { apiKey: hit.apiKey, settings: hit.settings ?? {} } : null;
}

/* ── Validation ─────────────────────────────────────────────────── */

export type ValidationResult = {
  valid: boolean;
  message: string;
  reason?: "auth" | "net" | "input" | "unsupported";
};

const ok = (message = "Key verified."): ValidationResult => ({ valid: true, message });
const bad = (message = "This API key is invalid."): ValidationResult => ({
  valid: false,
  reason: "auth",
  message,
});
const net = (
  message = "Couldn't verify the key — the provider could not be reached. Try again.",
): ValidationResult => ({ valid: false, reason: "net", message });
const needs = (message: string): ValidationResult => ({ valid: false, reason: "input", message });

// Treat 401/403 as a rejected key; 200 as valid. `authOnlyOk` adds statuses
// (e.g. 400/422) that still prove the key authenticated on a probe request.
function classify(status: number, { authOnlyOk = [] as number[] } = {}): ValidationResult {
  if (status === 401 || status === 403) return bad();
  if (status === 429) return ok("Key accepted (rate-limited, but authenticated).");
  if (status >= 200 && status < 300) return ok();
  if (authOnlyOk.includes(status)) return ok();
  if (status >= 500) return net("The provider returned a server error. Try again shortly.");
  return bad("This API key was not accepted by the provider.");
}

async function bearerModels(url: string, key: string) {
  const r = await http(url, { headers: { Authorization: "Bearer " + key } });
  return classify(r.status);
}

async function validateAnthropic(key: string) {
  const r = await http("https://api.anthropic.com/v1/models", {
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01" },
  });
  return classify(r.status);
}

// Gemini developer API. Bad key -> 400 (API_KEY_INVALID) or 403.
async function validateGoogleGemini(key: string) {
  const r = await http(
    "https://generativelanguage.googleapis.com/v1beta/models?key=" + encodeURIComponent(key),
  );
  if (r.status === 400 || r.status === 401 || r.status === 403) return bad();
  return classify(r.status);
}

async function validateDeepgram(key: string) {
  const r = await http("https://api.deepgram.com/v1/projects", {
    headers: { Authorization: "Token " + key },
  });
  return classify(r.status);
}

async function validateElevenLabs(key: string) {
  const r = await http("https://api.elevenlabs.io/v1/user", { headers: { "xi-api-key": key } });
  return classify(r.status);
}

async function validateSpeechmatics(key: string) {
  const r = await http("https://asr.api.speechmatics.com/v2/jobs/?limit=1", {
    headers: { Authorization: "Bearer " + key },
  });
  return classify(r.status);
}

async function validateSarvam(key: string) {
  // A bad key -> 403; a good key returns 200 (or 400/422 on the probe body).
  const r = await http("https://api.sarvam.ai/text-lid", {
    method: "POST",
    headers: { "api-subscription-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ input: "." }),
  });
  return classify(r.status, { authOnlyOk: [400, 422] });
}

// Auth-only probe: a deliberately-incomplete POST. A bad key is rejected with
// 401/403 before any work; a good key gets 400/422 (missing body) etc.
async function validateMunsit(key: string) {
  const r = await http("https://api.munsit.com/api/v1/audio/transcribe", {
    method: "POST",
    headers: { "x-api-key": key },
    body: new URLSearchParams({ model: "munsit" }),
  });
  return classify(r.status, { authOnlyOk: [400, 404, 405, 415, 422] });
}

async function validateSmallest(key: string) {
  const r = await http("https://api.smallest.ai/waves/v1/tts", {
    method: "POST",
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: "{}",
  });
  return classify(r.status, { authOnlyOk: [400, 404, 405, 422] });
}

// Azure Speech/Neural: key + region -> issue a short-lived token.
async function validateAzure(key: string, extra: Record<string, string> = {}) {
  const region = String(extra.region ?? "").trim().toLowerCase().replace(/\s+/g, "");
  if (!region) return needs("Enter your Azure region (for example eastus) along with the key.");
  if (!/^[a-z0-9-]+$/.test(region)) return needs("That Azure region looks malformed (example: eastus).");
  let r: Response;
  try {
    r = await http("https://" + region + ".api.cognitive.microsoft.com/sts/v1.0/issueToken", {
      method: "POST",
      headers: { "Ocp-Apim-Subscription-Key": key, "Content-Length": "0" },
    });
  } catch {
    return net("Couldn't reach that Azure region — check the region name and try again.");
  }
  if (r.status === 404) return needs("That Azure region was not found. Double-check the region (example: westeurope).");
  return classify(r.status);
}

async function validateCartesia(key: string) {
  const r = await http("https://api.cartesia.ai/voices", {
    headers: { "X-API-Key": key, "Cartesia-Version": "2024-06-10" },
  });
  return classify(r.status);
}

// Google Cloud STT: validate a service-account JSON by minting an OAuth2 token.
function b64url(buf: Buffer | string) {
  return Buffer.from(buf).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
async function validateGoogleServiceAccount(raw: string): Promise<ValidationResult> {
  let sa: { client_email?: string; private_key?: string; token_uri?: string };
  try {
    sa = JSON.parse(raw);
  } catch {
    return needs("Paste the full service-account JSON (it did not parse as JSON).");
  }
  const { client_email, private_key, token_uri } = sa ?? {};
  if (!client_email || !private_key) {
    return needs("That JSON is missing client_email / private_key — paste the full service-account key file.");
  }
  const aud = token_uri || "https://oauth2.googleapis.com/token";
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud,
      iat: now,
      exp: now + 3600,
    }),
  );
  const signingInput = header + "." + claims;
  let jwt: string;
  try {
    const sig = crypto.sign("RSA-SHA256", Buffer.from(signingInput), private_key);
    jwt = signingInput + "." + b64url(sig);
  } catch {
    return needs("The private_key in that JSON is malformed — re-copy the service-account file.");
  }
  let r: Response;
  try {
    r = await http(aud, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });
  } catch {
    return net();
  }
  if (r.status >= 200 && r.status < 300) return ok("Service account verified.");
  if (r.status === 400 || r.status === 401 || r.status === 403) {
    return bad("The service-account credentials were rejected by Google.");
  }
  if (r.status >= 500) return net("Google returned a server error. Try again shortly.");
  return bad("The service-account credentials were not accepted.");
}

type Validator = (key: string, extra?: Record<string, string>) => Promise<ValidationResult>;
const VALIDATORS: Record<string, Record<string, Validator>> = {
  llm: {
    openai: (key) => bearerModels("https://api.openai.com/v1/models", key),
    anthropic: validateAnthropic,
    google: validateGoogleGemini,
    groq: (key) => bearerModels("https://api.groq.com/openai/v1/models", key),
    sarvam: validateSarvam,
  },
  stt: {
    deepgram: validateDeepgram,
    google: (key) => validateGoogleServiceAccount(key),
    azure: validateAzure,
    elevenlabs: validateElevenLabs,
    munsit: validateMunsit,
    speechmatics: validateSpeechmatics,
    cartesia: validateCartesia,
    sarvam: validateSarvam,
  },
  tts: {
    elevenlabs: validateElevenLabs,
    azure: validateAzure,
    cartesia: validateCartesia,
    smallestai: validateSmallest,
    sarvam: validateSarvam,
  },
};

export async function validateProviderKey({
  providerType,
  providerName,
  apiKey,
  extra = {},
}: {
  providerType: string;
  providerName: string;
  apiKey: string;
  extra?: Record<string, string>;
}): Promise<ValidationResult> {
  const key = String(apiKey ?? "").trim();
  if (!key) return needs("Enter an API key.");
  const validator = VALIDATORS[providerType]?.[providerName];
  if (!validator) {
    return { valid: true, message: "Saved (no automatic check available for this provider).", reason: "unsupported" };
  }
  try {
    return await validator(key, extra);
  } catch (error) {
    if ((error as Error)?.name === "AbortError") return net("Verification timed out. Try again.");
    return net();
  }
}

/* ── Chat (test agent / web call) ───────────────────────────────── */

export type ChatMessage = { role: "user" | "assistant"; content: string };

// Map the display names used in the UI to each provider's real API model ids.
const MODEL_IDS: Record<string, Record<string, string>> = {
  openai: { "GPT-4o": "gpt-4o", "GPT-4o mini": "gpt-4o-mini", o1: "o1" },
  groq: { "Llama 3.1 8B": "llama-3.1-8b-instant" },
  anthropic: { "Claude Sonnet 4.5": "claude-sonnet-4-5", "Claude Haiku 4.5": "claude-haiku-4-5" },
  google: { "Gemini 1.5 Pro": "gemini-1.5-pro", "Gemini 1.5 Flash": "gemini-1.5-flash" },
  sarvam: { "Sarvam 105B": "sarvam-105b-conversations", "Sarvam 105B (base)": "sarvam-105b" },
};
const DEFAULT_MODEL: Record<string, string> = {
  openai: "gpt-4o-mini",
  groq: "llama-3.1-8b-instant",
  anthropic: "claude-haiku-4-5",
  google: "gemini-1.5-flash",
  sarvam: "sarvam-105b-conversations",
};
// Voice turns should be short — a long reply costs generation, synthesis and
// playback time, which is most of the perceived latency.
const MAX_TOKENS = 220;

type ProviderErrorBody = { error?: { message?: string }; message?: string };

async function openaiChat(
  url: string,
  key: string,
  model: string,
  system: string,
  messages: ChatMessage[],
  authHeader: Record<string, string> = { Authorization: "Bearer " + key },
) {
  const isReasoning = /^o\d/.test(model); // o1 etc: no system role / temperature
  const msgs = isReasoning
    ? [{ role: "user", content: system + "\n\n" + (messages[0]?.content ?? "") }, ...messages.slice(1)]
    : [{ role: "system", content: system }, ...messages];
  const body: Record<string, unknown> = { model, messages: msgs };
  if (!isReasoning) {
    body.temperature = 0.6;
    body.max_tokens = MAX_TOKENS;
  }
  const r = await http(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader },
    body: JSON.stringify(body),
  });
  const d = (await r.json().catch(() => ({}))) as ProviderErrorBody & {
    choices?: { message?: { content?: string } }[];
  };
  if (!r.ok) throw new Error(d?.error?.message || d?.message || "provider returned " + r.status);
  return (d.choices?.[0]?.message?.content ?? "").trim();
}

async function anthropicChat(key: string, model: string, system: string, messages: ChatMessage[]) {
  const r = await http("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model, max_tokens: MAX_TOKENS, system, messages }),
  });
  const d = (await r.json().catch(() => ({}))) as ProviderErrorBody & { content?: { text?: string }[] };
  if (!r.ok) throw new Error(d?.error?.message || "provider returned " + r.status);
  return (d.content ?? []).map((block) => block.text ?? "").join("").trim();
}

async function geminiChat(key: string, model: string, system: string, messages: ChatMessage[]) {
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const r = await http(
    "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + encodeURIComponent(key),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { temperature: 0.6, maxOutputTokens: MAX_TOKENS },
      }),
    },
  );
  const d = (await r.json().catch(() => ({}))) as ProviderErrorBody & {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  if (!r.ok) throw new Error(d?.error?.message || "provider returned " + r.status);
  return (d.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim();
}

export async function runAgentReply({
  provider,
  model,
  apiKey,
  system,
  messages,
}: {
  provider: string;
  model: string;
  apiKey: string;
  system: string;
  messages: ChatMessage[];
}): Promise<string> {
  const p = String(provider ?? "").toLowerCase();
  const id = MODEL_IDS[p]?.[model] ?? DEFAULT_MODEL[p];
  if (!id) throw new Error("testing is not supported for this provider yet");
  if (p === "openai") return openaiChat("https://api.openai.com/v1/chat/completions", apiKey, id, system, messages);
  if (p === "groq") return openaiChat("https://api.groq.com/openai/v1/chat/completions", apiKey, id, system, messages);
  if (p === "sarvam") {
    return openaiChat("https://api.sarvam.ai/v1/chat/completions", apiKey, id, system, messages, {
      "api-subscription-key": apiKey,
    });
  }
  if (p === "anthropic") return anthropicChat(apiKey, id, system, messages);
  if (p === "google") return geminiChat(apiKey, id, system, messages);
  throw new Error("testing is not supported for " + p + " yet");
}

/* ── Text-to-speech ─────────────────────────────────────────────── */

const b64 = async (r: Response) => Buffer.from(await r.arrayBuffer()).toString("base64");

const LOCALE: Record<string, string> = {
  English: "en-US", Hindi: "hi-IN", Telugu: "te-IN", Tamil: "ta-IN", Kannada: "kn-IN",
  Marathi: "mr-IN", Bengali: "bn-IN", Gujarati: "gu-IN", Spanish: "es-ES", Arabic: "ar-SA",
  French: "fr-FR", German: "de-DE",
};
// Language name -> ISO code for Cartesia Sonic.
const TWO: Record<string, string> = {
  English: "en", Hindi: "hi", Telugu: "te", Tamil: "ta", Kannada: "kn", Marathi: "mr",
  Bengali: "bn", Gujarati: "gu", Malayalam: "ml", Punjabi: "pa", Odia: "or", Urdu: "ur",
  Spanish: "es", French: "fr", German: "de", Portuguese: "pt", Italian: "it", Dutch: "nl",
  Polish: "pl", Russian: "ru", Swedish: "sv", Turkish: "tr", Chinese: "zh", Japanese: "ja",
  Korean: "ko", Arabic: "ar", Hebrew: "he", Tagalog: "tl", Bulgarian: "bg", Romanian: "ro",
  Czech: "cs", Greek: "el", Finnish: "fi", Croatian: "hr", Malay: "ms", Slovak: "sk",
  Danish: "da", Ukrainian: "uk", Hungarian: "hu", Norwegian: "no", Vietnamese: "vi",
  Thai: "th", Georgian: "ka", Indonesian: "id",
};
const SARVAM_LANG: Record<string, string> = {
  English: "en-IN", Hindi: "hi-IN", Telugu: "te-IN", Tamil: "ta-IN", Kannada: "kn-IN",
  Marathi: "mr-IN", Bengali: "bn-IN", Gujarati: "gu-IN", Malayalam: "ml-IN",
  Punjabi: "pa-IN", Odia: "od-IN",
};

const esc = (s: string) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

async function elevenlabsTts(key: string, voiceId: string, text: string) {
  const r = await http(
    "https://api.elevenlabs.io/v1/text-to-speech/" + encodeURIComponent(voiceId) + "?output_format=mp3_44100_128",
    {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text, model_id: "eleven_multilingual_v2" }),
    },
  );
  if (!r.ok) throw new Error("ElevenLabs returned " + r.status);
  return { audio: await b64(r), mime: "audio/mpeg" };
}

async function cartesiaTts(key: string, voiceId: string, text: string, lang: string) {
  const r = await http("https://api.cartesia.ai/tts/bytes", {
    method: "POST",
    headers: { "X-API-Key": key, "Cartesia-Version": "2024-11-13", "Content-Type": "application/json" },
    body: JSON.stringify({
      model_id: "sonic-3.6",
      transcript: text,
      voice: { mode: "id", id: voiceId },
      language: TWO[lang] ?? "en",
      output_format: { container: "mp3", sample_rate: 44100, bit_rate: 128000 },
    }),
  });
  if (!r.ok) throw new Error("Cartesia returned " + r.status);
  return { audio: await b64(r), mime: "audio/mpeg" };
}

async function azureTts(key: string, region: string, voiceId: string, text: string, lang: string) {
  if (!region) throw new Error("Azure region is not saved for this voice. Re-add the Azure key with its region.");
  const locale = (voiceId && voiceId.split("-").slice(0, 2).join("-")) || LOCALE[lang] || "en-US";
  const ssml = `<speak version='1.0' xml:lang='${locale}'><voice name='${esc(voiceId)}'>${esc(text)}</voice></speak>`;
  const r = await http("https://" + region + ".tts.speech.microsoft.com/cognitiveservices/v1", {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      "User-Agent": "reyvoca",
    },
    body: ssml,
  });
  if (!r.ok) throw new Error("Azure returned " + r.status);
  return { audio: await b64(r), mime: "audio/mpeg" };
}

// bulbul:v3 speakers (the full Sarvam library). Older v1/v2 names are invalid
// for v3 and make the API reject the request — remap any legacy id to a v3
// speaker of the same gender.
const SARVAM_V3 = VOICE_CATALOG.sarvam.map((v) => v.id);
const SARVAM_LEGACY: Record<string, string> = {
  // bulbul:v2
  anushka: "priya", manisha: "neha", vidya: "kavya", arya: "tanya",
  abhilash: "rahul", karun: "kabir", hitesh: "anand",
  // bulbul:v1
  meera: "priya", pavithra: "neha", maitreyi: "kavya", diya: "tanya", misha: "tanya", maya: "kavya",
  arvind: "rahul", amol: "kabir", amartya: "anand", neel: "kabir", vian: "anand", arjun: "rahul",
};
function sarvamSpeaker(voiceId: string) {
  const v = String(voiceId ?? "").toLowerCase().trim();
  if (SARVAM_V3.includes(v)) return v;
  return SARVAM_LEGACY[v] ?? "priya";
}

async function sarvamTts(key: string, voiceId: string, text: string, lang: string) {
  const r = await http("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: { "api-subscription-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      target_language_code: SARVAM_LANG[lang] ?? "en-IN",
      speaker: sarvamSpeaker(voiceId),
      model: "bulbul:v3",
    }),
  });
  const d = (await r.json().catch(() => ({}))) as ProviderErrorBody & { audios?: string[]; audio?: string };
  if (!r.ok) throw new Error(d?.error?.message || d?.message || "Sarvam returned " + r.status);
  const audio = Array.isArray(d.audios) ? d.audios[0] : d.audio;
  if (!audio) throw new Error("Sarvam returned no audio");
  return { audio, mime: "audio/wav" };
}

export async function synthesize({
  provider,
  voiceId,
  text,
  language,
  settings = {},
  apiKey,
}: {
  provider: string;
  voiceId: string;
  text: string;
  language: string;
  settings?: Record<string, string>;
  apiKey: string;
}): Promise<{ audio: string; mime: string }> {
  const p = String(provider ?? "").toLowerCase();
  const t = String(text ?? "").slice(0, 2000);
  if (!t) throw new Error("nothing to speak");
  if (p === "elevenlabs") return elevenlabsTts(apiKey, voiceId, t);
  if (p === "cartesia") return cartesiaTts(apiKey, voiceId, t, language);
  if (p === "azure") return azureTts(apiKey, String(settings.region ?? "").trim().toLowerCase(), voiceId, t, language);
  if (p === "sarvam") return sarvamTts(apiKey, voiceId, t, language);
  throw new Error("web-call voice is not supported for " + p + " yet");
}

/* ── Live voice libraries ───────────────────────────────────────── */

export type ProviderVoice = { id: string; name: string; language?: string; accent?: string; locale?: string; gender?: string };

const LANG_NAMES: Record<string, string> = {
  en: "English", hi: "Hindi", es: "Spanish", fr: "French", de: "German", pt: "Portuguese",
  it: "Italian", nl: "Dutch", pl: "Polish", ru: "Russian", sv: "Swedish", tr: "Turkish",
  zh: "Chinese", ja: "Japanese", ko: "Korean", te: "Telugu", ta: "Tamil", kn: "Kannada",
  mr: "Marathi", bn: "Bengali", gu: "Gujarati", ar: "Arabic",
};
function prettyLang(code: string) {
  if (!code) return "";
  const base = String(code).toLowerCase().split("-")[0];
  return LANG_NAMES[base] ?? code;
}

const ACCENT_LABELS: Record<string, string> = {
  "indian-english": "Indian", "general-american": "US", "southern-american": "US · Southern",
  "midwest-american": "US · Midwest", british: "British", australian: "Australian",
  telangana: "Telugu · Telangana", hindi: "Hindi", irish: "Irish", "new-zealand": "New Zealand",
  "south-african": "South African", canadian: "Canadian", scottish: "Scottish",
};
const titleCase = (s: string) =>
  String(s ?? "").split(/[-_ ]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
function accentLabel(accent: string, locale: string) {
  if (accent && ACCENT_LABELS[accent]) return ACCENT_LABELS[accent];
  if (accent) return titleCase(accent);
  return prettyLang(locale) || "";
}

type CartesiaAccent = { accent?: string; locale?: string; is_native?: boolean };
type CartesiaVoice = {
  id?: string;
  name?: string;
  tagline?: string;
  language?: string;
  gender?: string;
  accents?: CartesiaAccent[];
};
function mapCartesiaVoice(v: CartesiaVoice): ProviderVoice {
  const primary =
    Array.isArray(v.accents) && v.accents.length
      ? v.accents.find((a) => a?.is_native) ?? v.accents[0]
      : null;
  const accent = primary?.accent ?? "";
  const locale = primary?.locale ?? "";
  const label = accentLabel(accent, locale || v.language || "");
  const tagline = (v.tagline ?? "").trim();
  const name = (v.name || v.id || "") + (tagline ? " – " + tagline : "");
  const gender = v.gender ? titleCase(v.gender) : "";
  return { id: v.id ?? "", name, language: label, accent, locale: locale || v.language || "", gender };
}

// Surface Indian + General American English first, then other English, while
// still returning every voice. Within a group, keep Cartesia's own order.
const ACCENT_RANK: Record<string, number> = {
  "indian-english": 0, telangana: 0, hindi: 0, "general-american": 1,
  "southern-american": 2, "midwest-american": 2, british: 3, australian: 3,
};
function sortCartesiaVoices(list: ProviderVoice[]) {
  const rankOf = (v: ProviderVoice) => {
    if (v.accent && v.accent in ACCENT_RANK) return ACCENT_RANK[v.accent];
    if ((v.locale ?? "").startsWith("en-IN") || (v.locale ?? "").startsWith("te")) return 0;
    if ((v.locale ?? "").startsWith("en-US")) return 1;
    if ((v.locale ?? "").startsWith("en")) return 3;
    return 5; // non-English voices last
  };
  return list
    .map((v, i) => ({ v, i, r: rankOf(v) }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map((x) => x.v);
}

export async function listVoices(provider: string, apiKey: string): Promise<ProviderVoice[]> {
  if (provider === "sarvam") {
    // Sarvam has no list endpoint — its speaker set is fixed per model, so the
    // bundled bulbul:v3 catalogue IS the full live library.
    return VOICE_CATALOG.sarvam.map((v) => ({ id: v.id, name: v.name, language: v.language, gender: v.gender }));
  }
  if (provider === "elevenlabs") {
    const r = await http("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": apiKey } });
    if (!r.ok) return [];
    const d = (await r.json()) as {
      voices?: { voice_id: string; name: string; labels?: { language?: string; accent?: string; gender?: string } }[];
    };
    return (d.voices ?? []).map((v) => ({
      id: v.voice_id,
      name: v.name,
      language: v.labels?.language || v.labels?.accent || "",
      gender: v.labels?.gender ? titleCase(v.labels.gender) : "",
    }));
  }
  if (provider === "cartesia") {
    // Cartesia paginates /voices (max 100 per page) — walk every page so the
    // whole live library is listed. A newer Cartesia-Version carries taglines
    // and accents; fall back to the long-stable version if it is rejected.
    for (const version of ["2025-11-04", "2024-11-13"]) {
      const out: ProviderVoice[] = [];
      let cursor = "";
      let okRun = true;
      for (let page = 0; page < 40; page++) {
        const url =
          "https://api.cartesia.ai/voices?limit=100" +
          (cursor ? "&starting_after=" + encodeURIComponent(cursor) : "");
        const r = await http(url, { headers: { "X-API-Key": apiKey, "Cartesia-Version": version } });
        if (!r.ok) {
          okRun = false;
          break;
        }
        const d = (await r.json()) as CartesiaVoice[] | { data?: CartesiaVoice[]; has_more?: boolean; next_page?: string };
        const arr = Array.isArray(d) ? d : d.data ?? [];
        for (const v of arr) if (v?.id) out.push(mapCartesiaVoice(v));
        if (Array.isArray(d) || !d.has_more) break;
        cursor = d.next_page || (arr.length ? arr[arr.length - 1].id ?? "" : "");
        if (!cursor) break;
      }
      if (okRun) return sortCartesiaVoices(out);
    }
    return [];
  }
  // Other providers: no public list endpoint wired — client uses its catalog.
  return [];
}

export function maskKey(raw: string): string {
  const s = (raw ?? "").trim();
  if (s.length <= 8) return s.replace(/./g, "•");
  return s.slice(0, 3) + "…" + s.slice(-4);
}

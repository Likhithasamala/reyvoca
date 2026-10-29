/**
 * Provider catalogue for the Providers page: which providers exist per
 * category, how to label them and what their key input needs.
 *
 * Client-safe metadata only — keys live on the server.
 */
import { BrainCircuit, Mic, Volume2, type LucideIcon } from "lucide-react";

export type ProviderType = "llm" | "stt" | "tts";

export type ProviderMeta = {
  id: string;
  name: string;
  tag: string;
  /** Brand colour for the monogram tile. */
  color: string;
  placeholder: string;
  extraFields?: { name: string; label: string; placeholder: string; required?: boolean }[];
  help?: { label: string; href: string };
};

export type ProviderCategory = {
  key: ProviderType;
  label: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  providers: ProviderMeta[];
};

export const PROVIDER_CATEGORIES: ProviderCategory[] = [
  {
    key: "llm",
    label: "Language Model",
    icon: BrainCircuit,
    title: "Language Models",
    desc: "Connect your LLM providers to power agent conversations. Model and prompt settings are configured per agent.",
    providers: [
      { id: "openai", name: "OpenAI", tag: "GPT-4o, o1, and more", color: "#10A37F", placeholder: "sk-...", help: { label: "Get a key at platform.openai.com", href: "https://platform.openai.com/api-keys" } },
      { id: "anthropic", name: "Anthropic", tag: "Claude models for enterprise", color: "#CC7B46", placeholder: "sk-ant-...", help: { label: "Get a key at console.anthropic.com", href: "https://console.anthropic.com/settings/keys" } },
      { id: "google", name: "Google", tag: "Gemini models", color: "#4285F4", placeholder: "Enter key" },
      { id: "groq", name: "Groq", tag: "Ultra-fast open model inference", color: "#F55036", placeholder: "gsk_...", help: { label: "Get a key at console.groq.com", href: "https://console.groq.com/keys" } },
      { id: "sarvam", name: "Sarvam AI", tag: "Sarvam-M · India-first LLM", color: "#7C3AED", placeholder: "Enter key", help: { label: "Get a key at dashboard.sarvam.ai", href: "https://dashboard.sarvam.ai/" } },
    ],
  },
  {
    key: "stt",
    label: "Speech-to-Text",
    icon: Mic,
    title: "Speech-to-Text",
    desc: "Configure speech recognition providers for real-time agent conversations.",
    providers: [
      { id: "deepgram", name: "Deepgram", tag: "Industry-leading speech recognition", color: "#0EAD69", placeholder: "Enter key", help: { label: "Get a key at console.deepgram.com", href: "https://console.deepgram.com/" } },
      { id: "google", name: "Google Cloud", tag: "Cloud Speech-to-Text API", color: "#4285F4", placeholder: "Service account JSON" },
      { id: "azure", name: "Azure Speech", tag: "Microsoft cognitive services", color: "#0078D4", placeholder: "Enter key", extraFields: [{ name: "region", label: "Azure region", placeholder: "eastus", required: true }], help: { label: "Get a key in the Azure Speech portal", href: "https://portal.azure.com/" } },
      { id: "elevenlabs", name: "ElevenLabs", tag: "Scribe · Strong Arabic support", color: "#F97316", placeholder: "xi_...", help: { label: "Get a key at elevenlabs.io", href: "https://elevenlabs.io/app/settings/api-keys" } },
      { id: "munsit", name: "Munsit", tag: "25 Arabic dialects · Gulf-optimized", color: "#059669", placeholder: "Enter key", help: { label: "Request access at munsit.ai", href: "https://munsit.ai/" } },
      { id: "speechmatics", name: "Speechmatics", tag: "Low-latency real-time · Arabic support", color: "#0E7C86", placeholder: "Enter key", help: { label: "Create a key in the Speechmatics Portal", href: "https://portal.speechmatics.com/" } },
      { id: "cartesia", name: "Cartesia", tag: "Ink-Whisper · Low-latency STT", color: "#7C3AED", placeholder: "Enter key", help: { label: "Get a key at play.cartesia.ai", href: "https://play.cartesia.ai/" } },
      { id: "sarvam", name: "Sarvam AI", tag: "22 Indic languages · Saaras STT", color: "#7C3AED", placeholder: "Enter key", help: { label: "Get a key at dashboard.sarvam.ai", href: "https://dashboard.sarvam.ai/" } },
    ],
  },
  {
    key: "tts",
    label: "Text-to-Speech",
    icon: Volume2,
    title: "Text-to-Speech",
    desc: "Configure voice synthesis providers for agent conversations.",
    providers: [
      { id: "elevenlabs", name: "ElevenLabs", tag: "Premium voice synthesis", color: "#10B981", placeholder: "xi_...", help: { label: "Get a key at elevenlabs.io", href: "https://elevenlabs.io/app/settings/api-keys" } },
      { id: "azure", name: "Azure Neural", tag: "Microsoft neural TTS", color: "#0078D4", placeholder: "Enter key", extraFields: [{ name: "region", label: "Azure region", placeholder: "eastus", required: true }], help: { label: "Get a key in the Azure Speech portal", href: "https://portal.azure.com/" } },
      { id: "cartesia", name: "Cartesia", tag: "Low-latency voice generation", color: "#7C3AED", placeholder: "Enter key", help: { label: "Get a key at play.cartesia.ai", href: "https://play.cartesia.ai/" } },
      { id: "smallestai", name: "Smallest.ai", tag: "Ultra-cheap Indic & Telugu voices", color: "#FF6B35", placeholder: "Enter key", help: { label: "Get a key at waves.smallest.ai", href: "https://waves.smallest.ai/apikeys" } },
      { id: "sarvam", name: "Sarvam AI", tag: "Bulbul · 30+ Indic voices", color: "#DB2777", placeholder: "Enter key", help: { label: "Get a key at dashboard.sarvam.ai", href: "https://dashboard.sarvam.ai/" } },
    ],
  },
];

export const providerCategory = (key: string) =>
  PROVIDER_CATEGORIES.find((category) => category.key === key) ?? PROVIDER_CATEGORIES[0];

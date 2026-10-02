/**
 * Documentation content. Each entry renders at /docs/<slug>; the entry with
 * an empty slug is the docs home (/docs). Add pages by appending entries —
 * the sidebar, routes and sitemap are generated from this list.
 */
import type { DocPage } from "@/types";

export const docPages: DocPage[] = [
  {
    slug: "",
    title: "Welcome to Reyvoca",
    description: "Reyvoca is a platform for building AI voice agents that hold real business conversations.",
    blocks: [
      {
        type: "p",
        text: "Reyvoca lets you create AI voice agents that speak with customers over the phone, answer questions from your own knowledge, take actions in your tools and record a structured outcome for every call.",
      },
      {
        type: "callout",
        text: "Reyvoca is in early development. These docs describe the platform as it is being built and will expand as each capability ships.",
      },
      { type: "h2", text: "Core concepts" },
      {
        type: "list",
        items: [
          "Agents — a role, instructions, voice and goal for a type of conversation.",
          "Knowledge base — documents and FAQs an agent uses to ground its answers.",
          "Phone numbers — inbound lines and caller IDs connected through a telephony provider.",
          "Calls — each conversation, with its transcript, recording and outcome.",
          "Campaigns — scheduled outbound calling against a list of leads.",
          "Webhooks — events Reyvoca sends to your systems when things happen.",
        ],
      },
      { type: "h2", text: "Where to start" },
      {
        type: "p",
        text: "Read the Quickstart for the end-to-end flow, then explore each concept from the sidebar.",
      },
    ],
  },
  {
    slug: "quickstart",
    title: "Quickstart",
    description: "The end-to-end flow from a new workspace to a live voice agent.",
    blocks: [
      { type: "p", text: "Once accounts open, getting your first agent live will follow four steps." },
      {
        type: "list",
        items: [
          "Create a workspace from the Get Started page.",
          "Create an agent and describe its role, instructions and objective.",
          "Add knowledge so the agent can answer questions about your business.",
          "Test the agent in the browser, then connect a phone number to go live.",
        ],
      },
      { type: "callout", text: "Workspace sign-up is not open yet. This guide will be updated with screenshots and examples at launch." },
    ],
  },
  {
    slug: "agents",
    title: "Agents",
    description: "Configure the role, behaviour and voice of an AI voice agent.",
    blocks: [
      {
        type: "p",
        text: "An agent combines instructions, a voice, a language and a set of allowed actions. Agents are being designed so each one can choose its own language model, speech-to-text and text-to-speech providers.",
      },
      { type: "h2", text: "Planned configuration" },
      {
        type: "list",
        items: ["Name, role and objective", "System instructions and guardrails", "Voice and language", "Provider selection", "Allowed tools and actions"],
      },
    ],
  },
  {
    slug: "knowledge-base",
    title: "Knowledge Base",
    description: "Ground agent answers in your own documents and FAQs.",
    blocks: [
      {
        type: "p",
        text: "The knowledge base will let you upload documents, FAQs and product information that agents reference during conversations, so answers stay accurate and specific to your business.",
      },
    ],
  },
  {
    slug: "phone-numbers",
    title: "Phone Numbers",
    description: "Connect numbers for inbound and outbound calling.",
    blocks: [
      {
        type: "p",
        text: "Phone numbers will be connected through supported telephony providers. Each number can route inbound calls to an agent or act as the caller ID for outbound campaigns.",
      },
    ],
  },
  {
    slug: "calls",
    title: "Calls",
    description: "Transcripts, recordings and outcomes for every conversation.",
    blocks: [
      {
        type: "p",
        text: "Every call will have a record containing its transcript, summary, duration, structured outcome and — where legally appropriate and enabled — a recording.",
      },
      { type: "h2", text: "Planned outcomes" },
      { type: "list", items: ["Interested", "Not interested", "Callback requested", "Appointment booked", "Qualified", "Unqualified"] },
    ],
  },
  {
    slug: "campaigns",
    title: "Campaigns",
    description: "Run scheduled outbound calling against a list of leads.",
    blocks: [
      {
        type: "p",
        text: "Campaigns will combine an agent, a lead list, a calling window and retry rules so outbound calling runs on schedule while respecting your compliance requirements.",
      },
    ],
  },
  {
    slug: "webhooks",
    title: "Webhooks",
    description: "Receive call events in your own systems.",
    blocks: [
      { type: "p", text: "Webhooks will notify your systems when calls start, end, or produce an outcome. A draft event shape:" },
      {
        type: "code",
        language: "json",
        code: `{
  "type": "call.completed",
  "call": {
    "id": "call_…",
    "agent_id": "agt_…",
    "duration_seconds": 182,
    "outcome": "appointment_booked"
  }
}`,
      },
      { type: "callout", text: "Draft only — event names and payloads may change before release." },
    ],
  },
  {
    slug: "api-reference",
    title: "API Reference",
    description: "Programmatic access to agents, calls and campaigns.",
    blocks: [
      {
        type: "p",
        text: "A REST API is planned for creating agents, starting calls and retrieving transcripts and outcomes. The reference will be published here when the API is available.",
      },
    ],
  },
];

export const getDocPage = (slug: string) => docPages.find((page) => page.slug === slug);

export const docHref = (slug: string) => (slug ? `/docs/${slug}` : "/docs");

/** Sidebar label for the docs home is "Introduction". */
export const docNavLabel = (page: DocPage) => (page.slug === "" ? "Introduction" : page.title);

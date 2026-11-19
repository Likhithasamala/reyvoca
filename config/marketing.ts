/**
 * All homepage copy lives here so messaging can change without touching
 * components. Copy describes Reyvoca as a platform in development — it
 * must not claim capabilities, customers or certifications that don't exist.
 *
 * The page is an argument, one claim per section:
 *   hero      — an AI agent can run a real business call end to end (the demo proves it)
 *   anatomy   — the call becomes data: transcript → intent → outcome → action
 *   inbound   — put an agent on the line and every call gets answered
 *   build     — you assemble this yourself: instructions, voice, knowledge, calling
 *   pricing   — real pricing stated honestly as unannounced
 *   faq       — real questions, honest answers
 *   cta       — one closing invitation
 */
import { routes } from "./site";

export const hero = {
  line1: "The phone rings.",
  line2: "Reyvoca answers.",
  subtitle:
    "Build AI voice agents that hold real business conversations — qualify the lead, book the visit, screen the candidate — and file every outcome in your workspace.",
  primaryCta: { label: "Book a demo", href: routes.bookDemo },
  secondaryCta: { label: "Read the docs", href: routes.docs },
  note: "Free while in development. Test every agent in the browser before it calls anyone.",
};

export const anatomy = {
  id: "what-a-call-becomes",
  eyebrow: "How it works",
  heading: "What a call becomes",
  steps: [
    {
      statement: "First, the agent speaks.",
      support:
        "Low-latency dialogue in the voice you chose, grounded in your knowledge. Callers can interrupt — it stops, listens and adapts.",
      stage: "transcript" as const,
    },
    {
      statement: "Then Reyvoca reads the intent.",
      support:
        "Budget, timeline, the preferred slot: pulled out of the words as structured fields while the call is still running, not buried in notes.",
      stage: "intent" as const,
    },
    {
      statement: "The outcome lands in your workspace.",
      support:
        "A transcript, a summary, an outcome and the next action, filed under the lead that called and ready for a person to pick up.",
      stage: "workspace" as const,
    },
  ],
};

export const inboundLine = {
  id: "inbound",
  heading: "Always on the line",
  sentence:
    "Attach an agent to your inbound number and every call gets answered: nights, weekends, the hour everyone phones at once.",
};

export const build = {
  id: "build",
  heading: "Assemble it yourself",
  cells: [
    {
      title: "Write the instructions",
      body: "Tell the agent its role, its goal and its boundaries in plain language. Templates cover intake, outreach, support and screening.",
      fragment: "instructions" as const,
    },
    {
      title: "Pick a voice",
      body: "Voices from ElevenLabs, Sarvam, Azure and more. Language and style are chosen per agent, so the clinic doesn't sound like the sales desk.",
      fragment: "voice" as const,
    },
    {
      title: "Ground it in your knowledge",
      body: "Upload FAQs, documents and product details so answers come from your business, not from guesswork.",
      fragment: "knowledge" as const,
    },
    {
      title: "Load a campaign",
      body: "Upload a CSV of leads. Reyvoca maps the columns, schedules the calls inside your calling window and retries politely.",
      fragment: "campaign" as const,
    },
    {
      title: "Route your inbound line",
      body: "Attach a number, write the greeting, and set the rules for when a person should take the call instead.",
      fragment: "line" as const,
    },
    {
      title: "Read the results",
      body: "Outcomes, connect rate and duration per agent: enough to see what to fix, without a reporting project.",
      fragment: "results" as const,
    },
  ],
};

export const pricing = {
  id: "pricing",
  note: "Final pricing will be announced ahead of public launch.",
  tiers: [
    {
      name: "Starter",
      figure: "Free",
      period: "while in development",
      description:
        "Build agents, test conversations in the browser, and keep core transcripts and outcomes. For trying the product honestly before it costs anything.",
      cta: { label: "Start with Starter", href: routes.bookDemo },
    },
    {
      name: "Growth",
      figure: "Soon",
      period: "pricing unannounced",
      description:
        "Phone numbers, outbound campaigns, knowledge bases, actions and team seats. The production tier; usage-based pricing lands ahead of public launch.",
      cta: { label: "Book a demo", href: routes.bookDemo },
    },
    {
      name: "Enterprise",
      figure: "Custom",
      period: "by conversation",
      description:
        "High-volume or regulated deployments: custom providers, security review, dedicated support. Priced per deployment, not per seat.",
      cta: { label: "Contact sales", href: routes.contact },
    },
  ],
};

export const faq = {
  id: "faq",
  heading: "Questions",
  items: [
    {
      question: "What is Reyvoca?",
      answer:
        "Reyvoca is an AI voice agent platform currently in development. It lets businesses create agents that hold natural phone conversations, answer questions, capture outcomes and take actions in the tools they already use.",
    },
    {
      question: "Does it handle inbound and outbound calls?",
      answer:
        "Yes — the platform is being built for both: agents answering inbound lines, and outbound campaigns that call a list of leads on a schedule with retry rules.",
    },
    {
      question: "Can agents speak multiple languages?",
      answer:
        "Multilingual conversations are part of the core architecture. Each voice covers its own set of languages, and the agent can switch between them mid-call.",
    },
    {
      question: "Which AI models does it run on?",
      answer:
        "Reyvoca runs a managed, multi-vendor engine and picks the best fit for each task, so you never configure or maintain an AI stack. Enterprise deployments can bring their own providers where policy requires it.",
    },
    {
      question: "Do I get transcripts of every call?",
      answer:
        "Transcripts are a core part of the product. Each call includes a full transcript, a summary and its structured outcome.",
    },
    {
      question: "Can I test an agent before it calls real people?",
      answer:
        "Yes. Testing an agent in the browser before it ever reaches a customer is a key part of the workflow.",
    },
    {
      question: "What does it cost?",
      answer:
        "Pricing is per minute of agent talk time, quoted on the demo call once we know your volume and which languages you need. We'd rather give you a real number for your use case than a table you have to decode.",
    },
  ],
};

export const finalCta = {
  line1: "Your next enquiry",
  line2: "could already be on a call.",
  cta: { label: "Book a demo", href: routes.bookDemo },
  secondary: { label: "How it works", href: routes.howItWorks },
  note: "We build the first agent with you on the call — your language, your questions. The rate is quoted against your real volume.",
};

/**
 * The five-step spine of the homepage.
 *
 * The site used to open on what the agent *is*. This says what the business
 * gets, in the order it happens, and leaves the technology to the sections
 * underneath it.
 */
export const howItWorks = {
  id: "how-it-works",
  heading: "How it works",
  steps: [
    {
      number: "01",
      title: "The enquiry lands",
      detail:
        "A form, a portal, a missed call, a row in a sheet. Wherever your leads already arrive, that is where we connect.",
    },
    {
      number: "02",
      title: "The agent calls in seconds",
      detail:
        "Not in an hour, not when someone works down the list. While the person is still looking at your page.",
    },
    {
      number: "03",
      title: "It holds a real conversation",
      detail:
        "It answers from what you told it, asks your qualifying questions, and lets the caller interrupt — in the language they answered in.",
    },
    {
      number: "04",
      title: "The outcome is captured",
      detail:
        "A transcript, a summary and a structured result. Booked, not interested, call back Tuesday, needs a human.",
    },
    {
      number: "05",
      title: "You get the ones worth your time",
      detail:
        "Your team opens the day with qualified conversations instead of a list of numbers to dial.",
    },
  ],
};

/** The agent section — what sits between the process and the proof. */
export const agentSection = {
  id: "agent",
  eyebrow: "The agent",
  heading: "It sounds like a person because it behaves like one.",
  points: [
    {
      title: "It waits for you to finish",
      detail:
        "A pause for thought is not the end of a sentence. The agent holds the turn open instead of talking over you.",
    },
    {
      title: "You can interrupt it",
      detail:
        "Start speaking and it stops mid-word, then answers what you actually said rather than finishing its own point.",
    },
    {
      title: "It changes language mid-call",
      detail:
        "Answer in Telugu and the rest of the call is in Telugu — the voice and the listening both move, not just the reply.",
    },
    {
      title: "It admits what it does not know",
      detail:
        "Anything outside what you gave it gets an honest answer and a handover, never an invented price or a made-up name.",
    },
  ],
};

/** The industries strip on the homepage. */
export const industriesSection = {
  id: "industries",
  eyebrow: "Industries",
  heading: "One agent. Trained on your business.",
  body: "The conversation changes completely between a clinic and a dealership. The platform does not — you write what the agent knows and how it should behave, and it holds that conversation.",
};

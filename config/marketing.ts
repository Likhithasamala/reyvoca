/**
 * All homepage copy lives here so messaging can change without touching
 * components. Copy describes Reyvoca as a platform in development — it
 * must not claim capabilities, customers or certifications that don't exist.
 */
import {
  AudioLines,
  BarChart3,
  BellRing,
  BookOpen,
  Bot,
  Briefcase,
  Building2,
  CalendarCheck,
  FileText,
  Hand,
  Headphones,
  Languages,
  Layers,
  ListChecks,
  Mic,
  PhoneCall,
  RefreshCw,
  Rocket,
  Stethoscope,
  Target,
  Workflow,
} from "lucide-react";
import type {
  FaqItem,
  Feature,
  FeatureStory,
  HeroContent,
  IntegrationGroup,
  PricingTier,
  Step,
  UseCase,
} from "@/types";
import { routes } from "./site";

/** Alternative headline concepts — swap into `hero.heading` as needed. */
export const taglines = [
  "AI Voice Agents That Actually Get Work Done",
  "AI Conversations That Move Business Forward",
  "Build Voice Agents That Speak, Listen and Take Action",
  "Turn Every Call Into an Intelligent Conversation",
  "AI Voice Agents Built for Real Conversations",
];

export const hero: HeroContent = {
  eyebrow: "AI voice agents built for action",
  heading: {
    before: "AI voice agents that",
    highlight: "talk, understand",
    after: "and take action",
  },
  subtitle:
    "Build voice agents that speak naturally with customers, answer questions, qualify leads, book appointments and follow up — with every conversation captured and summarised.",
  primaryCta: { label: "Start Free", href: routes.startFree },
  secondaryCta: { label: "See How It Works", href: "/#how-it-works" },
  valuePoints: ["Natural conversations", "Multilingual ready", "Transcripts for every call"],
};

export const socialProof = {
  statement: "Built for teams handling conversations at scale",
  industries: [
    { label: "Sales", icon: Target },
    { label: "Recruiting", icon: Briefcase },
    { label: "Healthcare", icon: Stethoscope },
    { label: "Real Estate", icon: Building2 },
    { label: "Insurance", icon: FileText },
    { label: "Customer Support", icon: Headphones },
  ],
};

export const howItWorks = {
  eyebrow: "How it works",
  title: "From idea to live voice agent in minutes.",
  description:
    "A guided path from a blank agent to real customer conversations — no stitching together telephony, speech and language models by hand.",
  steps: [
    {
      title: "Create your agent",
      description: "Define its role, instructions, voice and the business objective it should achieve.",
      icon: Bot,
    },
    {
      title: "Give it knowledge",
      description: "Add FAQs, product information, documents and the business context it needs.",
      icon: BookOpen,
    },
    {
      title: "Connect your calling",
      description: "Attach a phone number and configure inbound lines or outbound campaigns.",
      icon: PhoneCall,
    },
    {
      title: "Go live",
      description: "Let the agent speak with customers while outcomes are captured automatically.",
      icon: Rocket,
    },
  ] satisfies Step[],
};

export const whyReyvoca = {
  eyebrow: "Why Reyvoca",
  title: "Everything your voice agent needs. Without stitching together ten tools.",
  description:
    "Reyvoca is being designed as one platform for the full call lifecycle — conversation, knowledge, actions and insight.",
  features: [
    {
      title: "Natural conversations",
      description:
        "Designed for low-latency, human-sounding dialogue that keeps pace with the caller instead of reading from a script.",
      icon: AudioLines,
      wide: true,
      visual: "voice",
    },
    {
      title: "Flexible providers",
      description:
        "Not locked to one vendor. Choose the language model, speech-to-text, text-to-speech and telephony provider that fit each agent.",
      icon: Layers,
      wide: true,
      visual: "providers",
    },
    {
      title: "Barge-in",
      description: "Callers can interrupt naturally while the agent is speaking — it stops, listens and adapts.",
      icon: Hand,
    },
    {
      title: "Multilingual",
      description: "Architecture prepared for agents that converse in multiple languages and accents.",
      icon: Languages,
    },
    {
      title: "Knowledge base",
      description: "Ground every answer in your own documents, FAQs and product information.",
      icon: BookOpen,
    },
    {
      title: "Actions & tools",
      description: "Agents built to work with CRMs, calendars, webhooks and your own APIs.",
      icon: Workflow,
    },
    {
      title: "Call transcripts",
      description: "A complete, searchable record of what was said on every call.",
      icon: FileText,
    },
    {
      title: "Call recordings",
      description: "Store recordings where legally and operationally appropriate, with consent controls.",
      icon: Mic,
    },
    {
      title: "Structured outcomes",
      description: "Interested, callback, appointment, qualified — captured as data, not buried in notes.",
      icon: ListChecks,
    },
    {
      title: "Analytics",
      description: "Track calls, connect rate, duration, conversions and agent performance.",
      icon: BarChart3,
    },
  ] satisfies Feature[],
};

export const useCases = {
  eyebrow: "Use cases",
  title: "One voice platform. Multiple workflows.",
  description: "The same agent foundation adapts to the conversations your team has every day.",
  items: [
    {
      title: "Lead qualification",
      description: "Call new or uploaded leads, ask the right questions and surface qualified prospects.",
      icon: Target,
    },
    {
      title: "Appointment booking",
      description: "Schedule consultations, demos and visits directly into the right calendar.",
      icon: CalendarCheck,
    },
    {
      title: "Customer support",
      description: "Resolve common questions instantly and hand off to people when it matters.",
      icon: Headphones,
    },
    {
      title: "Renewal reminders",
      description: "Follow up on subscriptions, policies, service contracts and upcoming payments.",
      icon: RefreshCw,
    },
    {
      title: "Recruitment",
      description: "Pre-screen applicants with consistent questions and schedule interviews.",
      icon: Briefcase,
    },
    {
      title: "Real estate",
      description: "Qualify property enquiries, answer listing questions and book site visits.",
      icon: Building2,
    },
    {
      title: "Healthcare admin",
      description: "Support appointment scheduling and routine administrative calling workflows.",
      icon: Stethoscope,
    },
    {
      title: "Reminders & follow-ups",
      description: "Run courteous, compliant reminder calls with outcomes logged automatically.",
      icon: BellRing,
    },
  ] satisfies UseCase[],
};

export const productExperience = {
  eyebrow: "The platform",
  title: "Every agent, call and outcome in one workspace.",
  description:
    "A preview of the Reyvoca workspace we're building — agents, campaigns, calls and analytics side by side.",
};

export const featureStories: FeatureStory[] = [
  {
    eyebrow: "Agents",
    title: "Create agents for any workflow",
    description:
      "Describe the role, tone and goal in plain language. Each agent gets its own instructions, voice and language — tuned for the job it does.",
    points: ["Role and goal-based instructions", "Voice and language per agent", "Reusable templates for common workflows"],
    visual: "agent-builder",
  },
  {
    eyebrow: "Knowledge",
    title: "Connect your business knowledge",
    description:
      "Upload documents, FAQs and product details so agents answer from your information — not from guesswork.",
    points: ["Documents, FAQs and web pages", "Answers grounded in your sources", "Update knowledge without redeploying"],
    visual: "knowledge",
  },
  {
    eyebrow: "Calling",
    title: "Make inbound and outbound calls",
    description:
      "Put an agent on an inbound line, or run outbound campaigns against a lead list with schedules and retry rules.",
    points: ["Inbound lines and outbound campaigns", "Calling windows and retry rules", "Bring your own telephony provider"],
    visual: "calling",
  },
  {
    eyebrow: "Actions",
    title: "Let agents take real actions",
    description:
      "Mid-conversation, agents can check availability, book meetings and update records through tools you approve.",
    points: ["Calendar, CRM and webhook tools", "You control which actions are allowed", "Every action logged with the call"],
    visual: "actions",
  },
  {
    eyebrow: "Insights",
    title: "Understand every conversation",
    description:
      "Transcripts, summaries and structured outcomes turn each call into something your team can act on.",
    points: ["Full transcripts and summaries", "Structured outcomes and next steps", "Callbacks tracked automatically"],
    visual: "insights",
  },
  {
    eyebrow: "Analytics",
    title: "Optimise using analytics",
    description:
      "See which agents, scripts and calling windows perform best — then iterate with confidence.",
    points: ["Connect rate and call duration", "Outcome and conversion trends", "Per-agent performance"],
    visual: "analytics",
  },
];

export const integrations = {
  eyebrow: "Integrations",
  title: "Built to work with your stack",
  description:
    "Reyvoca is being built provider-agnostic. These are the integrations on our roadmap — not all are available yet.",
  groups: [
    { category: "Telephony", description: "Phone numbers and call routing", items: ["Twilio", "Telnyx"] },
    { category: "Speech", description: "Speech-to-text and text-to-speech", items: ["Sarvam", "Deepgram", "ElevenLabs"] },
    { category: "Language models", description: "Reasoning and conversation", items: ["OpenAI", "Anthropic", "Google", "Sarvam"] },
    {
      category: "Business tools",
      description: "Where outcomes and actions land",
      items: ["Salesforce", "HubSpot", "Calendly", "Google Calendar", "Webhooks"],
    },
  ] satisfies IntegrationGroup[],
};

export const pricing = {
  eyebrow: "Pricing",
  title: "Simple plans as you scale.",
  description: "Final pricing will be announced ahead of public launch. Start free and grow into production.",
  tiers: [
    {
      name: "Starter",
      description: "For individuals experimenting with voice agents.",
      priceLabel: "Coming soon",
      features: ["Build and test agents", "Browser-based test calls", "Core transcripts and outcomes", "Community support"],
      cta: { label: "Start Free", href: routes.startFree },
    },
    {
      name: "Growth",
      description: "For businesses running production voice workflows.",
      priceLabel: "Coming soon",
      features: [
        "Everything in Starter",
        "Phone numbers and campaigns",
        "Knowledge base and actions",
        "Analytics and team seats",
      ],
      cta: { label: "Start Free", href: routes.startFree },
      highlighted: true,
    },
    {
      name: "Enterprise",
      description: "For high-volume or custom deployments.",
      priceLabel: "Custom pricing",
      features: ["Volume-based pricing", "Custom providers and integrations", "Deployment and security reviews", "Dedicated support"],
      cta: { label: "Contact Sales", href: routes.contact },
    },
  ] satisfies PricingTier[],
};

export const faq = {
  eyebrow: "FAQ",
  title: "Questions, answered.",
  items: [
    {
      question: "What is Reyvoca?",
      answer:
        "Reyvoca is an AI voice agent platform currently in development. It is being designed to let businesses create agents that hold natural phone conversations, answer questions, capture outcomes and take actions in the tools they already use.",
    },
    {
      question: "What can Reyvoca voice agents do?",
      answer:
        "Reyvoca agents are being designed to qualify leads, book appointments, answer support questions, run reminder and follow-up calls, and record structured outcomes for every conversation.",
    },
    {
      question: "Can I use Reyvoca for inbound and outbound calls?",
      answer:
        "Yes — the platform is being built to support both: agents answering inbound lines, and outbound campaigns that call a list of leads on a schedule.",
    },
    {
      question: "Can Reyvoca work in multiple languages?",
      answer:
        "Multilingual conversations are part of the core architecture. Supported languages will depend on the speech and language providers selected for each agent.",
    },
    {
      question: "Can I connect Reyvoca to my CRM?",
      answer:
        "CRM integrations such as Salesforce and HubSpot are on our roadmap, alongside webhooks so outcomes can be sent to any system.",
    },
    {
      question: "Can I use my own AI providers?",
      answer:
        "Reyvoca is being designed to be provider-flexible, so you can choose the language model, speech-to-text, text-to-speech and telephony provider for each agent.",
    },
    {
      question: "Does Reyvoca provide call transcripts?",
      answer:
        "Transcripts are a core part of the planned product. Each call is intended to include a full transcript, a summary and its structured outcome.",
    },
    {
      question: "Can I test an agent before making real calls?",
      answer:
        "Yes. Testing an agent in the browser before it ever reaches a customer is a key part of the planned workflow.",
    },
    {
      question: "Will Reyvoca support API integrations?",
      answer:
        "Yes. A developer API and webhooks are planned so you can create agents, trigger calls and receive results programmatically.",
    },
    {
      question: "How will pricing work?",
      answer:
        "Final pricing hasn't been announced. We expect a free tier for experimenting, a usage-based Growth plan and custom Enterprise pricing for high-volume deployments.",
    },
  ] satisfies FaqItem[],
};

export const finalCta = {
  title: "Ready to build your first AI voice agent?",
  description: "Create an agent, test the conversation and prepare it for real customer calls.",
  primaryCta: { label: "Start Free", href: routes.startFree },
  secondaryCta: { label: "Read the Docs", href: routes.docs },
};

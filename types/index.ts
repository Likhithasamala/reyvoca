import type { LucideIcon } from "lucide-react";

export type NavLink = {
  label: string;
  href: string;
};

export type FooterColumn = {
  title: string;
  links: NavLink[];
};

export type Cta = {
  label: string;
  href: string;
};

export type HeroContent = {
  eyebrow: string;
  /** Heading is split so one phrase can carry the brand highlight. */
  heading: { before: string; highlight: string; after?: string };
  subtitle: string;
  primaryCta: Cta;
  secondaryCta: Cta;
  valuePoints: string[];
};

export type Step = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export type Feature = {
  title: string;
  description: string;
  icon: LucideIcon;
  /** Feature spans two columns in the bento grid. */
  wide?: boolean;
  /** Optional illustration shown on wide cards. */
  visual?: "voice" | "providers";
};

export type UseCase = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export type IntegrationGroup = {
  category: string;
  description: string;
  items: string[];
};

export type PricingTier = {
  name: string;
  description: string;
  /** Leave undefined until pricing is final; `priceLabel` is shown instead. */
  price?: { amount: string; period: string };
  priceLabel: string;
  features: string[];
  cta: Cta;
  highlighted?: boolean;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type FeatureStoryVisual =
  | "agent-builder"
  | "knowledge"
  | "calling"
  | "actions"
  | "insights"
  | "analytics";

export type FeatureStory = {
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  visual: FeatureStoryVisual;
};

export type CallOutcome =
  | "Qualified"
  | "Appointment"
  | "Callback"
  | "Not interested"
  | "Voicemail";

export type DemoCall = {
  id: string;
  customer: string;
  agent: string;
  duration: string;
  outcome: CallOutcome;
  time: string;
};

export type DemoStat = {
  label: string;
  value: string;
  change: string;
  icon: LucideIcon;
};

export type DocBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "list"; items: string[] }
  | { type: "callout"; text: string }
  | { type: "code"; language: string; code: string };

export type DocPage = {
  slug: string;
  title: string;
  description: string;
  blocks: DocBlock[];
};

export type InfoPage = {
  slug: string;
  title: string;
  description: string;
  body: string[];
};

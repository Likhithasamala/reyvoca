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
  /** Omitted for live data, where there is no comparison baseline yet. */
  change?: string;
  icon: LucideIcon;
};

/** Outcomes a call can be filed under, used to validate API payloads. */
export const CALL_OUTCOMES = [
  "Qualified",
  "Appointment",
  "Callback",
  "Not interested",
  "Voicemail",
] as const satisfies readonly CallOutcome[];

/** The signed-in account, as exposed to the browser. Never includes secrets. */
export type AccountSummary = {
  id: string;
  fullName: string;
  email: string;
  workspace: string;
  /** One or two letters for the avatar. */
  initials: string;
  /**
   * False until the address has been confirmed by clicking the emailed link.
   * The app nags rather than blocks, so this drives a banner, not a wall.
   */
  emailVerified: boolean;
  /** Google profile picture, for accounts that signed in with Google. */
  avatarUrl?: string;
};

/** Which way a call went. Shared by the dashboard tables. */
export type CallDirection = "Inbound" | "Outbound";

/** One row of calling activity on the dashboard home. */
export type ActivityRow = {
  id: string;
  contact: string;
  agent: string;
  direction: CallDirection;
  duration: string;
  outcome: string;
  time: string;
};

export type OverviewStats = {
  agents: number;
  leads: number;
  qualifiedLeads: number;
  callbacks: number;
};

/** Response body of GET /api/dashboard/overview. */
export type OverviewPayload = {
  /**
   * False for a workspace with nothing stored yet, so the dashboard can fall
   * back to example rows instead of showing an empty table.
   */
  hasData: boolean;
  workspace: string;
  stats: OverviewStats;
  recentActivity: ActivityRow[];
};

/**
 * Who the dashboard says you are.
 *
 * Resolved from the session on the server: a signed-in account, or the shared
 * development workspace when nobody is signed in.
 */
export type WorkspaceIdentity = {
  name: string;
  user: string;
  initials: string;
  /** False for the development workspace, which has no account behind it. */
  signedIn: boolean;
  email?: string;
  /**
   * True only for Reyvoca operators. The sole thing it changes in the customer
   * dashboard is whether the admin panel is linked; the panel and the provider
   * API both re-check server-side.
   */
  isAdmin?: boolean;
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
  /**
   * Renders a labelled mailto after the body. Set on the pages where writing
   * to us is the point — a page that says "get in touch" without giving an
   * address is a dead end.
   */
  contactEmail?: string;
};

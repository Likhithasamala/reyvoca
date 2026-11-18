import type { FooterColumn, NavLink } from "@/types";

/**
 * Canonical site URL. Set NEXT_PUBLIC_SITE_URL in each environment
 * (e.g. https://reyvoca.com in production) so canonical tags,
 * OpenGraph URLs and the sitemap point at the right host.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const siteConfig = {
  name: "Reyvoca",
  title: "Reyvoca — AI Voice Agents for Modern Businesses",
  description:
    "Build intelligent AI voice agents for sales, support, follow-ups, scheduling and business conversations.",
  url: siteUrl,
  copyrightYear: 2026,
};

export const routes = {
  home: "/",
  signIn: "/signin",
  /**
   * The site's one public call to action. Reyvoca is sold with a conversation,
   * not self-serve signup: visitors book a demo and we build their workspace
   * for them, so no public link opens the product directly.
   */
  bookDemo: "/#book-demo",
  /** Where signing in lands: the enquiries waiting to be called back. */
  requests: "/requests",
  /**
   * There is no pricing page. The rate depends on volume and languages, so it
   * is quoted on the demo call rather than published as a table.
   */
  howItWorks: "/#how-it-works",
  industries: "/industries",
  languages: "/languages",
  getStarted: "/get-started",
  forgotPassword: "/forgot-password",
  docs: "/docs",
  contact: "/contact",
  terms: "/terms",
  privacy: "/privacy",
} as const;

/**
 * The Products menu. Nothing here is self-serve, so both products lead to the
 * booking form rather than to a page that would only describe them.
 */
export const productNav: { label: string; description: string; href: string }[] = [
  {
    label: "Instant Leads",
    description: "A lead lands and the agent rings it straight back.",
    href: routes.bookDemo,
  },
  {
    label: "Bulk Leads",
    description: "Work a whole list on a schedule, with retry rules.",
    href: routes.bookDemo,
  },
  {
    label: "Industries",
    description: "What the agent sounds like in your trade.",
    href: routes.industries,
  },
  {
    label: "Languages",
    description: "Eleven languages, switched mid-call.",
    href: routes.languages,
  },
];

/** Section anchors are prefixed with "/" so they work from any page. */
export const mainNav: NavLink[] = [
  { label: "How it works", href: routes.howItWorks },
  { label: "Industries", href: routes.industries },
  { label: "Languages", href: routes.languages },
  { label: "Docs", href: routes.docs },
];

export const footerColumns: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: routes.howItWorks },
      { label: "Book a demo", href: routes.bookDemo },
      { label: "Sign in", href: routes.signIn },
    ],
  },
  {
    title: "Industries",
    links: [
      { label: "Clinics & dental", href: "/industries/clinics" },
      { label: "Real estate", href: "/industries/real-estate" },
      { label: "Education & coaching", href: "/industries/education" },
      { label: "Insurance", href: "/industries/insurance" },
      { label: "All industries", href: routes.industries },
    ],
  },
  {
    title: "Languages",
    links: [
      { label: "Telugu", href: routes.languages },
      { label: "Hindi", href: routes.languages },
      { label: "Tamil", href: routes.languages },
      { label: "All 11 languages", href: routes.languages },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Docs", href: routes.docs },
      { label: "API", href: "/docs/api-reference" },
      { label: "Guides", href: "/docs/quickstart" },
      { label: "Status", href: "/status" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: routes.contact },
      { label: "Careers", href: "/careers" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: routes.privacy },
      { label: "Terms", href: routes.terms },
      { label: "Security", href: "/security" },
    ],
  },
];

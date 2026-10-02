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
  getStarted: "/get-started",
  forgotPassword: "/forgot-password",
  docs: "/docs",
  dashboard: "/dashboard",
  contact: "/contact",
  terms: "/terms",
  privacy: "/privacy",
} as const;

/** Section anchors are prefixed with "/" so they work from any page. */
export const mainNav: NavLink[] = [
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Why Reyvoca", href: "/#why-reyvoca" },
  { label: "Use Cases", href: "/#use-cases" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
  { label: "Docs", href: routes.docs },
];

export const footerColumns: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "How It Works", href: "/#how-it-works" },
      { label: "Use Cases", href: "/#use-cases" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Integrations", href: "/#integrations" },
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

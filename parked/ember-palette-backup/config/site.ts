import { leadModeHref, leadModes } from "@/config/lead-modes";
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
  /**
   * The one way to reach us until there is a phone number and a form. It is
   * the footer's contact line and the Contact page's only real content, so it
   * lives here rather than being typed into both.
   */
  email: "reyvocaai@gmail.com",
};

export const routes = {
  home: "/",
  signIn: "/signin",
  /**
   * The slower route in. Signing up is open to anyone, but a demo is still on
   * offer for teams who would rather we build the first agent with them.
   */
  bookDemo: "/#book-demo",
  /** Where signing in lands: the enquiries waiting to be called back. */
  requests: "/requests",
  /**
   * There is no pricing page. The rate depends on volume and languages, so it
   * is quoted on the demo call rather than published as a table.
   */
  /**
   * The five-step section was taken off the homepage, so this points at the
   * explanation that remains: the same call shown as a transcript, as the
   * fields it captured, and as the record it becomes.
   */
  howItWorks: "/#what-a-call-becomes",
  industries: "/industries",
  languages: "/languages",
  getStarted: "/get-started",
  forgotPassword: "/forgot-password",
  /** Where the emailed reset link lands; it carries a one-time `?token=`. */
  resetPassword: "/reset-password",
  /** Confirm-your-address page: the emailed link, and the "resend" button. */
  verifyEmail: "/verify-email",
  /** Profile, password, signed-in devices and account deletion. */
  account: "/account",
  docs: "/docs",
  contact: "/contact",
  terms: "/terms",
  privacy: "/privacy",
} as const;

/**
 * The Products menu — the two ways a call can start, and nothing else.
 *
 * Industries and Languages used to sit here too; they are properties of every
 * agent rather than products, and both are already in the main nav, so the
 * menu now holds exactly the two things we sell. Each one opens a page that
 * defines it and draws where it sits in the workspace, instead of dropping
 * the visitor straight on the booking form with the term unexplained.
 */
export const productNav: { label: string; description: string; href: string }[] = leadModes.map(
  (mode) => ({
    label: mode.label,
    description: mode.menuDescription,
    href: leadModeHref(mode.slug),
  }),
);

/**
 * Section anchors are prefixed with "/" so they work from any page.
 *
 * Home leads: these links also furnish the phone menu, where the logo is the
 * only other way back and is easy to miss.
 */
export const mainNav: NavLink[] = [
  { label: "Home", href: routes.home },
  { label: "How it works", href: routes.howItWorks },
  { label: "Industries", href: routes.industries },
  { label: "Languages", href: routes.languages },
  { label: "Docs", href: routes.docs },
];

/**
 * The footer's columns — hub links, not a site map.
 *
 * This list used to carry twenty-three links across six columns, which made
 * the footer taller than some of the pages under it. It is now the hubs, and
 * nothing is unreachable as a result:
 *
 *   - The four doc links went: components/docs/docs-nav.tsx lists every doc
 *     page in the sidebar of each one, so /docs reaches them all.
 *   - The four industry links went: app/(marketing)/industries/page.tsx maps
 *     every industry, so /industries reaches them all.
 *   - The five language links were all one href — the same /languages page
 *     listed five times as keywords. One link says it once.
 *   - Privacy and Terms moved into the bottom bar, where they already were.
 *
 * Two rules this list still keeps:
 *   1. Every href resolves. A footer full of dead links is worse than a short
 *      footer, so nothing is listed that does not have a page behind it.
 *   2. The label names the destination. "All 11 languages" carries a signal;
 *      "learn more" does not.
 *
 * Signing in is deliberately absent. The footer is for people deciding, and a
 * client login belongs in the bar at the top where a customer looks for it.
 */
export const footerColumns: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: leadModes[0].label, href: leadModeHref(leadModes[0].slug) },
      { label: leadModes[1].label, href: leadModeHref(leadModes[1].slug) },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "Industries", href: routes.industries },
      { label: "All 11 languages", href: routes.languages },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "How it works", href: routes.howItWorks },
      { label: "Docs", href: routes.docs },
      { label: "Contact us", href: routes.contact },
    ],
  },
];
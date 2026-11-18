/**
 * Dashboard navigation — the single source of truth.
 *
 * The sidebar renders exactly these groups and items, in this order. Nothing
 * else belongs in the primary navigation: new functionality lives *inside* one
 * of these sections (as internal tabs or sub-views), never as a 14th item.
 *
 * Providers are deliberately absent. Which vendor serves speech, transcription
 * or intelligence is a Reyvoca operations concern, configured in the operator
 * panel (`config/admin-nav.ts`) and never shown to a customer.
 */
import {
  Bot,
  ChartNoAxesCombined,
  LayoutDashboard,
  Megaphone,
  Phone,
  PhoneIncoming,
  Plus,
  Settings,
  UserRoundCheck,
  Wallet,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type DashboardNavGroup = {
  /** Shown as a small uppercase label above the group. */
  title: string;
  items: DashboardNavItem[];
};

export const dashboardNavGroups: DashboardNavGroup[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "My Agents", href: "/dashboard/agents", icon: Bot },
      { label: "Create Agent", href: "/dashboard/agents/create", icon: Plus },
    ],
  },
  {
    title: "Calling",
    items: [
      { label: "Instant Leads", href: "/dashboard/calling/instant", icon: Zap },
      { label: "Bulk Campaigns", href: "/dashboard/calling/bulk", icon: Megaphone },
      { label: "Inbound", href: "/dashboard/calling/inbound", icon: PhoneIncoming },
    ],
  },
  {
    title: "Results & Setup",
    items: [
      { label: "Leads & Results", href: "/dashboard/results", icon: UserRoundCheck },
      { label: "Phone Numbers", href: "/dashboard/phone-numbers", icon: Phone },
      { label: "Performance", href: "/dashboard/performance", icon: ChartNoAxesCombined },
      { label: "Usage & Billing", href: "/dashboard/billing", icon: Wallet },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

/** Flat list in sidebar order, for previews and lookups. */
export const dashboardNavItems: DashboardNavItem[] = dashboardNavGroups.flatMap(
  (group) => group.items,
);

/**
 * Resolves which nav item a pathname belongs to, by longest matching href.
 *
 * Longest-match is what makes the nested routes behave:
 * - `/dashboard/agents/create` → Create Agent (beats `/dashboard/agents`)
 * - `/dashboard/agents/abc123` → My Agents (agent detail adds no nav item)
 *
 * `/dashboard` matches exactly only, since it prefixes every other route.
 */
export function activeNavHref(pathname: string): string | undefined {
  if (pathname === "/dashboard") return "/dashboard";

  return dashboardNavItems
    .filter((item) => item.href !== "/dashboard")
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

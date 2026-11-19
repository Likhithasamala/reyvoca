/**
 * Operator panel navigation.
 *
 * The admin panel is Reyvoca's own back office, not part of the customer
 * product: it holds the things customers must not see or change — today the
 * provider stack behind every call. Access is checked on the server in
 * `app/admin/layout.tsx`; see `lib/server/admin.ts` for the rule.
 */
import { IndianRupee, LayoutDashboard, Mail, Plug } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** One line under the label on the overview page. */
  desc: string;
};

export const adminNavItems: AdminNavItem[] = [
  {
    label: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
    desc: "What the platform is running on right now.",
  },
  {
    label: "Providers",
    href: "/admin/providers",
    icon: Plug,
    desc: "API keys for language models, speech-to-text and text-to-speech.",
  },
  {
    label: "Mailbox",
    href: "/admin/mailbox",
    icon: Mail,
    desc: "Auth emails sent, and the links themselves while no provider is configured.",
  },
  {
    label: "Billing",
    href: "/admin/billing",
    icon: IndianRupee,
    desc: "Per-minute pricing, margin, and customer credits.",
  },
];

/** Longest-match active item, as in the dashboard sidebar. */
export function activeAdminHref(pathname: string): string | undefined {
  if (pathname === "/admin") return "/admin";
  return adminNavItems
    .filter((item) => item.href !== "/admin")
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

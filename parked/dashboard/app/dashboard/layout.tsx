import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { currentIdentity } from "@/lib/server/workspace";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · Reyvoca" },
  robots: { index: false, follow: false },
};

/**
 * Dashboard frame.
 *
 * No authentication gate in this phase: "Start Free" opens the product
 * directly, so every dashboard route is reachable without an account. The
 * workspace shown in the chrome is resolved from the session here — the real
 * account when one is signed in, the shared development workspace otherwise.
 */
export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const workspace = await currentIdentity();
  return <DashboardShell workspace={workspace}>{children}</DashboardShell>;
}

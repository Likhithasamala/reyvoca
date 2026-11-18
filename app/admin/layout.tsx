import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { currentAdmin } from "@/lib/server/admin";

export const metadata: Metadata = {
  title: { default: "Operator", template: "%s · Reyvoca Operator" },
  robots: { index: false, follow: false },
};

/**
 * Operator panel gate.
 *
 * Everything under `/admin` is Reyvoca's own back office. A request that is
 * not an operator gets a 404 rather than a redirect or a "forbidden" page:
 * customers have no reason to learn that this panel exists. The provider API
 * re-checks on every call, so this is a door, not the only lock.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { isAdmin, user } = await currentAdmin();
  if (!isAdmin) notFound();

  return <AdminShell operator={user?.email ?? null}>{children}</AdminShell>;
}

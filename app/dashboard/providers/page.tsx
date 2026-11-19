import { notFound, redirect } from "next/navigation";
import { isAdminRequest } from "@/lib/server/admin";

/**
 * The old customer-facing Providers page.
 *
 * Providers moved to the operator panel: a customer must not see which vendors
 * run their calls, so this route 404s for them and only forwards operators (or
 * an old bookmark) to `/admin/providers`.
 */
export default async function ProvidersPage() {
  if (!(await isAdminRequest())) notFound();
  redirect("/admin/providers");
}

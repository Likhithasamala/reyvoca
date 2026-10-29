import { FileText, Wallet } from "lucide-react";
import { Notice } from "@/components/dashboard/ui/notice";
import { PageHeader } from "@/components/dashboard/ui/page-header";
import { SectionCard } from "@/components/dashboard/ui/section-card";

export const metadata = { title: "Billing" };

export default function BillingPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Billing"
        description="Plans, usage and invoices for this workspace."
      />

      <Notice title="Pricing configuration coming soon.">
        Plans and rates are not finalised, so no amounts, balances or usage figures are shown. Nothing is charged and no
        payment method is connected.
      </Notice>

      <div className="grid gap-4 sm:grid-cols-2">
        <SectionCard title="Current Plan" description="The plan this workspace is on.">
          <div className="flex items-start gap-2.5 rounded-lg border border-dashed border-line-strong px-3.5 py-3">
            <Wallet className="mt-0.5 size-4 shrink-0 text-ink-subtle" strokeWidth={1.75} aria-hidden="true" />
            <p className="text-xs leading-relaxed text-ink-muted">
              No plan selected. Plans appear here once pricing is published.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Usage" description="Call minutes, voice and telephony costs.">
          <div className="flex items-start gap-2.5 rounded-lg border border-dashed border-line-strong px-3.5 py-3">
            <Wallet className="mt-0.5 size-4 shrink-0 text-ink-subtle" strokeWidth={1.75} aria-hidden="true" />
            <p className="text-xs leading-relaxed text-ink-muted">
              No usage to report — your agents have not placed any calls.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Invoices" description="Past statements for this workspace." className="sm:col-span-2">
          <div className="flex items-start gap-2.5 rounded-lg border border-dashed border-line-strong px-3.5 py-3">
            <FileText className="mt-0.5 size-4 shrink-0 text-ink-subtle" strokeWidth={1.75} aria-hidden="true" />
            <p className="text-xs leading-relaxed text-ink-muted">
              No invoices yet. Statements will be listed here with their date, amount and status.
            </p>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

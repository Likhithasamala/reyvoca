import { Phone, Plus } from "lucide-react";
import { Action } from "@/components/dashboard/ui/action";
import { EmptyState } from "@/components/dashboard/ui/empty-state";
import { Notice } from "@/components/dashboard/ui/notice";
import { PageHeader } from "@/components/dashboard/ui/page-header";

export const metadata = { title: "Phone Numbers" };

export default function PhoneNumbersPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Phone Numbers"
        description="Manage the numbers your Reyvoca agents use for calling."
        actions={
          <Action disabled title="Available once a calling provider is connected">
            <Plus className="size-4" aria-hidden="true" /> Add Phone Number
          </Action>
        }
      />

      <Notice title="No calling provider connected.">
        Phone provider connection will be available when telephony is configured. Numbers cannot be bought or assigned
        from here yet.
      </Notice>

      <EmptyState
        icon={Phone}
        title="No phone numbers connected"
        description="Connect a calling provider when you're ready."
        action={
          <Action disabled title="Available once a calling provider is connected">
            <Plus className="size-4" aria-hidden="true" /> Add Phone Number
          </Action>
        }
        footnote="Each number will show its country, assigned agent, direction and status."
      />
    </div>
  );
}

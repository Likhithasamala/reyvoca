import { PhoneIncoming } from "lucide-react";
import { SelectField, TextField } from "@/components/dashboard/ui/field";
import { Notice } from "@/components/dashboard/ui/notice";
import { PageHeader } from "@/components/dashboard/ui/page-header";
import { SectionCard } from "@/components/dashboard/ui/section-card";
import { StatusBadge } from "@/components/dashboard/ui/status-badge";

export const metadata = { title: "Inbound" };

export default function InboundPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Inbound"
        description="Configure a Reyvoca agent to answer incoming customer calls."
        meta={<StatusBadge status="Not configured" />}
      />

      <Notice title="Setup preview.">
        Answering real calls needs a connected phone number. These controls show the intended setup and are inactive for
        now.
      </Notice>

      <SectionCard title="Answering" description="Who picks up, and on which number.">
        <div className="space-y-5">
          <SelectField
            id="inbound-agent"
            label="Agent"
            options={["No agents available yet"]}
            disabled
            hint="Create an agent first — it will appear in this list."
          />
          <SelectField
            id="inbound-number"
            label="Phone number"
            options={["No numbers connected"]}
            disabled
            hint="Connect a number under Phone Numbers to route calls to it."
          />
          <SelectField
            id="inbound-handling"
            label="Call handling"
            options={["Answer immediately", "Answer after 2 rings", "Answer after 4 rings"]}
            disabled
          />
        </div>
      </SectionCard>

      <SectionCard title="Business hours" description="When the agent answers, and what happens outside those hours.">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField id="inbound-open" label="Opens" type="time" defaultValue="09:00" disabled />
          <TextField id="inbound-close" label="Closes" type="time" defaultValue="18:00" disabled />
          <SelectField
            id="inbound-fallback"
            label="Fallback behavior"
            options={["Take a message", "Forward to a teammate", "Play a closed message"]}
            disabled
            wrapperClassName="sm:col-span-2"
            hint="Used outside business hours, or if the agent cannot handle the call."
          />
        </div>
      </SectionCard>

      <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-line-strong px-4 py-3.5 text-sm text-ink-muted">
        <PhoneIncoming className="size-4 shrink-0 text-ink-subtle" aria-hidden="true" />
        Inbound answering activates when telephony is configured.
      </div>
    </div>
  );
}

"use client";

import { Bot } from "lucide-react";
import { useRouter } from "next/navigation";
import { ActionLink } from "@/components/dashboard/ui/action";
import { EmptyState } from "@/components/dashboard/ui/empty-state";
import { PageHeader } from "@/components/dashboard/ui/page-header";
import { AgentEditor } from "@/components/dashboard/agents/agent-editor";
import { useAgent } from "@/lib/agents/store";
import { connectedProviders, useProviders } from "@/lib/providers/store";

/** An existing agent opens straight into the full editor, like a new one. */
export function AgentDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { agent, ready } = useAgent(id);
  const { providers: records } = useProviders();

  if (!ready) {
    return <div className="mx-auto h-64 max-w-6xl rounded-xl border border-line bg-surface-muted/50" />;
  }

  if (!agent) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader title="Agent not found" />
        <EmptyState
          icon={Bot}
          title="This agent doesn't exist"
          description="It may have been deleted, or the link is out of date."
          action={<ActionLink href="/dashboard/agents">Back to My Agents</ActionLink>}
        />
      </div>
    );
  }

  return (
    <AgentEditor
      // Remount when another agent is opened so local edit state resets.
      key={agent.id}
      initial={agent}
      providers={connectedProviders(records)}
      onCancel={() => router.push("/dashboard/agents")}
      onDone={() => router.push("/dashboard/agents")}
    />
  );
}

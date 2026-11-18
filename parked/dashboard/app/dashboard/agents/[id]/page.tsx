import { AgentDetailView } from "@/components/dashboard/views/agent-detail-view";

export const metadata = { title: "Agent" };

/** Session-scoped and loaded at request time — never prerendered. */
export const dynamic = "force-dynamic";

export default async function AgentDetailPage({ params }: PageProps<"/dashboard/agents/[id]">) {
  const { id } = await params;
  return <AgentDetailView id={id} />;
}

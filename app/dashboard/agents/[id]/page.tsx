import { AgentDetailView } from "@/components/dashboard/views/agent-detail-view";

export const metadata = { title: "Agent" };

export default async function AgentDetailPage({ params }: PageProps<"/dashboard/agents/[id]">) {
  const { id } = await params;
  return <AgentDetailView id={id} />;
}

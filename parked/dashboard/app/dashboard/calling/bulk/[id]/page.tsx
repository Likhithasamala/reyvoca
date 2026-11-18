import { CampaignDetailView } from "@/components/dashboard/views/campaign-detail-view";

export const metadata = { title: "Campaign" };

/** Session-scoped and loaded at request time — never prerendered. */
export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({ params }: PageProps<"/dashboard/calling/bulk/[id]">) {
  const { id } = await params;
  return <CampaignDetailView id={id} />;
}

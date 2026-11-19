import { getLeadMode, leadModeHref } from "@/config/lead-modes";
import { LeadModePage } from "@/components/marketing/lead-mode-page";
import { pageMetadata } from "@/lib/metadata";

const mode = getLeadMode("instant-leads");

export const metadata = pageMetadata({
  title: mode.title,
  description: mode.metaDescription,
  path: leadModeHref(mode.slug),
});

export default function InstantLeadsPage() {
  return <LeadModePage mode={mode} />;
}

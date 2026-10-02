import { notFound } from "next/navigation";
import { getDocPage } from "@/config/docs";
import { routes } from "@/config/site";
import { DocContent } from "@/components/docs/doc-content";
import { DocPager } from "@/components/docs/doc-pager";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Docs",
  description: "Documentation for building AI voice agents with Reyvoca.",
  path: routes.docs,
});

export default function DocsHomePage() {
  const page = getDocPage("");
  if (!page) notFound();
  return (
    <>
      <DocContent page={page} />
      <DocPager slug={page.slug} />
    </>
  );
}

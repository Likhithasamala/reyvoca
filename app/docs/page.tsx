import { notFound } from "next/navigation";
import { getDocPage } from "@/config/docs";
import { routes } from "@/config/site";
import { DocContent } from "@/components/docs/doc-content";
import { DocPager } from "@/components/docs/doc-pager";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Docs",
  description:
    "Reyvoca docs: build, train and deploy an AI voice agent, connect a phone number, set the languages a call can switch to, and read the call API reference.",
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

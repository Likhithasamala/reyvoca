import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

type PageMetadataInput = {
  /** Page title; omit on the home page to use the full site title. */
  title?: string;
  description?: string;
  /** Path used for the canonical URL, e.g. "/docs/agents". */
  path: string;
  noIndex?: boolean;
};

/**
 * Builds complete per-page metadata. Next.js replaces (does not merge)
 * nested objects like `openGraph`, so each page gets a full set here.
 */
export function pageMetadata({ title, description = siteConfig.description, path, noIndex }: PageMetadataInput): Metadata {
  const fullTitle = title ? `${title} · ${siteConfig.name}` : siteConfig.title;
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      locale: "en_US",
      title: fullTitle,
      description,
      url: path,
      // Page-level openGraph replaces the root one, so the image must be re-declared.
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: siteConfig.title }],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: ["/twitter-image"] },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

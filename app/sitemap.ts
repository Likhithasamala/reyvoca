import type { MetadataRoute } from "next";
import { docHref, docPages } from "@/config/docs";
import { industries } from "@/config/industries";
import { infoPages } from "@/config/info-pages";
import { leadModeHref, leadModes } from "@/config/lead-modes";
import { routes, siteUrl } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths: { path: string; priority: number }[] = [
    { path: routes.home, priority: 1 },
    // The two product pages define the terms the Products menu uses, so they
    // are the first thing after the homepage.
    ...leadModes.map((mode) => ({ path: leadModeHref(mode.slug), priority: 0.9 })),
    // The industry and language pages are the site's search surface: each one
    // answers a query a buyer actually types, so they rank above the docs.
    { path: routes.industries, priority: 0.9 },
    { path: routes.languages, priority: 0.9 },
    ...industries.map((industry) => ({ path: `/industries/${industry.slug}`, priority: 0.8 })),
    { path: routes.signIn, priority: 0.5 },
    ...docPages.map((page) => ({ path: docHref(page.slug), priority: page.slug ? 0.6 : 0.7 })),
    ...infoPages.map((page) => ({ path: `/${page.slug}`, priority: 0.4 })),
  ];

  return paths.map(({ path, priority }) => ({
    url: `${siteUrl}${path === "/" ? "" : path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority,
  }));
}

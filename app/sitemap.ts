import type { MetadataRoute } from "next";
import { docHref, docPages } from "@/config/docs";
import { infoPages } from "@/config/info-pages";
import { routes, siteUrl } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths: { path: string; priority: number }[] = [
    { path: routes.home, priority: 1 },
    { path: routes.getStarted, priority: 0.8 },
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

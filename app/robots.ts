import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    /**
     * Everything a signed-in person or an operator sees is disallowed here as
     * well as being `noindex` in its own metadata. noindex alone still lets a
     * crawler fetch the page; this stops the request being made at all, which
     * matters for the operator panel and the enquiry list because both render
     * real customer data.
     *
     * Keep this list in step with PRIVATE in scripts/seo-check.mjs — the gate
     * fails the build if a private route is missing from either side.
     */
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/account",
        "/dashboard",
        "/requests",
        "/get-started",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
        "/api/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}

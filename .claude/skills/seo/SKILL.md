---
name: seo
description: Reyvoca's standing SEO policy. Apply automatically whenever writing or changing any user-visible text, adding a page or route, adding a feature, or changing navigation, metadata, headings, links or images — without being asked. Covers metadata, headings, copy, internal linking, structured data, robots/sitemap and the seo-check gate.
---

# SEO policy — applied by default, never on request

The user has asked once that SEO be handled automatically and said they will
not repeat it. Treat this file as a standing instruction: it applies to every
change to user-visible text, routes, navigation, metadata or images, and you
apply it without being told and without asking permission.

`node scripts/seo-check.mjs` is the machine half and must pass before you say a
task is done. This file is the half a script cannot check.

## The non-negotiables (the gate enforces these)

1. **Every route declares metadata** — `pageMetadata({ title, description, path })`.
2. **`path` equals the route.** A wrong canonical makes two URLs fight.
3. **Private surfaces are `noIndex` *and* robots-disallowed.** `/admin`,
   `/account`, `/requests`, and the password/verify flows render real customer
   data. `noindex` alone still lets a crawler fetch the page; the robots
   disallow stops the request. Both, always. Keep `PRIVATE` in
   `scripts/seo-check.mjs` and the disallow list in `app/robots.ts` in step.
4. **One `<h1>` per page.** Two splits the topical signal.
5. **Every image has `alt`** — descriptive, or `alt=""` if truly decorative.
6. **No duplicate titles or descriptions** across routes.
7. **Titles ≤ 60 chars including the ` · Reyvoca` suffix**; descriptions
   70–160. Outside that the SERP truncates or wastes the snippet.

Metadata merges **shallowly** from the root segment down, and a key set in a
layout survives unless the page sets that same key. So `app/admin/layout.tsx`
setting `robots` covers every page beneath it — don't duplicate it per page,
and don't let a page redefine `robots` and accidentally drop the protection.

## Writing copy

Reyvoca sells AI voice agents that answer, qualify and book inbound calls, in
English and ten Indian languages, to businesses in India.

- **Lead with the thing searched for, not the brand.** "AI voice agent for
  clinics" earns the click; "Reyvoca — reimagining conversations" does not.
- **The h1 answers the query the page targets.** One page, one intent. If a
  page is trying to rank for two different things, it should be two pages.
- **Write the description as a promise, not a summary.** It is ad copy that
  happens to live in the head: what the reader gets, in their words.
- **Name the entities.** Languages, industries, integrations, cities. These
  are what the page can actually be found for, and the industry and language
  pages are the site's whole search surface.
- **Never keyword-stuff.** Repetition reads as spam to both the reader and the
  ranking model. Say it once, well, in a real sentence.
- **Honest claims only.** No invented metrics, no fake testimonials, no
  "trusted by 500 businesses" unless it is true. Simulated demos stay labelled
  "Simulated" — see the taste-skill memory.

## Internal linking

- Every new page must be reachable from at least one other page. An orphan
  page is not crawled. The gate warns when a public route is missing from
  `app/sitemap.ts`.
- Anchor text says the destination. "here", "read more", "learn more", "click
  here" pass no signal and the gate warns on them.
- When adding a page, add it to `app/sitemap.ts` with a priority that reflects
  its real importance, and link to it from the nav, footer or a related page.

## Structured data

The homepage carries JSON-LD. When adding a page type that has a schema.org
equivalent, add the matching structured data:

- Industry and language pages → `Service` or `Product`
- Docs → `TechArticle`
- FAQ sections → `FAQPage` (only when the Q&A is actually visible on the page)
- Org-wide → `Organization` + `WebSite` with `SearchAction`

Never mark up content that is not visible to the reader.

## Performance is ranking

- Images go through `next/image` with explicit `width`/`height` so nothing
  shifts. CLS is a ranking input.
- Fonts stay on `display: "swap"` (already set on Inter in `app/layout.tsx`).
- Anything below the fold that is heavy gets `loading="lazy"`.
- Don't add a client component where a server component works — JS cost is
  measured and it feeds Core Web Vitals.

## When you change something

Run the gate. It is fast and has no dependencies:

```
node scripts/seo-check.mjs            # static checks
node scripts/seo-check.mjs --live     # also crawls localhost:3000 and checks rendered HTML
```

`--live` validates what is actually served: real `<title>`, description,
canonical, `<h1>` count, `og:image`, JSON-LD, sitemap/route agreement, and that
nothing in the sitemap 404s or is `noindex`. Run it before shipping; the static
pass is what runs automatically on every edit.

# Reyvoca

**AI voice agents for real business conversations.**

Reyvoca is a platform, currently in development, where businesses can create AI voice agents that hold natural phone conversations with customers, ground their answers in business knowledge, take actions in existing tools, and capture a structured outcome for every call.

---

## Current phase: Phase 1 — marketing frontend & platform foundation

Phase 1 delivers the public website and the frontend architecture that the voice platform will grow into. **No backend exists yet.**

| Area | Status in Phase 1 |
| --- | --- |
| Marketing homepage (`/`) | Complete. Hero with an animated call simulation, How It Works, Why Reyvoca, Use Cases, platform preview, feature stories, integrations, pricing, FAQ and a final CTA |
| Sign In (`/signin`), Get Started (`/get-started`), Forgot Password (`/forgot-password`) | Full UI with client-side validation. Submissions go through an auth service layer that reports "accounts aren't open yet" until an API is configured |
| Docs (`/docs`, `/docs/[slug]`) | Docs shell with a sidebar, 9 starter pages, prev/next links and mobile navigation. Pages are driven by config |
| Dashboard (`/dashboard`, `/dashboard/[section]`) | Shell only: sidebar, topbar and an overview built from **clearly labelled demo data**. The other sections are placeholders |
| Footer pages (`/about`, `/contact`, `/careers`, `/status`, `/privacy`, `/terms`, `/security`) | Placeholder pages with honest copy. No legal text or certifications |
| SEO | Per-page metadata, canonical URLs, OpenGraph and Twitter images, sitemap, robots, JSON-LD (Organization and FAQPage) |

The site does not claim customers, uptime figures or certifications. It describes planned capabilities as planned.

## Technology stack

- **Next.js 16** (App Router, Turbopack), with every route statically prerendered
- **React 19** and **TypeScript** (strict)
- **Tailwind CSS v4**, with design tokens defined in `app/globals.css` via `@theme`
- **Inter** loaded through `next/font`
- **lucide-react** icons. There are no other runtime UI dependencies.

Interactivity is kept small. Client components are used only for the hero call simulation, the navbar scroll state, the mobile menu, the forms, the docs/dashboard active-link state and the dashboard drawer. The FAQ accordion uses native `<details>`, and scroll reveals are CSS-only (`animation-timeline: view()`). Both respect `prefers-reduced-motion`.

## Local setup

Requirements: Node.js 20.9+ (developed on Node 22) and npm.

```bash
git clone https://github.com/Likhithasamala/reyvoca.git
cd reyvoca
npm install
cp .env.example .env.local   # optional in Phase 1
npm run dev
```

Open http://localhost:3000.

## Development commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run lint` | Run ESLint (Next.js core-web-vitals and TypeScript rules) |
| `npm run typecheck` | Generate route types and run `tsc --noEmit` |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |

## Project structure

```
app/
  (marketing)/          Homepage + footer info pages (shared navbar/footer layout)
    page.tsx
    [page]/page.tsx     /about, /contact, /privacy … (generated from config/info-pages.ts)
  (auth)/               /signin, /get-started, /forgot-password
  docs/                 Docs layout, /docs and /docs/[slug]
  dashboard/            Dashboard shell, overview, /dashboard/[section] placeholders
  layout.tsx            Root layout, fonts, global metadata
  globals.css           Design tokens, utilities, motion rules
  sitemap.ts, robots.ts, opengraph-image.tsx, twitter-image.tsx, icon.svg, apple-icon.tsx
components/
  ui/                   Button, Container, SectionHeading, Eyebrow, Logo, IconTile, FormField, Waveform
  layout/               Navbar, NavbarShell, MobileMenu, Footer, SkipLink
  marketing/            Hero, ProductDemo, SocialProof, HowItWorks, WhyReyvoca, FeatureCard,
                        UseCases, UseCaseCard, ProductExperience, FeatureStories, StoryVisuals,
                        Integrations, Pricing, PricingCard, Faq, FinalCta
  auth/                 AuthShell, SignInForm, GetStartedForm, ForgotPasswordForm, FormNotice, GoogleButton
  docs/                 DocsSidebar / DocsMobileNav, DocContent, DocPager
  dashboard/            DashboardShell, DashboardTopbar, StatCard, RecentCallsTable,
                        WeeklyCallsChart, OutcomeBadge, DemoBanner
  seo/                  JsonLd
config/
  site.ts               Site URL, routes, navigation and footer links
  marketing.ts          All homepage copy, plus alternative taglines
  docs.ts               Docs pages (add an entry to add a page, sidebar and sitemap entry)
  dashboard.ts          Dashboard navigation + DEMO data
  info-pages.ts         Footer info pages
lib/
  auth/                 AuthService interface + implementations (see below)
  metadata.ts           pageMetadata() helper for consistent SEO
  validation.ts, cn.ts, use-reduced-motion.ts, og-image.tsx
types/                  Shared TypeScript types
```

### Changing copy

All marketing text lives in `config/marketing.ts`. Alternative headlines are listed in `taglines`. Prices can be added later by setting `price: { amount, period }` on a tier in `pricing.tiers`. Tiers without a price show `priceLabel`.

### Auth service layer

UI components depend only on the `AuthService` interface in `lib/auth/types.ts`. The implementation is chosen in `lib/auth/service.ts`:

- **`NEXT_PUBLIC_API_URL` unset (default):** every call returns `not_configured`, and the UI says accounts aren't open yet. Nothing pretends to sign in or create an account.
- **`NEXT_PUBLIC_API_URL` set:** an HTTP adapter posts to provisional endpoints (`/auth/sign-in`, `/auth/sign-up`, `/auth/password-reset`). Align these with the real backend in Phase 2.

## Environment variables

See `.env.example`. Copy it to `.env.local` and never commit real values.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical site origin for canonical tags, OpenGraph URLs and the sitemap. Defaults to `http://localhost:3000`. Set it to the production domain when deploying |
| `NEXT_PUBLIC_API_URL` | Base URL of the future Reyvoca API. Leave empty in Phase 1 |

Phase 1 needs no secrets or provider credentials.

## Build

```bash
npm run lint
npm run typecheck
npm run build
npm run start   # serves the production build on :3000
```

## Deployment

The app is fully static-renderable and deploys to any Next.js host.

**Vercel (recommended):** import the GitHub repository, keep the default framework settings, set `NEXT_PUBLIC_SITE_URL` to the production URL, and deploy.

**Self-hosted Node:** `npm ci && npm run build && npm run start`, behind a reverse proxy, with `NEXT_PUBLIC_SITE_URL` set at build time.

## Roadmap

- **Phase 2: accounts & workspace.** Real authentication, workspaces, team members, and a backend API behind the existing `AuthService`.
- **Phase 3: agents.** Agent builder (instructions, voice, language), provider selection (LLM / STT / TTS), and browser test calls.
- **Phase 4: telephony.** Phone numbers, inbound routing, outbound calls, barge-in and low-latency streaming.
- **Phase 5: knowledge & actions.** Knowledge base ingestion and grounding, tool calls (calendar, CRM, webhooks).
- **Phase 6: campaigns & leads.** Lead uploads, scheduling, calling windows, retries and compliance controls.
- **Phase 7: insight.** Transcripts, recordings, structured outcomes, callbacks and analytics.
- **Phase 8: commercial.** Billing, usage metering, public API and webhooks, status page, legal pages.

---

© 2026 Reyvoca. All rights reserved.

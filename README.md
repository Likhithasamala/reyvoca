# Reyvoca

**AI voice agents for real business conversations.**

Reyvoca is a platform, currently in development, where businesses can create AI voice agents that hold natural phone conversations with customers, ground their answers in business knowledge, take actions in existing tools, and capture a structured outcome for every call.

---

## Current phase: Phase 2 — accounts & workspace

Phase 1 delivered the public website and the frontend architecture. Phase 2 adds the **backend API that the frontend now talks to**: real accounts, password hashing, httpOnly sessions and a private dashboard.

The backend runs inside this same Next.js app as Route Handlers under `app/api/`, so `npm run dev` serves the frontend and the API together on one port with no extra service to start.

| Area | Status in Phase 1 |
| --- | --- |
| Marketing homepage (`/`) | Complete. Hero with an animated call simulation, How It Works, Why Reyvoca, Use Cases, platform preview, feature stories, integrations, pricing, FAQ and a final CTA |
| Sign In (`/signin`), Get Started (`/get-started`), Forgot Password (`/forgot-password`) | Working. Sign-up creates a real account, sign-in starts a session, and both validate on the client **and** the server |
| Docs (`/docs`, `/docs/[slug]`) | Docs shell with a sidebar, 9 starter pages, prev/next links and mobile navigation. Pages are driven by config |
| Dashboard (`/dashboard/*`) | Open during development — "Start Free" goes straight in, with no account required. Every section reads the API: agents, leads, campaigns and the home overview are live. The topbar and sidebar name the signed-in account when there is one, the shared development workspace otherwise. A workspace with nothing stored yet falls back to **clearly labelled sample data**, and the analytics and conversation views are still placeholders |
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
cp .env.example .env.local
npm run dev
```

Open **http://localhost:3000**. The API is on the same origin at **http://localhost:3000/api** — check it with `curl http://localhost:3000/api/health`.

The dashboard is open at http://localhost:3000/dashboard with no account: everything created there belongs to a shared development workspace. To try the account flow, open http://localhost:3000/get-started and create a workspace — the dashboard chrome then names your account, your records are partitioned under it, and you sign out from the avatar menu in the topbar.

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
  dashboard/            Dashboard shell plus a route per section: agents, calling,
                        results, conversations, performance, phone-numbers, billing, settings
                        layout.tsx resolves the workspace from the session on the server
  api/                  Backend Route Handlers
    health/route.ts
    auth/               sign-up, sign-in, sign-out, session, password-reset
    dashboard/overview/ Live workspace figures
    agents/, leads/, campaigns/, instant-setup/, webhook-events/
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
  dashboard/            DashboardShell, SidebarNav, Topbar, WorkspaceMenu, SignOutButton,
                        GlobalSearch, GettingStartedCard, AgentCard
    ui/                 Shared product primitives: MetricCard, DataTable, SectionCard,
                        PageHeader, StatusBadge, DemoTag, EmptyState, Notice, BarChart
    calling/            Campaign wizard, CSV upload, webhook setup, live call views
    views/              Page-level views: agents, results, conversations, settings, campaigns
  seo/                  JsonLd
config/
  site.ts               Site URL, routes, navigation and footer links
  marketing.ts          All homepage copy, plus alternative taglines
  docs.ts               Docs pages (add an entry to add a page, sidebar and sitemap entry)
  dashboard.ts          Marketing-side dashboard preview data
  dashboard-nav.ts      Dashboard sidebar navigation
  dashboard-demo.ts     Example data for the views with no endpoint behind them yet
  brand.ts              Brand palette and voice tokens
  info-pages.ts         Footer info pages
lib/
  server/               Backend only — never imported by client components
    db.ts               JSON-file datastore (read / mutate)
    password.ts         scrypt hashing and verification
    session.ts          Session issuing, lookup and teardown
    workspace.ts        Resolves the request's workspace and identity from the session
    overview.ts         Dashboard figures, shared by the API route and the page
    leads.ts            Lead validation, de-duplication and ingestion
    http.ts             JSON response helpers
  auth/                 AuthService interface + implementations (see below)
  metadata.ts           pageMetadata() helper for consistent SEO
  validation.ts, cn.ts, use-reduced-motion.ts, og-image.tsx
types/                  Shared TypeScript types
```

### Changing copy

All marketing text lives in `config/marketing.ts`. Alternative headlines are listed in `taglines`. Prices can be added later by setting `price: { amount, period }` on a tier in `pricing.tiers`. Tiers without a price show `priceLabel`.

## Backend API

The API lives in `app/api/` as Route Handlers and is served by the same dev server as the site.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Liveness check. Useful for confirming the backend is reachable |
| `POST` | `/api/auth/sign-up` | Creates an account and signs the new user in. `409` if the email is taken |
| `POST` | `/api/auth/sign-in` | Verifies credentials and starts a session. `401` on bad credentials |
| `POST` | `/api/auth/sign-out` | Deletes the session row and clears the cookie |
| `GET` | `/api/auth/session` | Returns the signed-in account, or `user: null` |
| `POST` | `/api/auth/password-reset` | Accepts a reset request. Always answers the same, so it cannot be used to discover which emails have accounts |
| `GET` | `/api/dashboard/overview` | Live figures for the current workspace: agent, lead, qualified-lead and callback counts plus recent activity |
| `GET` `POST` | `/api/agents` | Lists the workspace's agents, or creates one. `400` on invalid input |
| `GET` `POST` | `/api/leads` | Lists leads, or ingests a lead event. `409` for a replayed delivery, `422` for a lead that cannot be called |
| `GET` `POST` | `/api/campaigns` | Lists bulk campaigns, or creates one. Creating a campaign records it; it does not place calls |
| `PATCH` `DELETE` | `/api/campaigns/[id]` | Updates or removes one campaign |
| `GET` `PUT` | `/api/instant-setup` | Reads or saves the instant-calling configuration |
| `GET` | `/api/webhook-events` | The recent inbound delivery log, newest first |

Every dashboard endpoint is scoped to the current workspace: the signed-in account when there is a session, and one shared development workspace otherwise (`lib/server/workspace.ts`). Turning the gate back on partitions the data without changing a query.

Responses are JSON. Success is `{ ok: true, … }`; failure is `{ ok: false, code, message }`, where `code` is one of `validation_error`, `invalid_credentials`, `email_taken`, `unauthorized`, `bad_request` or `server_error`. The client maps `code` and `message` straight into the form notices, so server-side validation is what the user actually sees.

```bash
# create an account and keep the session cookie
curl -i -c jar.txt -X POST http://localhost:3000/api/auth/sign-up \
  -H 'Content-Type: application/json' \
  -d '{"fullName":"Jane Cooper","email":"jane@acme.com","workspace":"Acme Inc.","password":"strongpass123","acceptedTerms":true}'

# then read the session back
curl -b jar.txt http://localhost:3000/api/auth/session
```

### Security properties

- Passwords are hashed with **scrypt** (`node:crypto`) using a per-user random salt, and compared with `timingSafeEqual`. Plaintext is never stored.
- Sessions are opaque 32-byte random tokens in an **httpOnly**, `SameSite=Lax` cookie (`Secure` in production), valid for 30 days. The database stores only the token's SHA-256 hash, so a leaked datastore does not hand over live sessions.
- Sign-in answers identically for an unknown email and a wrong password, and password reset always answers the same, so neither endpoint reveals which emails are registered.
- Every endpoint re-validates its input; the client-side checks are for feedback only.
- `/dashboard` is **not** gated in this phase: "Start Free" opens the product directly, so the dashboard and its API are reachable without an account and share one development workspace. `app/dashboard/layout.tsx` resolves the session on the server to name the workspace; re-adding a redirect there is what makes the dashboard private again.

### Datastore

Phase 2 persists to a JSON file at `.data/reyvoca.json` (gitignored), so the backend runs with no database to install. All access goes through `read`/`mutate` in `lib/server/db.ts`, which serialises writes and writes atomically via a temp file and rename. Swapping in Postgres or Prisma later means rewriting that one module.

To reset local accounts, delete the file:

```bash
rm -rf .data
```

### Auth service layer

UI components depend only on the `AuthService` interface in `lib/auth/types.ts`. The implementation is chosen in `lib/auth/service.ts`:

- **`NEXT_PUBLIC_API_URL` set (default `/api`):** an HTTP adapter posts to the endpoints above with `credentials: "include"`, and surfaces the server's own error code and message.
- **`NEXT_PUBLIC_API_URL` unset:** every call returns `not_configured`, and the UI says accounts aren't open yet. Nothing pretends to sign in or create an account. This keeps the marketing site deployable without the API.

## Environment variables

See `.env.example`. Copy it to `.env.local` and never commit real values.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical site origin for canonical tags, OpenGraph URLs and the sitemap. Defaults to `http://localhost:3000`. Set it to the production domain when deploying |
| `NEXT_PUBLIC_API_URL` | Base URL of the Reyvoca API. Defaults to the same-origin relative path `/api`, since the backend ships inside this app. Leave empty to run the frontend with no backend |

Phase 2 needs no secrets or provider credentials. Email delivery for password resets arrives with a mail provider in a later phase; until then the request is logged, not sent.

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

- **Phase 2: accounts & workspace.** Authentication, sessions and the backend API are **done**. Still to come: team members, invitations, and moving the datastore to a real database.
- **Phase 3: agents.** Agent builder (instructions, voice, language), provider selection (LLM / STT / TTS), and browser test calls.
- **Phase 4: telephony.** Phone numbers, inbound routing, outbound calls, barge-in and low-latency streaming.
- **Phase 5: knowledge & actions.** Knowledge base ingestion and grounding, tool calls (calendar, CRM, webhooks).
- **Phase 6: campaigns & leads.** Lead uploads, scheduling, calling windows, retries and compliance controls.
- **Phase 7: insight.** Transcripts, recordings, structured outcomes, callbacks and analytics.
- **Phase 8: commercial.** Billing, usage metering, public API and webhooks, status page, legal pages.

---

© 2026 Reyvoca. All rights reserved.

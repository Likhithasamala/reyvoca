# Reyvoca

**AI voice agents for real business conversations.**

### → [View the live site: reyvoca.in](https://reyvoca.in)

Reyvoca is a platform, currently in development, where businesses can create AI voice agents that hold natural phone conversations with customers, ground their answers in business knowledge, take actions in existing tools, and capture a structured outcome for every call.

---

## Current phase: Phase 2 — accounts & workspace

Phase 1 delivered the public website and the frontend architecture. Phase 2 adds the **backend API that the frontend now talks to**: real accounts, password hashing, httpOnly sessions and the operator panel.

The backend runs inside this same Next.js app as Route Handlers under `app/api/`, so `npm run dev` serves the frontend and the API together on one port with no extra service to start.

| Area | Status in Phase 1 |
| --- | --- |
| Marketing homepage (`/`) | Complete. Hero with an animated call simulation, How It Works, Why Reyvoca, Use Cases, platform preview, feature stories, integrations, pricing, FAQ and a final CTA |
| Sign In (`/signin`), Get Started (`/get-started`), Forgot Password (`/forgot-password`) | Working. Sign-up creates a real account, sign-in starts a session, and both validate on the client **and** the server |
| Docs (`/docs`, `/docs/[slug]`) | Docs shell with a sidebar, 9 starter pages, prev/next links and mobile navigation. Pages are driven by config |
| Demo requests (`/requests`) | Where signing in lands: every enquiry from the booking form, newest first, with the contact details to call back |
| Footer pages (`/about`, `/contact`, `/careers`, `/status`, `/privacy`, `/terms`, `/security`) | Placeholder pages with honest copy. No legal text or certifications |
| SEO | Per-page metadata, canonical URLs, OpenGraph and Twitter images, sitemap, robots, JSON-LD (Organization and FAQPage) |

The site does not claim customers, uptime figures or certifications. It describes planned capabilities as planned.

## Technology stack

**Framework**

- **Next.js 16.3.8** (App Router, Turbopack), with every route statically prerendered
- **React 19.2.8** and **TypeScript 5** in `strict` mode
- Node.js 20.9+ (developed on Node 22)

**Styling**

- **Tailwind CSS v4**, with design tokens defined in `app/globals.css` via `@theme`
- **Inter** loaded through `next/font`
- **lucide-react** icons and **motion** for animation — the only runtime UI dependencies

**Data and backend**

- **Neon Postgres** through `@neondatabase/serverless`
- Route Handlers under `app/api/` — the backend ships inside this same app, so
  `npm run dev` serves the site and the API on one port with no extra service
- Sessions are httpOnly cookies; passwords are hashed with Node `crypto` **scrypt**
  and compared with `timingSafeEqual`. No auth library.

**Voice**

- **Sarvam Samvaad** via `sarvam-conv-ai-sdk` for the conversational voice agents

**Tooling**

- **ESLint 9** with `eslint-config-next`
- `npm run typecheck` runs `next typegen && tsc --noEmit`
- A custom SEO gate, `scripts/seo-check.mjs`, wired to a `PostToolUse` hook

Interactivity is kept small. Client components are used only for the hero call simulation, the navbar scroll state, the mobile menu, the forms and the docs active-link state. The FAQ accordion uses native `<details>`, and scroll reveals are CSS-only (`animation-timeline: view()`). Both respect `prefers-reduced-motion`.

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

The public site is the stage and the booking form; there is no self-serve product route. To try the account flow, open http://localhost:3000/get-started and create a workspace — signing in lands on **/requests**, the enquiries waiting to be called back, and you sign out from there.

The signed-in product workspace is not part of the site at the moment. Its code is kept, unbuilt, under `parked/` — see `parked/README.md`.

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
  admin/                Operator panel: providers and billing (404 for everyone else)
  requests/             Demo requests from the booking form (sign-in lands here)
  api/                  Backend Route Handlers
    health/route.ts
    auth/               sign-up, sign-in, sign-out, session, password-reset
    dashboard/overview/ Workspace figures
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
  panel/                Signed-in primitives: MetricCard, DataTable, SectionCard, PageHeader,
                        StatusBadge, DemoTag, EmptyState, Notice, BarChart, SignOutButton
  admin/                AdminShell, ProvidersView, BillingView
  seo/                  JsonLd
config/
  site.ts               Site URL, routes, navigation and footer links
  marketing.ts          All homepage copy, plus alternative taglines
  docs.ts               Docs pages (add an entry to add a page, sidebar and sitemap entry)
  admin-nav.ts          Operator panel navigation
  brand.ts              Brand palette and voice tokens
  info-pages.ts         Footer info pages
lib/
  server/               Backend only — never imported by client components
    db.ts               JSON-file datastore (read / mutate)
    password.ts         scrypt hashing and verification
    session.ts          Session issuing, lookup and teardown
    workspace.ts        Resolves the request's workspace and identity from the session
    overview.ts         Workspace figures, shared by the API route and its callers
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
| `GET` | `/api/engine` | What a signed-in workspace may know about the voice engine: whether conversation, transcription and voice are live, plus the voices and languages on offer. Names no vendor |
| `GET` `POST` | `/api/providers` | **Operators only.** The platform's provider keys (masked), or saves one after verifying it with the provider. `403` for everyone else |
| `DELETE` | `/api/providers/[id]` | **Operators only.** Removes a platform key |

Every workspace endpoint is scoped to the current workspace: the signed-in account when there is a session, and one shared development workspace otherwise (`lib/server/workspace.ts`). Turning the gate back on partitions the data without changing a query.

Responses are JSON. Success is `{ ok: true, … }`; failure is `{ ok: false, code, message }`, where `code` is one of `validation_error`, `invalid_credentials`, `email_taken`, `unauthorized`, `forbidden`, `bad_request` or `server_error`. The client maps `code` and `message` straight into the form notices, so server-side validation is what the user actually sees.

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
- `/requests` requires a session and redirects to `/signin` without one. `/admin` answers **404** to anyone who is not an operator, so customers never learn the panel exists, and the provider API re-checks on every call. The workspace API still shares one development workspace when there is no session (`lib/server/workspace.ts`).

### The engine, and who may see it

Which vendors serve speech, transcription and intelligence is a Reyvoca operations concern, not a customer-facing feature. Customers choose a voice, the languages and how the agent behaves; everything else is resolved on the server.

- **Customers** read `/api/engine`, which answers with capability flags, voices and languages — never a provider name. Agent configs leave the API with their engine fields blanked (`hideEngine` in `lib/server/engine.ts`), and `/api/agents/preview` and `/api/agents/speak` ignore any provider the browser tries to send and resolve it themselves (`resolveEngine`).
- **Operators** work in the panel at `/admin`: `/admin` shows what every call currently runs on, `/admin/providers` manages the keys. Access is decided by `lib/server/admin.ts` and enforced in `app/admin/layout.tsx` (a non-operator gets a 404, not a redirect) and again on every provider endpoint.
- **Provider keys** are the platform's, saved under one shared workspace (`PLATFORM_WORKSPACE_ID`), so one change applies to every customer. A key saved against a specific workspace still wins for that workspace, which is how an enterprise brings its own.

Who counts as an operator: an account whose stored `role` is `admin`, or whose email is listed in `REYVOCA_ADMIN_EMAILS`. In development with that variable unset, the panel is open to the local machine so the stack can be configured before the first account exists. In production with it unset, nobody can reach it.

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
| `REYVOCA_ADMIN_EMAILS` | Comma-separated emails allowed into the operator panel at `/admin`, where the provider stack is configured. Unset in development the panel is open locally; unset in production it is closed to everyone |

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

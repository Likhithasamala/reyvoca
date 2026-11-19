# Parked code

Nothing in this folder is part of the app. It is excluded from TypeScript
(`tsconfig.json` → `exclude`) and from ESLint (`eslint.config.mjs` →
`globalIgnores`), and it sits outside `app/`, so Next.js builds no routes from
it. It exists so work that has been taken off the site is not lost.

---

## `dashboard/` — the signed-in agent workspace

Removed from the site on **2026-11-14**. The public site is the stage plus the
booking form; the workspace had no public entrance left, so it was taken out of
the build rather than left reachable at a URL.

It was the full customer product: a framed sidebar shell with a workspace menu
and global search, and a route per section. Everything read the live API under
`app/api/` (agents, leads, campaigns, calls, billing, engine), with clearly
labelled sample data as the fallback for a workspace that had nothing stored
yet. It never named a vendor — the engine showed as live or pending, and the
provider keys stayed in the operator panel at `/admin`.

### Sidebar, exactly as it shipped

| Group | Items |
| --- | --- |
| Overview | Dashboard (`/dashboard`), My Agents (`/dashboard/agents`), Create Agent (`/dashboard/agents/create`) |
| Calling | Instant Leads (`/dashboard/calling/instant`), Bulk Campaigns (`/dashboard/calling/bulk`), Inbound (`/dashboard/calling/inbound`) |
| Results & Setup | Leads & Results (`/dashboard/results`), Phone Numbers (`/dashboard/phone-numbers`), Performance (`/dashboard/performance`), Usage & Billing (`/dashboard/billing`), Settings (`/dashboard/settings`) |

Three routes had no sidebar entry of their own: `/dashboard/agents/[id]` (agent
detail, reached from My Agents), `/dashboard/calling/bulk/new` and
`/dashboard/calling/bulk/[id]`, plus `/dashboard/conversations` and
`/dashboard/train`, which were still placeholders. `/dashboard/providers`
existed only to redirect operators to `/admin/providers`.

### What is here

```
dashboard/
  app/dashboard/        Every route: layout.tsx (resolved the workspace from the
                        session), page.tsx and one folder per section
  components/dashboard/ The chrome and the screens:
                        dashboard-shell, sidebar-nav, topbar, workspace-menu,
                        global-search, getting-started-card, agent-card,
                        stat-card, recent-calls-table, weekly-calls-chart,
                        conversation-replay, outcome-badge
    agents/             agent-editor, test-chat, web-call, samvaad-call
    calling/            campaign wizard, CSV upload + column mapper, webhook
                        setup, live call queue, activity feed, post-call actions
    views/              The page-level views: my-agents, agent-detail,
                        create-agent, instant-leads, bulk-campaigns,
                        campaign-detail, results, conversations, billing, settings
  config/               dashboard-nav.ts (sidebar source of truth),
                        dashboard-demo.ts (sample rows), dashboard.ts (unused
                        marketing-side preview data)
```

### Restoring it

1. `cp -r parked/dashboard/app/dashboard app/dashboard`
2. `cp -r parked/dashboard/components/dashboard components/dashboard`
3. `cp parked/dashboard/config/*.ts config/`
4. Add the route and the nav entry back to `config/site.ts`
   (`dashboard: "/dashboard"`, and a `mainNav` item if it should be linked).
5. Re-add `"/dashboard"` to the `disallow` list in `app/robots.ts`.

The shared primitives these files import (`MetricCard`, `DataTable`,
`PageHeader`, `StatusBadge`, `SectionCard`, `EmptyState`, `Notice`, `DemoTag`,
`BarChart`, `Action`, `Field`, `SectionTabs`, `SearchFilterBar`,
`SignOutButton`) were **not** parked. They moved to `components/panel/`, where
the operator panel and `/requests` still use them, and the imports in here
already point at that path, so a restore needs no edits.

Nothing was removed from `app/api/`, `lib/` or `types/`: the endpoints the
workspace read are all still live, including `GET /api/dashboard/overview`.

---

## `proxy.ts` — the edge route guard

Taken out of the build on **2026-11-19**, to deploy on Netlify.

Next.js 16 renamed Middleware to Proxy and pinned it to the **Node.js
runtime**; the docs are explicit that "the `runtime` config option is not
available in Proxy files. Setting the `runtime` config option in Proxy will
throw an error." Netlify bundles that handler into a Deno edge function, and
the Node build of it imports `node:fs`, which the edge runtime does not
provide — Netlify's own Next.js docs list filesystem access as unsupported in
Node middleware. The deploy failed at "Bundling of edge function" with
`Could not load edge function`. No configuration avoids it, so the file came
out.

**No security changed.** The proxy was always optimistic by design: it asked
whether a session *cookie* was present, never whether it was valid, because it
ran on every request including prefetches and so could not touch the database.
Its own comment said so — "The real locks are `requireUser()` in
`lib/server/session.ts` and the `redirect()` in each protected page; this only
saves a render and keeps the URL tidy." Those locks were verified still in
place before it was removed:

| Surface | Enforced by |
| --- | --- |
| `/requests` | `getSessionUser()` then `redirect()` in the page |
| `/account` | `redirect()` to sign-in, carrying `next` |
| `/admin/*` | `notFound()` in `app/admin/layout.tsx` |
| `app/api/*` | `requireUser()` → 401 |

What it did do is now in `lib/server/page-guards.ts`, called from the four
pages that need it. The guards are in fact *stricter* than the proxy was: they
resolve a real session instead of sniffing for a cookie.

Next's own guidance points the same way: "We recommend users avoid relying on
Proxy unless no other options exist. Always verify authentication and
authorization inside each Server Function rather than relying on Proxy alone."

Restoring it would mean moving this file back to the repo root — and moving
hosting to a platform that runs Node middleware natively.

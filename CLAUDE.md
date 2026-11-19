@AGENTS.md

# SEO is automatic — never ask, never wait to be told

The user has asked once that SEO be handled on every change and has said
explicitly they will not repeat it. So:

**Load `.claude/skills/seo/SKILL.md` and apply it whenever you write or change
any user-visible text, add a page or route, add a feature, or touch
navigation, metadata, headings, links or images.** Do this on your own
initiative. Do not ask permission and do not report it as an extra.

**`node scripts/seo-check.mjs` must be clean before you call a task done.**
A `PostToolUse` hook (`.claude/settings.json`) runs it after every Write/Edit
and feeds any finding straight back to you — fix it in the same turn.

Run `npm run seo:live` with the dev server up before shipping: it crawls the
sitemap and checks what is actually served (title, description, canonical,
one `<h1>`, `og:image`, JSON-LD, and that nothing in the sitemap 404s or is
`noindex`).

Two rules worth repeating here because getting them wrong is expensive:

- `/admin`, `/account`, `/requests` and the password/verify flows render real
  customer data. They must be **both** `noindex` **and** disallowed in
  `app/robots.ts`. Keep that list in step with `PRIVATE` in the check script.
- Metadata merges **shallowly** from the root segment down; a key set in a
  layout survives unless a page sets that same key. `app/admin/layout.tsx`
  already sets `robots` for everything beneath it — don't let a page redefine
  `robots` and silently drop the protection.

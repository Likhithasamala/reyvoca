#!/usr/bin/env node
/**
 * Reyvoca SEO gate.
 *
 * Two modes:
 *   node scripts/seo-check.mjs            static source checks (fast, used by the Claude hook)
 *   node scripts/seo-check.mjs --live     also crawls the running dev server and checks rendered HTML
 *   node scripts/seo-check.mjs --file <p> only report findings for one file (hook uses this)
 *
 * Exit code 1 on any ERROR. WARN never fails the build.
 *
 * This file is the machine-checkable half of the SEO policy. The judgement half
 * — what a title should actually say, which page deserves to exist, how pages
 * link to each other — lives in .claude/skills/seo/SKILL.md.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const args = process.argv.slice(2);
const LIVE = args.includes("--live");
const HOOK = args.includes("--hook");
const BASE = process.env.SEO_CHECK_URL || "http://localhost:3000";

/**
 * In --hook mode the Claude Code PostToolUse payload arrives on stdin. Reading
 * it here rather than piping through jq keeps the hook working on Windows,
 * where jq is usually absent.
 */
async function hookTarget() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  try {
    const payload = JSON.parse(Buffer.concat(chunks).toString() || "{}");
    return payload.tool_input?.file_path || payload.tool_response?.filePath || null;
  } catch {
    return null;
  }
}

let ONLY = args.includes("--file") ? args[args.indexOf("--file") + 1] : null;
if (HOOK) {
  ONLY = await hookTarget();
  // Only source that can carry SEO meaning is worth a pass.
  if (!ONLY || !/[\\/](app|components|config)[\\/].*\.(tsx|ts)$/.test(ONLY)) process.exit(0);
}

/** Routes that must never be indexed: operator consoles and signed-in surfaces. */
const PRIVATE = ["/admin", "/account", "/dashboard", "/requests", "/get-started", "/forgot-password", "/reset-password", "/verify-email"];

/** SERP truncation limits. Titles include the " · Reyvoca" suffix the template adds. */
const TITLE_MAX = 60;
const DESC_MIN = 70;
const DESC_MAX = 160;
const SUFFIX = " · Reyvoca";

const findings = [];
const add = (level, file, msg, fix) => findings.push({ level, file, msg, fix });
const err = (f, m, fix) => add("ERROR", f, m, fix);
const warn = (f, m, fix) => add("WARN", f, m, fix);

// ---------------------------------------------------------------- discovery

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === "parked" || name.startsWith(".")) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

/** app/(marketing)/industries/[slug]/page.tsx -> /industries/[slug] */
function routeOf(file) {
  const rel = relative(join(ROOT, "app"), file).split(sep).slice(0, -1);
  const segs = rel.filter((s) => !(s.startsWith("(") && s.endsWith(")")));
  return "/" + segs.join("/");
}

const isPrivate = (route) => PRIVATE.some((p) => route === p || route.startsWith(p + "/"));

/** Either form of "keep this out of the index". */
const declaresNoIndex = (src) => /noIndex:\s*true/.test(src) || /robots:\s*\{[^}]*index:\s*false/s.test(src);

/**
 * Metadata is merged shallowly from the root segment down, and a key set in a
 * layout survives unless the page sets that same key (verified against
 * next/dist/docs generate-metadata.md "Merging"). So a page is non-indexable
 * if it, or any layout above it, declares robots — and a page that sets its
 * own `robots` overrides the layout, which is worth knowing about.
 */
function noIndexChain(file) {
  let dir = join(file, "..");
  const appDir = join(ROOT, "app");
  while (dir.startsWith(appDir)) {
    const layout = join(dir, "layout.tsx");
    try {
      if (declaresNoIndex(readFileSync(layout, "utf8"))) return relative(ROOT, layout);
    } catch {}
    if (dir === appDir) break;
    dir = join(dir, "..");
  }
  return null;
}

const allFiles = walk(join(ROOT, "app")).concat(walk(join(ROOT, "components")));
const pages = walk(join(ROOT, "app")).filter((f) => f.endsWith(`${sep}page.tsx`));

// ------------------------------------------------------------ static checks

const titles = new Map();
const descriptions = new Map();

for (const file of pages) {
  const src = readFileSync(file, "utf8");
  const route = routeOf(file);
  const rel = relative(ROOT, file);

  // 1. Every route must declare metadata. Without it a page inherits the
  //    site-wide title and competes with its own siblings in search.
  if (!/export\s+(const\s+metadata|async\s+function\s+generateMetadata)/.test(src)) {
    // A private route inherits its layout's title and robots, and is never
    // indexed, so it owes search nothing of its own.
    if (!isPrivate(route)) {
      err(rel, `${route} exports no metadata`, "add `export const metadata = pageMetadata({ title, description, path })`");
    }
    continue;
  }

  // 2. Private surfaces must be noIndex. A leaked operator console is the
  //    single most expensive SEO mistake a product site can make.
  const inheritedNoIndex = noIndexChain(file);
  if (isPrivate(route) && !declaresNoIndex(src) && !inheritedNoIndex) {
    err(rel, `${route} is a private route but is indexable`, "pass `noIndex: true` to pageMetadata(), or set robots on its layout");
  }
  if (!isPrivate(route) && declaresNoIndex(src) && route !== "/signin") {
    warn(rel, `${route} is noIndex but is not a known private route`, "confirm this page should be hidden from search");
  }

  // 3. The canonical path must match the route it is declared on, or two URLs
  //    claim the same canonical and one of them stops ranking.
  const path = src.match(/path:\s*(?:routes\.(\w+)|["'`]([^"'`]+)["'`])/);
  if (path?.[2] && !route.includes("[") && path[2] !== route) {
    err(rel, `canonical "${path[2]}" does not match route ${route}`, `set path to "${route}"`);
  }

  // 4. SERP lengths. Only literal strings can be measured here; anything
  //    built from config is checked in --live mode against the rendered head.
  const title = src.match(/title:\s*["'`]([^"'`]+)["'`]/);
  if (title) {
    const full = title[1] + SUFFIX;
    if (full.length > TITLE_MAX) {
      warn(rel, `title "${full}" is ${full.length} chars (>${TITLE_MAX}, truncates in search)`, "shorten the title");
    }
    const seen = titles.get(title[1]);
    if (seen) err(rel, `duplicate title "${title[1]}" (also in ${seen})`, "give each page a distinct title");
    else titles.set(title[1], rel);
  }

  // Any literal description, however short — a 5-char one is the bug, not an
  // exemption. A page with no literal description inherits the site default,
  // which makes it a duplicate of every other such page.
  const desc = src.match(/description:\s*["'`]([^"'`]*)["'`]/);
  // A description built from a variable or generateMetadata can't be measured
  // here — only its absence is a static fact. Its length is checked for real
  // against the rendered head in --live.
  // The homepage is the one page whose description *should* be the site
  // description — it is not duplicating a sibling, it is the original.
  if (!/description:/.test(src) && !isPrivate(route) && route !== "/") {
    warn(rel, `${route} has no description of its own`, "it will inherit the site default and duplicate its siblings");
  }
  if (desc && !isPrivate(route)) {
    const d = desc[1];
    if (d.length > DESC_MAX) warn(rel, `description is ${d.length} chars (>${DESC_MAX}, truncates)`, "tighten it");
    if (d.length < DESC_MIN) warn(rel, `description is ${d.length} chars (<${DESC_MIN}, wastes the snippet)`, "say more about the page");
    const seen = descriptions.get(d);
    if (seen) err(rel, `duplicate description (also in ${seen})`, "write a distinct description");
    else descriptions.set(d, rel);
  }
}

// 5. robots.txt must disallow every private prefix, belt-and-braces with noIndex.
const robotsPath = join(ROOT, "app", "robots.ts");
try {
  const robots = readFileSync(robotsPath, "utf8");
  for (const p of PRIVATE) {
    if (!robots.includes(`"${p}"`) && !robots.includes(`'${p}'`)) {
      err("app/robots.ts", `${p} is not in the robots disallow list`, `add "${p}" to disallow`);
    }
  }
} catch {
  err("app/robots.ts", "missing robots.ts", "add a robots route");
}

// 5b. A URL cannot be both advertised in the sitemap and disallowed in
//     robots.txt. Search Console reports it as "Indexed, though blocked", and
//     the page ends up with a title and no snippet. One of the two is wrong.
try {
  const robots = readFileSync(robotsPath, "utf8");
  const sitemapSrc = readFileSync(join(ROOT, "app", "sitemap.ts"), "utf8");
  const disallowed = [...robots.matchAll(/["']([/][^"']*)["']/g)].map((m) => m[1]).filter((p) => p !== "/");
  for (const p of disallowed) {
    // Private routes are the worst case, not an exemption: a disallowed URL
    // sitting in the sitemap is a defect whether or not it is also noindex.
    const key = p.replace(/^\//, "").replace(/\/$/, "");
    if (key && new RegExp(`routes\\.${key.replace(/-(\w)/g, (_, c) => c.toUpperCase())}\\b|["']${p}["']`).test(sitemapSrc)) {
      err(
        "app/robots.ts",
        `${p} is disallowed in robots.txt but listed in the sitemap`,
        `decide which it is: drop it from app/sitemap.ts, or stop disallowing it`,
      );
    }
  }
} catch {}

// 6. Accessible names double as SEO signals: an image with no alt is invisible
//    to both a screen reader and an image crawler.
for (const file of allFiles) {
  if (!/\.(tsx|jsx)$/.test(file)) continue;
  const src = readFileSync(file, "utf8");
  const rel = relative(ROOT, file);

  for (const tag of src.matchAll(/<(img|Image)\s([^>]*?)\/?>/gs)) {
    if (!/\balt\s*=/.test(tag[2])) {
      err(rel, `<${tag[1]}> without alt`, 'add alt="…", or alt="" if the image is decorative');
    }
  }

  // 7. One h1 per document. Two h1s split the page's topical signal.
  // Counting per file is only a hint: a step wizard or a tab panel can hold
  // several h1s of which exactly one ever renders. --live counts the h1s in
  // the served document, which is the answer that actually matters, so this
  // one warns and that one fails.
  const h1s = [...src.matchAll(/<h1[\s>]/g)].length;
  if (h1s > 1) warn(rel, `${h1s} <h1> elements in one file`, "fine if only one renders at a time; otherwise demote the rest to h2");

  // 8. A link whose text is "here"/"read more" passes no anchor signal.
  for (const a of src.matchAll(/<Link[^>]*>\s*([A-Za-z ]{2,24}?)\s*<\/Link>/g)) {
    if (/^(here|click here|read more|learn more|this|link)$/i.test(a[1].trim())) {
      warn(rel, `non-descriptive link text "${a[1].trim()}"`, "say what the destination is");
    }
  }
}

// -------------------------------------------------------------- live checks

if (LIVE) {
  const get = async (url) => {
    const res = await fetch(url, { redirect: "follow" });
    return { status: res.status, body: await res.text() };
  };

  try {
    const { body: xml } = await get(`${BASE}/sitemap.xml`);
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    if (!urls.length) err("app/sitemap.ts", "sitemap is empty", "check the sitemap route");

    // Every public page file should appear in the sitemap, or it is orphaned.
    const listed = new Set(urls.map((u) => new URL(u).pathname.replace(/\/$/, "") || "/"));
    for (const file of pages) {
      const route = routeOf(file);
      if (route.includes("[") || isPrivate(route)) continue;
      if (!listed.has(route)) {
        warn(relative(ROOT, file), `${route} is not in the sitemap`, "add it to app/sitemap.ts");
      }
    }

    for (const url of urls) {
      const path = new URL(url).pathname;
      const { status, body } = await get(`${BASE}${path}`);
      const at = `rendered ${path}`;

      if (status !== 200) {
        err(at, `sitemap lists ${path} but it returns ${status}`, "remove it from the sitemap or fix the route");
        continue;
      }

      const title = body.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
      if (!title) err(at, "no <title>", "add metadata");
      else if (title.length > TITLE_MAX) warn(at, `title is ${title.length} chars`, "shorten it");

      const desc = body.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "";
      if (!desc) err(at, "no meta description", "add one");

      const canonical = body.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
      if (!canonical) err(at, "no canonical link", "set alternates.canonical");
      else if (new URL(canonical).pathname.replace(/\/$/, "") !== path.replace(/\/$/, "")) {
        err(at, `canonical points at ${canonical}, not ${path}`, "fix the canonical path");
      }

      const h1 = [...body.matchAll(/<h1[\s>]/g)].length;
      if (h1 === 0) err(at, "no <h1>", "every indexable page needs one");
      if (h1 > 1) err(at, `${h1} <h1> elements`, "keep exactly one");

      if (!/property="og:image"/.test(body)) warn(at, "no og:image", "shares will render bare");
      if (/<meta name="robots" content="[^"]*noindex/.test(body) && !isPrivate(path)) {
        err(at, "public page is noindex but sits in the sitemap", "remove noIndex or drop it from the sitemap");
      }
    }

    const { body: home } = await get(BASE);
    if (!/application\/ld\+json/.test(home)) {
      warn("rendered /", "no JSON-LD on the homepage", "add Organization/WebSite structured data");
    }
  } catch (e) {
    warn("--live", `dev server unreachable at ${BASE} (${e.message})`, "start `npm run dev`, or omit --live");
  }
}

// ------------------------------------------------------------------- report

const norm = (p) => p.replace(/\\/g, "/").toLowerCase();
const shown = ONLY
  ? findings.filter((f) => norm(join(ROOT, f.file)) === norm(ONLY))
  : findings;
const errors = shown.filter((f) => f.level === "ERROR");
const warns = shown.filter((f) => f.level === "WARN");
const line = (f) => `${f.level === "ERROR" ? "✗" : "!"} ${f.file}: ${f.msg} → ${f.fix}`;

if (HOOK) {
  // Non-blocking: the edit already succeeded. The findings are injected back
  // into Claude's context so the SEO fix happens in the same turn, which is
  // the whole point of the automation — nobody has to ask for it.
  if (shown.length) {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PostToolUse",
          additionalContext:
            `SEO gate on ${relative(ROOT, ONLY)}:\n${shown.map(line).join("\n")}\n` +
            `Fix these now, per .claude/skills/seo/SKILL.md, before continuing.`,
        },
        suppressOutput: true,
      }),
    );
  }
  process.exit(0);
}

for (const f of shown) console.log(`${f.level === "ERROR" ? "✗" : "!"} ${f.file}\n    ${f.msg}\n    → ${f.fix}`);

if (!shown.length) {
  console.log(ONLY ? "SEO: clean" : `SEO: clean — ${pages.length} routes checked`);
} else {
  console.log(`\nSEO: ${errors.length} error(s), ${warns.length} warning(s)${ONLY ? "" : ` across ${pages.length} routes`}`);
}

process.exit(errors.length ? 1 : 0);

/**
 * Redirect guards for pages, replacing what `proxy.ts` used to do at the edge.
 *
 * Next.js 16 renamed Middleware to Proxy and pinned it to the Node.js runtime
 * — the `runtime` config option throws if you set it. Netlify bundles that
 * handler into a Deno edge function, and the Node build pulls in `node:fs`,
 * which the edge runtime does not provide, so the function cannot load and
 * the deploy fails. There is no configuration that avoids this, so the guards
 * moved here.
 *
 * Nothing about security changed. The proxy was always optimistic: it asked
 * whether a session *cookie* was present, never whether it was valid, because
 * it ran on every request including prefetches and so could not touch the
 * database. The real locks are, and always were, `requireUser()` for API
 * routes and the `redirect()` / `notFound()` in each protected page. These
 * helpers only restore the tidy-URL behaviour, and unlike the proxy they
 * check a real session rather than the mere presence of a cookie.
 *
 * Next's own guidance now points the same way: "Always verify authentication
 * and authorization inside each Server Function rather than relying on Proxy
 * alone."
 *
 * Page use only. `redirect()` throws a control-flow signal that a route
 * handler would surface as an error rather than a 302, so API routes keep
 * using `requireUser()`.
 */
import { redirect } from "next/navigation";
import { routes } from "@/config/site";
import { getSessionUser } from "./session";

/**
 * Sends a signed-in visitor away from a page that only makes sense signed
 * out — the sign-in, sign-up and forgot-password screens.
 */
export async function redirectIfSignedIn(to: string = routes.requests): Promise<void> {
  if (await getSessionUser()) redirect(to);
}

/**
 * Sends a signed-out visitor to sign in, remembering where they were headed
 * so signing in finishes the journey instead of dumping them on the default
 * page.
 */
export async function requireSignedIn(returnTo: string): Promise<void> {
  if (await getSessionUser()) return;
  redirect(`${routes.signIn}?next=${encodeURIComponent(returnTo)}`);
}

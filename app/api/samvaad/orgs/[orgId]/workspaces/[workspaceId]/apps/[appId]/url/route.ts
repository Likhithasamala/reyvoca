import { read } from "@/lib/server/db";
import { jsonError } from "@/lib/server/http";
import { balanceOf, customerRatePaise, pricingOf } from "@/lib/server/billing";
import { requestSignedUrl, samvaadConfig } from "@/lib/server/samvaad";
import { currentWorkspace } from "@/lib/server/workspace";

/** Query parameters the SDK sends; anything else is dropped. */
const FORWARDED_PARAMS = ["interaction_type", "version"];

/**
 * GET /api/samvaad/orgs/:org/workspaces/:ws/apps/:app/url
 *
 * The Sarvam browser SDK calls this path (its `baseUrl` points here) to get a
 * signed WebSocket URL. The route adds the API key server-side and only ever
 * signs for the one configured agent, so the key cannot be used for anything
 * else through it. The WebSocket itself then goes straight to Sarvam.
 */
export async function GET(
  request: Request,
  ctx: RouteContext<"/api/samvaad/orgs/[orgId]/workspaces/[workspaceId]/apps/[appId]/url">,
) {
  const config = samvaadConfig();
  if (!config) return jsonError("server_error", "Web calls are not configured yet.", 503);

  // Calls cost money: in production only signed-in accounts may start one.
  const { id: reyvocaWorkspaceId, user } = await currentWorkspace();
  if (!user && process.env.NODE_ENV === "production") {
    return jsonError("unauthorized", "Sign in to start a web call.", 401);
  }

  const { orgId, workspaceId, appId } = await ctx.params;
  if (orgId !== config.orgId || workspaceId !== config.workspaceId || appId !== config.appId) {
    return jsonError("forbidden", "That agent is not available.", 403);
  }

  // Calls are prepaid: a wallet that cannot cover a minute gets no session,
  // even if the browser skipped POST /api/calls/web.
  const affordable = await read((db) => balanceOf(db, reyvocaWorkspaceId) >= customerRatePaise(pricingOf(db)));
  if (!affordable) return jsonError("insufficient_credits", "Not enough credits for a call.", 402);

  const incoming = new URL(request.url).searchParams;
  const outgoing = new URLSearchParams();
  for (const key of FORWARDED_PARAMS) {
    const value = incoming.get(key);
    if (value) outgoing.set(key, value);
  }
  const search = outgoing.size ? `?${outgoing.toString()}` : "";

  try {
    const upstream = await requestSignedUrl(config, search);
    // Status and body pass through so the SDK's own error handling applies.
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
    });
  } catch {
    return jsonError("server_error", "Could not reach the voice service. Try again.", 502);
  }
}

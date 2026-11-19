/**
 * The session cookie's name, alone in its own module.
 *
 * `proxy.ts` needs this name and nothing else. Importing it from
 * `lib/server/session.ts` would drag the whole session layer — node:crypto,
 * next/headers, the file-backed store — into the proxy bundle, which runs on
 * every single request. A leaf module with one constant keeps that boundary
 * honest.
 */
export const SESSION_COOKIE = "reyvoca_session";

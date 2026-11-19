/**
 * Google sign-in, by the book: OAuth 2.0 authorization code flow with PKCE.
 *
 * How it hangs together, because the moving parts only make sense together:
 *
 *  1. `/api/auth/google/start` mints three random values — `state`, `nonce`
 *     and a PKCE `code_verifier` — keeps them in a short-lived httpOnly
 *     cookie, and sends the browser to Google with their fingerprints.
 *  2. Google authenticates the person and redirects back with a one-time
 *     `code` and the same `state`.
 *  3. `/api/auth/google/callback` checks `state` matches the cookie (that is
 *     the CSRF defence: a code Google issued for someone else's flow will not
 *     have it), then trades the code for tokens, proving it is the same
 *     client by sending the original `code_verifier`.
 *  4. The `id_token` that comes back says who the person is. `nonce` ties it
 *     to step 1, so a token captured from another flow cannot be replayed.
 *
 * On signature verification: the `id_token` here arrives directly from
 * Google's token endpoint over TLS, in exchange for our client secret — not
 * via the browser. Google's own documentation says a token obtained that way
 * can be trusted without verifying its signature, so the checks below are the
 * ones that matter in this flow: issuer, audience, expiry and nonce.
 */
import { createHash, randomBytes } from "node:crypto";

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

/** Where Google sends the browser back. Must match the console exactly. */
export const GOOGLE_CALLBACK_PATH = "/api/auth/google/callback";

/** The cookie holding the in-flight flow. Ten minutes is ample. */
export const OAUTH_COOKIE = "reyvoca_oauth";
export const OAUTH_COOKIE_MAX_AGE = 10 * 60;

export const googleConfigured = (): boolean =>
  Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

const base64url = (input: Buffer): string => input.toString("base64url");

export type OAuthFlow = {
  state: string;
  nonce: string;
  codeVerifier: string;
  /** Where to land the user once they are signed in. */
  next: string;
};

/** Fresh random values for one sign-in attempt. */
export function startFlow(next: string): OAuthFlow {
  return {
    state: base64url(randomBytes(24)),
    nonce: base64url(randomBytes(24)),
    // PKCE requires 43–128 characters; 32 random bytes base64url is 43.
    codeVerifier: base64url(randomBytes(32)),
    next,
  };
}

/** The URL to send the browser to. */
export function authorizeUrl(flow: OAuthFlow, redirectUri: string): string {
  const challenge = base64url(createHash("sha256").update(flow.codeVerifier).digest());
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: flow.state,
    nonce: flow.nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
    // Always offer the account chooser: people have more than one Google
    // account, and silently reusing the last one is how you end up with a
    // workspace under the wrong address.
    prompt: "select_account",
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

export type GoogleIdentity = {
  /** Google's stable id for the account. The thing to store, not the email. */
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
};

type TokenResponse = { id_token?: string; error?: string; error_description?: string };

type IdTokenClaims = {
  iss?: string;
  aud?: string;
  exp?: number;
  sub?: string;
  email?: string;
  email_verified?: boolean | string;
  name?: string;
  picture?: string;
  nonce?: string;
};

/** Reads a JWT's payload. No signature check — see the note at the top. */
function decodeClaims(idToken: string): IdTokenClaims | null {
  const payload = idToken.split(".")[1];
  if (!payload) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as IdTokenClaims;
  } catch {
    return null;
  }
}

export type ExchangeResult =
  | { ok: true; identity: GoogleIdentity }
  | { ok: false; reason: string };

/**
 * Trades the authorization code for an identity, validating every claim that
 * this flow relies on.
 */
export async function exchangeCode(
  code: string,
  flow: OAuthFlow,
  redirectUri: string,
): Promise<ExchangeResult> {
  let tokens: TokenResponse;
  try {
    const response = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code_verifier: flow.codeVerifier,
      }),
    });
    tokens = (await response.json()) as TokenResponse;
    if (!response.ok) {
      return { ok: false, reason: tokens.error_description ?? tokens.error ?? "Google rejected the sign-in." };
    }
  } catch {
    return { ok: false, reason: "Could not reach Google. Try again." };
  }

  if (!tokens.id_token) return { ok: false, reason: "Google did not return an identity token." };

  const claims = decodeClaims(tokens.id_token);
  if (!claims) return { ok: false, reason: "Google's identity token could not be read." };

  const issuerOk = claims.iss === "accounts.google.com" || claims.iss === "https://accounts.google.com";
  if (!issuerOk) return { ok: false, reason: "That identity token was not issued by Google." };
  if (claims.aud !== process.env.GOOGLE_CLIENT_ID) {
    return { ok: false, reason: "That identity token was issued for a different app." };
  }
  if (!claims.exp || claims.exp * 1000 <= Date.now()) {
    return { ok: false, reason: "That sign-in took too long. Try again." };
  }
  // Ties this token to the request we started: a replayed token fails here.
  if (claims.nonce !== flow.nonce) {
    return { ok: false, reason: "That sign-in could not be matched to this browser. Try again." };
  }
  if (!claims.sub || !claims.email) {
    return { ok: false, reason: "Google did not share an email address." };
  }

  // Google sends this as a boolean or the string "true" depending on the path.
  const emailVerified = claims.email_verified === true || claims.email_verified === "true";
  if (!emailVerified) {
    return { ok: false, reason: "That Google account has an unconfirmed email address." };
  }

  return {
    ok: true,
    identity: {
      sub: claims.sub,
      email: claims.email.toLowerCase(),
      emailVerified,
      name: claims.name?.trim() || claims.email.split("@")[0] || "Reyvoca user",
      picture: claims.picture,
    },
  };
}

/**
 * A sensible workspace name for an account Google created for us.
 *
 * The company domain is the best guess available, and free-mail domains are
 * no guess at all — those get the person's own name instead, which they can
 * change on the account page.
 */
const FREE_MAIL = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "yahoo.com",
  "yahoo.co.in",
  "icloud.com",
  "proton.me",
  "protonmail.com",
  "rediffmail.com",
]);

export function workspaceNameFor(identity: GoogleIdentity): string {
  const domain = identity.email.split("@")[1]?.toLowerCase() ?? "";
  if (!domain || FREE_MAIL.has(domain)) {
    const first = identity.name.split(/\s+/)[0] ?? "My";
    return `${first}'s workspace`;
  }
  const bare = domain.split(".")[0] ?? domain;
  return bare.charAt(0).toUpperCase() + bare.slice(1);
}

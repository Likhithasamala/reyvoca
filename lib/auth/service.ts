import type { AuthErrorCode, AuthResult, AuthService } from "./types";

const NOT_CONFIGURED: AuthResult = {
  ok: false,
  code: "not_configured",
  message:
    "Reyvoca accounts aren't open yet. Authentication will be enabled once the platform backend is live.",
};

/**
 * Fallback when NEXT_PUBLIC_API_URL is unset: no backend to talk to, so every
 * call says so honestly instead of pretending an account was created.
 */
const unconfiguredAuthService: AuthService = {
  signIn: async () => NOT_CONFIGURED,
  signUp: async () => NOT_CONFIGURED,
  requestPasswordReset: async () => NOT_CONFIGURED,
  signOut: async () => NOT_CONFIGURED,
};

/** Error codes the API may return that map straight onto an AuthErrorCode. */
const PASSTHROUGH_CODES = new Set<string>(["invalid_credentials", "email_taken", "validation_error"]);

/** Adapter for the Reyvoca API (see `app/api/auth/*` for the local backend). */
function createHttpAuthService(baseUrl: string): AuthService {
  async function post(path: string, body?: unknown): Promise<AuthResult> {
    let response: Response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Same-origin by default, but kept explicit so the session cookie is
        // still sent if the API is ever hosted on another origin.
        credentials: "include",
        body: JSON.stringify(body ?? {}),
      });
    } catch {
      return {
        ok: false,
        code: "network_error",
        message: "We couldn't reach Reyvoca. Check your connection and try again.",
      };
    }

    const payload = (await response.json().catch(() => null)) as
      | { code?: string; message?: string; redirectTo?: string }
      | null;

    if (response.ok) {
      return { ok: true, redirectTo: payload?.redirectTo };
    }

    // Prefer the server's own code and message so validation and conflict
    // errors reach the user instead of a generic failure.
    const code: AuthErrorCode =
      payload?.code && PASSTHROUGH_CODES.has(payload.code)
        ? (payload.code as AuthErrorCode)
        : response.status === 401
          ? "invalid_credentials"
          : "unknown";

    return {
      ok: false,
      code,
      message: payload?.message ?? "Something went wrong. Please try again.",
    };
  }

  return {
    signIn: (input) => post("/auth/sign-in", input),
    signUp: (input) => post("/auth/sign-up", input),
    requestPasswordReset: (input) => post("/auth/password-reset", input),
    signOut: () => post("/auth/sign-out"),
  };
}

/**
 * Base URL of the Reyvoca API. The bundled backend runs in this same app, so
 * the default local value is the relative path `/api`.
 */
const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

export const authService: AuthService = apiUrl ? createHttpAuthService(apiUrl) : unconfiguredAuthService;

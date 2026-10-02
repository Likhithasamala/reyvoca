import type { AuthResult, AuthService } from "./types";

const NOT_CONFIGURED: AuthResult = {
  ok: false,
  code: "not_configured",
  message:
    "Reyvoca accounts aren't open yet. Authentication will be enabled once the platform backend is live.",
};

/**
 * Phase 1 default: no backend exists, so every call reports that honestly
 * instead of pretending an account was created or signed in.
 */
const unconfiguredAuthService: AuthService = {
  signIn: async () => NOT_CONFIGURED,
  signUp: async () => NOT_CONFIGURED,
  requestPasswordReset: async () => NOT_CONFIGURED,
};

/**
 * Adapter for the future Reyvoca API. Endpoint paths are provisional and
 * should be aligned with the backend contract when it is built.
 */
function createHttpAuthService(baseUrl: string): AuthService {
  async function post(path: string, body: unknown): Promise<AuthResult> {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (response.ok) return { ok: true };
      if (response.status === 401) {
        return { ok: false, code: "invalid_credentials", message: "Incorrect email or password." };
      }
      return { ok: false, code: "unknown", message: "Something went wrong. Please try again." };
    } catch {
      return { ok: false, code: "network_error", message: "We couldn't reach Reyvoca. Check your connection and try again." };
    }
  }

  return {
    signIn: (input) => post("/auth/sign-in", input),
    signUp: (input) => post("/auth/sign-up", input),
    requestPasswordReset: (input) => post("/auth/password-reset", input),
  };
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

export const authService: AuthService = apiUrl ? createHttpAuthService(apiUrl) : unconfiguredAuthService;

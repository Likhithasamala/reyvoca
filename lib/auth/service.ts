import type {
  AccountPayload,
  AuthErrorCode,
  AuthResult,
  AuthService,
  DeleteAccountInput,
  EmailChangeInput,
  PasswordChangeInput,
  PasswordResetConfirmInput,
  PasswordResetInput,
  ProfileInput,
  SessionDeviceView,
  SignInInput,
  SignUpInput,
} from "./types";

const NOT_CONFIGURED: AuthFailureResult = {
  ok: false,
  code: "not_configured",
  message:
    "Reyvoca accounts aren't reachable: NEXT_PUBLIC_API_URL is not set, so there is no backend to talk to.",
};

type AuthFailureResult = Extract<AuthResult, { ok: false }>;

/**
 * Fallback when NEXT_PUBLIC_API_URL is unset: no backend to talk to, so every
 * call says so honestly instead of pretending an account was created.
 */
const unconfiguredAuthService: AuthService = {
  signIn: async () => NOT_CONFIGURED,
  signUp: async () => NOT_CONFIGURED,
  signOut: async () => NOT_CONFIGURED,
  requestPasswordReset: async () => NOT_CONFIGURED,
  confirmPasswordReset: async () => NOT_CONFIGURED,
  changePassword: async () => NOT_CONFIGURED,
  resendVerification: async () => NOT_CONFIGURED,
  updateProfile: async () => NOT_CONFIGURED,
  requestEmailChange: async () => NOT_CONFIGURED,
  confirmEmailChange: async () => NOT_CONFIGURED,
  listSessions: async () => NOT_CONFIGURED,
  revokeSessions: async () => NOT_CONFIGURED,
  deleteAccount: async () => NOT_CONFIGURED,
};

/** Error codes the API may return that map straight onto an AuthErrorCode. */
const PASSTHROUGH_CODES = new Set<string>([
  "invalid_credentials",
  "email_taken",
  "validation_error",
  "unauthorized",
  "forbidden",
]);

/** Adapter for the Reyvoca API (see `app/api/auth/*` for the local backend). */
function createHttpAuthService(baseUrl: string): AuthService {
  async function send<T>(
    path: string,
    method: "POST" | "PATCH" | "DELETE" | "GET",
    body?: unknown,
  ): Promise<AuthResult<T>> {
    let response: Response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: body === undefined ? undefined : { "Content-Type": "application/json" },
        // Same-origin by default, but kept explicit so the session cookie is
        // still sent if the API is ever hosted on another origin.
        credentials: "include",
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      return {
        ok: false,
        code: "network_error",
        message: "We couldn't reach Reyvoca. Check your connection and try again.",
      };
    }

    const payload = (await response.json().catch(() => null)) as
      | ({ code?: string; message?: string; redirectTo?: string } & Record<string, unknown>)
      | null;

    if (response.ok) {
      return { ok: true, redirectTo: payload?.redirectTo, data: (payload ?? undefined) as T };
    }

    // Prefer the server's own code and message so validation and conflict
    // errors reach the user instead of a generic failure.
    const code: AuthErrorCode =
      payload?.code && PASSTHROUGH_CODES.has(payload.code)
        ? (payload.code as AuthErrorCode)
        : response.status === 401
          ? "invalid_credentials"
          : response.status === 429
            ? "validation_error"
            : "unknown";

    return {
      ok: false,
      code,
      message: payload?.message ?? "Something went wrong. Please try again.",
    };
  }

  return {
    signIn: (input: SignInInput) => send<AccountPayload>("/auth/sign-in", "POST", input),
    signUp: (input: SignUpInput) => send<AccountPayload>("/auth/sign-up", "POST", input),
    signOut: () => send("/auth/sign-out", "POST", {}),
    requestPasswordReset: (input: PasswordResetInput) => send("/auth/password-reset", "POST", input),
    confirmPasswordReset: (input: PasswordResetConfirmInput) =>
      send<AccountPayload>("/auth/password-reset/confirm", "POST", input),
    changePassword: (input: PasswordChangeInput) =>
      send<{ otherDevicesSignedOut: number }>("/auth/password", "POST", input),
    resendVerification: () =>
      send<{ emailSent: boolean; alreadyVerified: boolean }>("/auth/verify-email", "POST", {}),
    updateProfile: (input: ProfileInput) => send<AccountPayload>("/auth/account", "PATCH", input),
    requestEmailChange: (input: EmailChangeInput) =>
      send<{ pendingEmail: string; emailSent: boolean }>("/auth/account", "PATCH", input),
    confirmEmailChange: (emailToken: string) =>
      send<AccountPayload>("/auth/account", "PATCH", { emailToken }),
    listSessions: () => send<{ sessions: SessionDeviceView[] }>("/auth/sessions", "GET"),
    revokeSessions: (sessionId?: string) =>
      send<{ revoked: number }>("/auth/sessions", "DELETE", sessionId ? { sessionId } : {}),
    deleteAccount: (input: DeleteAccountInput) => send("/auth/account", "DELETE", input),
  };
}

/**
 * Base URL of the Reyvoca API. The bundled backend runs in this same app, so
 * the default local value is the relative path `/api`.
 */
const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

export const authService: AuthService = apiUrl
  ? createHttpAuthService(apiUrl)
  : unconfiguredAuthService;

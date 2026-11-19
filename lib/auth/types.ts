import type { AccountSummary } from "@/types";

export type SignInInput = {
  email: string;
  password: string;
  /** "Keep me signed in": a 30-day cookie instead of a browser-session one. */
  remember?: boolean;
};

export type SignUpInput = {
  fullName: string;
  email: string;
  workspace: string;
  password: string;
  confirmPassword?: string;
  acceptedTerms: boolean;
  remember?: boolean;
};

export type PasswordResetInput = {
  email: string;
};

/** Setting a new password from an emailed link. */
export type PasswordResetConfirmInput = {
  token: string;
  password: string;
  confirmPassword?: string;
};

/** Changing the password of an account that is already signed in. */
export type PasswordChangeInput = {
  /** Omitted only by a Google account setting its first password. */
  currentPassword?: string;
  password: string;
  confirmPassword?: string;
};

export type ProfileInput = {
  fullName?: string;
  workspace?: string;
};

/** Step one of an email change: ask, and get a confirmation link sent. */
export type EmailChangeInput = {
  email: string;
  /** Required whenever the account has a password. */
  password?: string;
};

export type DeleteAccountInput = {
  password?: string;
  /** Typed instead of a password by a Google-only account. */
  confirmEmail?: string;
};

export type AuthErrorCode =
  | "not_configured"
  | "invalid_credentials"
  | "email_taken"
  | "validation_error"
  | "unauthorized"
  | "forbidden"
  | "network_error"
  | "unknown";

export type AuthFailure = { ok: false; code: AuthErrorCode; message: string };

/**
 * The shape every auth call resolves to.
 *
 * `data` carries whatever that particular endpoint returns — the account, the
 * device list, whether an email actually went out — so a component can react
 * to specifics without each call inventing its own result type.
 */
export type AuthResult<T = undefined> = ({ ok: true; redirectTo?: string; data?: T }) | AuthFailure;

/** What the server reports back after a successful sign-up or sign-in. */
export type AccountPayload = { user: AccountSummary; emailSent?: boolean };

export type SessionDeviceView = {
  id: string;
  current: boolean;
  device: string;
  ip?: string;
  createdAt: string;
  lastSeenAt?: string;
  remember: boolean;
};

/**
 * Contract every auth backend must satisfy. UI components depend only on this
 * interface, so swapping the implementation (the Reyvoca API, a hosted auth
 * provider, …) requires no component changes.
 */
export interface AuthService {
  signIn(input: SignInInput): Promise<AuthResult<AccountPayload>>;
  signUp(input: SignUpInput): Promise<AuthResult<AccountPayload>>;
  signOut(): Promise<AuthResult>;
  requestPasswordReset(input: PasswordResetInput): Promise<AuthResult>;
  confirmPasswordReset(input: PasswordResetConfirmInput): Promise<AuthResult<AccountPayload>>;
  changePassword(input: PasswordChangeInput): Promise<AuthResult<{ otherDevicesSignedOut: number }>>;
  resendVerification(): Promise<AuthResult<{ emailSent: boolean; alreadyVerified: boolean }>>;
  updateProfile(input: ProfileInput): Promise<AuthResult<AccountPayload>>;
  requestEmailChange(input: EmailChangeInput): Promise<AuthResult<{ pendingEmail: string; emailSent: boolean }>>;
  confirmEmailChange(token: string): Promise<AuthResult<AccountPayload>>;
  listSessions(): Promise<AuthResult<{ sessions: SessionDeviceView[] }>>;
  revokeSessions(sessionId?: string): Promise<AuthResult<{ revoked: number }>>;
  deleteAccount(input: DeleteAccountInput): Promise<AuthResult>;
}

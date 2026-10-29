export type SignInInput = {
  email: string;
  password: string;
};

export type SignUpInput = {
  fullName: string;
  email: string;
  workspace: string;
  password: string;
  acceptedTerms: boolean;
};

export type PasswordResetInput = {
  email: string;
};

export type AuthErrorCode =
  | "not_configured"
  | "invalid_credentials"
  | "email_taken"
  | "validation_error"
  | "network_error"
  | "unknown";

export type AuthResult =
  | { ok: true; redirectTo?: string }
  | { ok: false; code: AuthErrorCode; message: string };

/**
 * Contract every auth backend must satisfy. UI components depend only on
 * this interface, so swapping the implementation (Reyvoca API, a hosted
 * auth provider, …) requires no component changes.
 */
export interface AuthService {
  signIn(input: SignInInput): Promise<AuthResult>;
  signUp(input: SignUpInput): Promise<AuthResult>;
  requestPasswordReset(input: PasswordResetInput): Promise<AuthResult>;
  signOut(): Promise<AuthResult>;
}

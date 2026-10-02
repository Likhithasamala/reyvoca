const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MIN_PASSWORD_LENGTH = 8;

export function validateEmail(value: string): string | undefined {
  if (!value.trim()) return "Enter your email address.";
  if (!EMAIL_PATTERN.test(value.trim())) return "Enter a valid email address.";
}

export function validatePassword(value: string, { checkStrength = false } = {}): string | undefined {
  if (!value) return "Enter your password.";
  if (checkStrength && value.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
}

export function validateRequired(value: string, label: string): string | undefined {
  if (!value.trim()) return `Enter your ${label}.`;
}

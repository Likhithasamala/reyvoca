/**
 * Form validation shared by the client and the server.
 *
 * The client runs these for instant feedback; every API route runs them again
 * and never trusts that the client did. That duplication is the point.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MIN_PASSWORD_LENGTH = 8;
/** bcrypt-style truncation is not in play with scrypt, but a cap stops abuse. */
export const MAX_PASSWORD_LENGTH = 200;

/**
 * Passwords common enough that a guesser tries them first.
 *
 * A short list like this, checked case-insensitively, blocks the great
 * majority of real-world guessing. The full defence is the rate limiter in
 * `lib/server/rate-limit.ts`; this is the part that stops an account being
 * trivially weak in the first place.
 */
const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "passw0rd",
  "12345678",
  "123456789",
  "1234567890",
  "qwerty123",
  "qwertyuiop",
  "letmein1",
  "welcome1",
  "welcome123",
  "iloveyou",
  "admin123",
  "administrator",
  "abc12345",
  "football1",
  "monkey123",
  "dragon123",
  "sunshine1",
  "princess1",
  "trustno1",
  "changeme",
  "secret123",
  "reyvoca",
  "reyvoca123",
]);

export function validateEmail(value: string): string | undefined {
  if (!value.trim()) return "Enter your email address.";
  if (!EMAIL_PATTERN.test(value.trim())) return "Enter a valid email address.";
  if (value.trim().length > 254) return "That email address is too long.";
}

/**
 * Checks a password.
 *
 * `checkStrength` separates the two situations: signing in only needs to know
 * that something was typed (the stored password is whatever it is), while
 * choosing a password has to be held to the rules. `email` and `name`, when
 * given, block the two guesses anyone would try first.
 */
export function validatePassword(
  value: string,
  { checkStrength = false, email = "", name = "" } = {},
): string | undefined {
  if (!value) return "Enter your password.";
  if (!checkStrength) return undefined;

  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (value.length > MAX_PASSWORD_LENGTH) {
    return `Keep it under ${MAX_PASSWORD_LENGTH} characters.`;
  }
  if (!/[a-zA-Z]/.test(value)) return "Include at least one letter.";
  if (!/[0-9]/.test(value)) return "Include at least one number.";
  if (/^\s|\s$/.test(value)) return "Remove the space at the start or end.";
  if (COMMON_PASSWORDS.has(value.toLowerCase())) {
    return "That password is too common. Choose something harder to guess.";
  }

  const lower = value.toLowerCase();
  const localPart = email.split("@")[0]?.toLowerCase() ?? "";
  if (localPart.length >= 4 && lower.includes(localPart)) {
    return "Don't use your email address in your password.";
  }
  const firstName = name.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  if (firstName.length >= 4 && lower.includes(firstName)) {
    return "Don't use your name in your password.";
  }
}

/** Both passwords on a sign-up or reset form must agree. */
export function validatePasswordConfirmation(
  password: string,
  confirmation: string,
): string | undefined {
  if (!confirmation) return "Re-enter your password.";
  if (password !== confirmation) return "Those passwords do not match.";
}

export function validateRequired(value: string, label: string): string | undefined {
  if (!value.trim()) return `Enter your ${label}.`;
  if (value.trim().length > 120) return `That ${label} is too long.`;
}

export type PasswordStrength = {
  /** 0–4, driving the meter's filled segments. */
  score: 0 | 1 | 2 | 3 | 4;
  label: "Too short" | "Weak" | "Fair" | "Good" | "Strong";
  /** The single most useful next improvement, or undefined when strong. */
  advice?: string;
};

/**
 * Scores a password for the meter under the field.
 *
 * Length does most of the work, because it genuinely does: a long passphrase
 * of plain words beats a short jumble of symbols. Variety adds to the score
 * but cannot carry a short password on its own. This is advisory only —
 * `validatePassword` is what actually accepts or rejects.
 */
export function passwordStrength(value: string): PasswordStrength {
  if (!value || value.length < MIN_PASSWORD_LENGTH) {
    return {
      score: 0,
      label: "Too short",
      advice: `At least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }
  if (COMMON_PASSWORDS.has(value.toLowerCase())) {
    return { score: 0, label: "Weak", advice: "That is one of the most-guessed passwords." };
  }

  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((pattern) =>
    pattern.test(value),
  ).length;
  const lengthPoints = value.length >= 16 ? 3 : value.length >= 12 ? 2 : value.length >= 10 ? 1 : 0;
  // Repeated or sequential runs ("aaaa", "1234") are a real weakness.
  const predictable = /(.)\1{2,}/.test(value) || /(0123|1234|2345|abcd|qwer)/i.test(value);

  const raw = Math.max(1, Math.min(4, lengthPoints + classes - 1 - (predictable ? 1 : 0)));
  const score = raw as 1 | 2 | 3 | 4;

  const advice =
    value.length < 12
      ? "Longer is stronger — aim for 12 or more."
      : predictable
        ? "Avoid repeated or sequential runs of characters."
        : classes < 3
          ? "Mixing in capitals or symbols helps."
          : undefined;

  const label = score >= 4 ? "Strong" : score === 3 ? "Good" : score === 2 ? "Fair" : "Weak";
  return { score, label, advice };
}

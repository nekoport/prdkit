import bcrypt from "bcryptjs";

/**
 * A04:2025 - Cryptographic Failures
 * bcrypt with 12 rounds (industry recommendation for production, ~250ms per hash).
 * 10 rounds = ~100ms (minimum acceptable), 12 = stronger, 14 = ~1s (overkill for web).
 */
const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function comparePasswords(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validate password strength.
 * A07:2025 - Authentication Failures
 *
 * Rules:
 * - Minimum 8 characters (was 6, bumped for 2025)
 * - At least 1 letter and 1 number (basic complexity)
 * - Maximum 100 characters (prevent DoS on bcrypt)
 * - Not in common password list
 */
const COMMON_PASSWORDS = new Set([
  "password",
  "password123",
  "12345678",
  "123456789",
  "qwerty123",
  "abc12345",
  "password1",
  "admin123",
  "letmein1",
  "welcome1",
  "monkey123",
  "dragon123",
  "prdkit123",
  "iloveyou1",
]);

export interface PasswordValidation {
  ok: boolean;
  errors: string[];
}

export function validatePasswordStrength(password: string): PasswordValidation {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password minimal 8 karakter.");
  }
  if (password.length > 100) {
    errors.push("Password maksimal 100 karakter.");
  }
  if (!/[a-zA-Z]/.test(password)) {
    errors.push("Password harus mengandung minimal 1 huruf.");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password harus mengandung minimal 1 angka.");
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push("Password terlalu umum. Pilih password yang lebih unik.");
  }

  return { ok: errors.length === 0, errors };
}

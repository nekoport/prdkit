/**
 * A10:2025 - Mishandling of Exceptional Conditions
 *
 * Sanitize error messages sebelum return ke client.
 * Di production, jangan bocorkan:
 * - Database error details (Prisma error messages)
 * - Internal stack traces
 * - File paths
 * - Library version info
 *
 * Strategi:
 * - Kalau error message adalah user-friendly (dari throw new Error("...") di code kita), return as-is
 * - Kalau error message mengandung pola internal (PrismaError, "database", file path), return generic
 * - Selalu log error original ke Sentry + console untuk debugging
 */

import * as Sentry from "@sentry/nextjs";

const INTERNAL_ERROR_PATTERNS = [
  /prisma/i,
  /database/i,
  /connection/i,
  /timeout/i,
  /ECONNREFUSED/i,
  /ENOTFOUND/i,
  /sql/i,
  /query/i,
  /\.prisma/i,
  /node_modules/i,
  /at\s+\w+\s+\(/i, // stack trace pattern
  /\[object Object\]/i,
];

const GENERIC_ERROR_MESSAGE = "Terjadi kesalahan server. Tim kami sudah diberi notifikasi. Coba lagi nanti.";

export interface SafeError {
  message: string;
  status: number;
}

/**
 * Sanitize error untuk response ke client.
 * Original error tetap di-log ke Sentry + console.
 */
export function sanitizeError(err: any, context?: string): SafeError {
  // Log original error
  console.error(`[ERROR${context ? ` ${context}` : ""}]`, err);

  // Send to Sentry (if enabled)
  if (process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.NODE_ENV === "production") {
    Sentry.captureException(err);
  }

  // If err is a string (from throw new Error("..."))
  const message = typeof err === "string" ? err : err?.message || String(err);

  // A01/A07: Auth errors from requireUserApi() — preserve status, don't sanitize
  // These are intentional throws with user-friendly messages
  if (err?.status === 401 || err?.status === 403) {
    return { message, status: err.status };
  }

  // In development, return full message for debugging
  if (process.env.NODE_ENV === "development") {
    return { message, status: 500 };
  }

  // In production, check if message looks internal
  for (const pattern of INTERNAL_ERROR_PATTERNS) {
    if (pattern.test(message)) {
      return { message: GENERIC_ERROR_MESSAGE, status: 500 };
    }
  }

  // User-friendly message (from our throw new Error())
  // But cap length to prevent info leak via long error
  const safeMessage = message.slice(0, 300);
  return { message: safeMessage, status: 500 };
}

/**
 * Sanitize ZodError — return first issue message (safe, user-controlled input).
 */
export function sanitizeZodError(err: any): SafeError {
  const firstIssue = err?.issues?.[0];
  const message = firstIssue?.message || "Input tidak valid";
  return { message, status: 400 };
}

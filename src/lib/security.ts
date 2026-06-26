/**
 * A07:2025 - Authentication Failures
 * A09:2025 - Security Logging and Alerting Failures
 *
 * Account lockout: setelah 5 percobaan login gagal dalam 15 menit,
 * akun dikunci selama 15 menit.
 *
 * Audit log: catat event security penting untuk forensik & alerting.
 * Production: harus di-persist ke DB atau log aggregator (Sentry, Datadog, dll).
 * Dev: in-memory Map dengan TTL.
 */

import * as Sentry from "@sentry/nextjs";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

interface LockoutEntry {
  failedAttempts: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
}

const lockoutMap = new Map<string, LockoutEntry>();

/**
 * Check apakah akun (by email) sedang dikunci.
 * Returns remaining lockout time in ms, atau 0 jika tidak dikunci.
 */
export function getLockoutRemaining(email: string): number {
  const key = email.toLowerCase().trim();
  const entry = lockoutMap.get(key);
  if (!entry || !entry.lockedUntil) return 0;
  const remaining = entry.lockedUntil - Date.now();
  if (remaining <= 0) {
    // Lockout expired, reset
    lockoutMap.delete(key);
    return 0;
  }
  return remaining;
}

/**
 * Record failed login attempt. Lock account jika mencapai threshold.
 */
export function recordFailedAttempt(email: string): void {
  const key = email.toLowerCase().trim();
  const now = Date.now();
  let entry = lockoutMap.get(key);

  if (!entry || (entry.firstAttemptAt && now - entry.firstAttemptAt > LOCKOUT_WINDOW_MS)) {
    // Start new window
    entry = {
      failedAttempts: 1,
      firstAttemptAt: now,
      lockedUntil: null,
    };
  } else {
    entry.failedAttempts += 1;
    if (entry.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      entry.lockedUntil = now + LOCKOUT_DURATION_MS;
      auditLog("ACCOUNT_LOCKED", { email, attempts: entry.failedAttempts });
    }
  }

  lockoutMap.set(key, entry);
}

/**
 * Reset failed attempts setelah login berhasil.
 */
export function resetFailedAttempts(email: string): void {
  const key = email.toLowerCase().trim();
  lockoutMap.delete(key);
}

/**
 * A09:2025 - Security Logging
 * Audit log untuk event security penting.
 *
 * Di production, ini harus dikirim ke log aggregator (Sentry, Datadog, Logflare, dll).
 * Saat ini dikirim ke Sentry (jika DSN diset) + console.
 */
export type AuditEventType =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGIN_LOCKED"
  | "SIGNUP"
  | "SIGNUP_BLOCKED_RATE"
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_RESET_SUCCESS"
  | "PASSWORD_RESET_FAILED"
  | "EMAIL_VERIFICATION_SENT"
  | "EMAIL_VERIFICATION_SUCCESS"
  | "PRD_GENERATED"
  | "PRD_DELETED"
  | "CHAT_REVISION"
  | "RATE_LIMIT_HIT"
  | "ACCOUNT_LOCKED"
  | "ACCOUNT_DELETED"
  | "ADMIN_ACCESS"
  | "SUSPICIOUS_ACTIVITY";

export interface AuditEvent {
  type: AuditEventType;
  userId?: string;
  email?: string;
  ip?: string;
  details?: Record<string, any>;
  timestamp: string;
}

export function auditLog(
  type: AuditEventType,
  data: {
    userId?: string;
    email?: string;
    ip?: string;
    details?: Record<string, any>;
  } = {}
): void {
  const event: AuditEvent = {
    type,
    ...data,
    timestamp: new Date().toISOString(),
  };

  // Console log (akan masuk ke Vercel logs)
  console.log(`[AUDIT] ${type}`, event);

  // Send to Sentry as a breadcrumb (lighter than full event)
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.addBreadcrumb({
      category: "audit",
      message: type,
      level:
        type.includes("FAILED") ||
        type.includes("LOCKED") ||
        type.includes("BLOCKED") ||
        type.includes("SUSPICIOUS")
          ? "warning"
          : "info",
      data: event,
    });
  }

  // Critical events: send as Sentry event
  if (
    process.env.NEXT_PUBLIC_SENTRY_DSN &&
    (type === "ACCOUNT_LOCKED" ||
      type === "SUSPICIOUS_ACTIVITY" ||
      type === "RATE_LIMIT_HIT")
  ) {
    Sentry.captureMessage(`Security event: ${type}`, "warning");
  }
}

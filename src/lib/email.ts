/**
 * Email service — Resend (https://resend.com) untuk production.
 *
 * Mode:
 * - Jika RESEND_API_KEY + EMAIL_FROM tidak di-set: auto-verify (dev mode).
 *   User langsung dianggap emailVerified saat sign-up.
 * - Jika di-set: kirim email verifikasi dengan link ke /verify-email?token=xxx
 *
 * Resend free tier: 100 emails/day, domain harus diverifikasi dulu.
 */

import { db } from "@/lib/db";
import { randomBytes } from "crypto";

const resendKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function isEmailEnabled(): boolean {
  return !!resendKey && !!emailFrom;
}

interface TokenEntry {
  userId: string;
  expiresAt: number;
  type: "verify" | "reset";
}

// Token map for both email verification (24h) and password reset (1h)
const tokens = new Map<string, TokenEntry>();

export async function createVerificationToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  tokens.set(token, {
    userId,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24h
    type: "verify",
  });
  return token;
}

export async function consumeVerificationToken(
  token: string
): Promise<string | null> {
  const entry = tokens.get(token);
  if (!entry) return null;
  if (entry.type !== "verify") return null;
  if (entry.expiresAt < Date.now()) {
    tokens.delete(token);
    return null;
  }
  tokens.delete(token);
  return entry.userId;
}

/**
 * Password reset token — shorter TTL (1 hour) for security.
 */
export async function createPasswordResetToken(
  userId: string
): Promise<string> {
  // Invalidate any existing reset tokens for this user first
  for (const [k, v] of tokens.entries()) {
    if (v.type === "reset" && v.userId === userId) {
      tokens.delete(k);
    }
  }
  const token = randomBytes(32).toString("hex");
  tokens.set(token, {
    userId,
    expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
    type: "reset",
  });
  return token;
}

export async function consumePasswordResetToken(
  token: string
): Promise<string | null> {
  const entry = tokens.get(token);
  if (!entry) return null;
  if (entry.type !== "reset") return null;
  if (entry.expiresAt < Date.now()) {
    tokens.delete(token);
    return null;
  }
  tokens.delete(token);
  return entry.userId;
}

export async function sendVerificationEmail(
  email: string,
  userName: string | null,
  token: string
): Promise<void> {
  if (!isEmailEnabled()) {
    console.log(`[email] Dev mode: auto-verify for ${email}`);
    return;
  }

  const verifyUrl = `${appUrl}/verify-email?token=${token}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verifikasi email PRDKit</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #f9f7f4;">
  <div style="background: white; border-radius: 12px; padding: 32px; border: 1px solid #e5e3df;">
    <div style="font-size: 20px; font-weight: 700; color: #1a1a1a; margin-bottom: 24px;">
      PRDKit
    </div>
    <h1 style="font-size: 22px; color: #1a1a1a; margin: 0 0 16px 0;">
      Halo ${userName || ""}, verifikasi email kamu
    </h1>
    <p style="font-size: 14px; color: #555; line-height: 1.6; margin: 0 0 24px 0;">
      Klik tombol di bawah untuk verifikasi email dan mulai bikin PRD gratis.
      Link ini berlaku 24 jam.
    </p>
    <a href="${verifyUrl}" style="display: inline-block; background: #c25a1f; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
      Verifikasi Email
    </a>
    <p style="font-size: 12px; color: #888; margin-top: 24px; line-height: 1.5;">
      Atau salin link ini ke browser: <br>
      <span style="word-break: break-all; color: #c25a1f;">${verifyUrl}</span>
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
    <p style="font-size: 12px; color: #888; margin: 0;">
      Email ini dikirim otomatis oleh PRDKit. Jika kamu tidak mendaftar, abaikan email ini.
    </p>
  </div>
</body>
</html>
`.trim();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailFrom,
      to: email,
      subject: "Verifikasi email PRDKit kamu",
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[email] Resend error:", err);
    throw new Error("Gagal kirim email verifikasi");
  }
}

/**
 * Send password reset email.
 * In dev mode (no Resend key), just log and pretend success — user can't actually reset.
 */
export async function sendPasswordResetEmail(
  email: string,
  userName: string | null,
  token: string
): Promise<void> {
  if (!isEmailEnabled()) {
    console.log(
      `[email] Dev mode: password reset for ${email}. Token: ${token}`
    );
    console.log(`[email] Reset URL: ${appUrl}/reset-password?token=${token}`);
    return;
  }

  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset password PRDKit</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #f9f7f4;">
  <div style="background: white; border-radius: 12px; padding: 32px; border: 1px solid #e5e3df;">
    <div style="font-size: 20px; font-weight: 700; color: #1a1a1a; margin-bottom: 24px;">
      PRDKit
    </div>
    <h1 style="font-size: 22px; color: #1a1a1a; margin: 0 0 16px 0;">
      Halo ${userName || ""}, reset password kamu
    </h1>
    <p style="font-size: 14px; color: #555; line-height: 1.6; margin: 0 0 24px 0;">
      Kami menerima permintaan untuk reset password akun PRDKit kamu.
      Klik tombol di bawah untuk membuat password baru. Link ini berlaku 1 jam.
    </p>
    <a href="${resetUrl}" style="display: inline-block; background: #c25a1f; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
      Reset Password
    </a>
    <p style="font-size: 12px; color: #888; margin-top: 24px; line-height: 1.5;">
      Atau salin link ini ke browser: <br>
      <span style="word-break: break-all; color: #c25a1f;">${resetUrl}</span>
    </p>
    <p style="font-size: 13px; color: #555; margin-top: 24px; line-height: 1.6;">
      <strong>Penting:</strong> Jika kamu tidak meminta reset password, abaikan email ini. Password kamu tidak akan berubah.
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
    <p style="font-size: 12px; color: #888; margin: 0;">
      Email ini dikirim otomatis oleh PRDKit. Untuk keamanan, jangan share link ini ke siapapun.
    </p>
  </div>
</body>
</html>
`.trim();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailFrom,
      to: email,
      subject: "Reset password PRDKit kamu",
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[email] Resend error:", err);
    throw new Error("Gagal kirim email reset password");
  }
}

export async function isUserVerified(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  });
  return !!user?.emailVerified;
}

/**
 * Send welcome email setelah signup berhasil.
 * Berisi: tips cepat mulai, link dashboard, info fitur.
 *
 * In dev mode (no Resend key), skip silently.
 */
export async function sendWelcomeEmail(
  email: string,
  userName: string | null
): Promise<void> {
  if (!isEmailEnabled()) {
    console.log(`[email] Dev mode: skip welcome email for ${email}`);
    return;
  }

  const dashboardUrl = `${appUrl}/dashboard`;
  const newPrdUrl = `${appUrl}/new`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Selamat datang di PRDKit</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #f9f7f4;">
  <div style="background: white; border-radius: 12px; padding: 32px; border: 1px solid #e5e3df;">
    <div style="font-size: 20px; font-weight: 700; color: #1a1a1a; margin-bottom: 24px;">
      PRDKit
    </div>
    <h1 style="font-size: 22px; color: #1a1a1a; margin: 0 0 16px 0;">
      Halo ${userName || ""}, selamat datang di PRDKit! 🎉
    </h1>
    <p style="font-size: 14px; color: #555; line-height: 1.6; margin: 0 0 24px 0;">
      Akun kamu sudah aktif. Sekarang kamu bisa bikin PRD (Product Requirements Document)
      terstruktur 10-section dalam &lt;90 detik — siap di-paste ke Cursor, Claude Code, atau v0.
    </p>

    <a href="${newPrdUrl}" style="display: inline-block; background: #c25a1f; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
      Bikin PRD pertama kamu
    </a>

    <h2 style="font-size: 16px; color: #1a1a1a; margin: 32px 0 12px;">
      Yang bisa kamu lakukan
    </h2>
    <ul style="font-size: 14px; color: #555; line-height: 1.8; padding-left: 20px; margin: 0 0 24px;">
      <li><strong>Generate PRD</strong> — tulis ide produk, AI susun 10-section lengkap</li>
      <li><strong>Revisi via chat</strong> — minta AI ubah database, tambah fitur, atau sederhanakan</li>
      <li><strong>Export markdown</strong> — download .md siap pakai untuk repo/Cursor</li>
      <li><strong>Context7 integration</strong> — auto-fetch dokumentasi library terkini</li>
    </ul>

    <h2 style="font-size: 16px; color: #1a1a1a; margin: 32px 0 12px;">
      Tips cepat mulai
    </h2>
    <ol style="font-size: 14px; color: #555; line-height: 1.8; padding-left: 20px; margin: 0 0 24px;">
      <li>Klik <a href="${newPrdUrl}" style="color: #c25a1f;">Bikin PRD</a> di dashboard</li>
      <li>Ceritakan ide kamu (untuk siapa, masalah utama, fitur penting)</li>
      <li>Tunggu ~90 detik, AI susun PRD lengkap</li>
      <li>Revisi via chat kalau perlu, lalu download .md</li>
    </ol>

    <div style="background: #f5f0e8; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="font-size: 13px; color: #555; margin: 0;">
        <strong>Gratis selamanya.</strong> 10 PRD per 24 jam, 50 revisi per 24 jam.
        Tanpa kartu kredit, tanpa trial.
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
    <p style="font-size: 12px; color: #888; margin: 0;">
      Email ini dikirim karena kamu mendaftar di PRDKit. Kalau kamu tidak mendaftar,
      abaikan email ini atau <a href="${appUrl}/account" style="color: #c25a1f;">hapus akun</a>.
    </p>
  </div>
</body>
</html>
`.trim();

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom,
        to: email,
        subject: `Selamat datang di PRDKit, ${userName || ""}! 🎉`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[email] Resend welcome error:", err);
    }
  } catch (err) {
    console.error("[email] Failed to send welcome email:", err);
  }
}

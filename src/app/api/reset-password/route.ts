import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  createPasswordResetToken,
  sendPasswordResetEmail,
  consumePasswordResetToken,
  isEmailEnabled,
} from "@/lib/email";
import { hashPassword } from "@/lib/password";
import { checkAuthLimit } from "@/lib/rate-limit";
import { z } from "zod";

function getClientIP(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() || "unknown";
}

/**
 * POST /api/reset-password
 * Body:
 *   { action: "request", email: string }   — kirim email reset link
 *   { action: "confirm", token: string, password: string }  — set password baru
 */
export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "Body bukan JSON valid" }, { status: 400 });
    }

    const schema = z.object({
      action: z.enum(["request", "confirm"]),
      email: z.string().email().optional(),
      token: z.string().min(32).optional(),
      password: z.string().min(6).max(100).optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "Input tidak valid" },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // Rate limit per IP (anti-abuse)
    const ip = getClientIP(req);
    const rl = await checkAuthLimit(`reset:${ip}`);
    if (!rl.ok) {
      return NextResponse.json(
        { message: "Terlalu banyak permintaan. Coba lagi nanti." },
        { status: 429 }
      );
    }

    if (data.action === "request") {
      if (!data.email) {
        return NextResponse.json(
          { message: "Email wajib diisi" },
          { status: 400 }
        );
      }
      const email = data.email.toLowerCase().trim();

      // Always return success — don't leak which emails are registered
      const user = await db.user.findUnique({
        where: { email },
        select: { id: true, name: true, email: true, provider: true },
      });

      // Security: even if user not found OR is OAuth-only (no password), return success
      // But only send email if user exists AND has passwordHash (credentials provider)
      if (user && user.provider === "credentials") {
        const token = await createPasswordResetToken(user.id);
        await sendPasswordResetEmail(user.email, user.name, token);
      }

      const msg = isEmailEnabled()
        ? "Jika email terdaftar, link reset password sudah dikirim. Cek folder inbox dan spam."
        : "Permintaan reset password diterima. (Mode dev: email service tidak aktif. Hubungi admin untuk reset manual.)";

      return NextResponse.json({ message: msg });
    }

    // Confirm reset
    if (data.action === "confirm") {
      if (!data.token || !data.password) {
        return NextResponse.json(
          { message: "Token dan password baru wajib diisi" },
          { status: 400 }
        );
      }
      if (data.password.length < 6) {
        return NextResponse.json(
          { message: "Password minimal 6 karakter" },
          { status: 400 }
        );
      }

      const userId = await consumePasswordResetToken(data.token);
      if (!userId) {
        return NextResponse.json(
          {
            message:
              "Token tidak valid atau sudah kedaluwarsa. Silakan minta reset password lagi.",
          },
          { status: 400 }
        );
      }

      const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, provider: true },
      });
      if (!user) {
        return NextResponse.json(
          { message: "User tidak ditemukan" },
          { status: 404 }
        );
      }
      if (user.provider !== "credentials") {
        return NextResponse.json(
          {
            message:
              "Akun ini menggunakan login sosial (Google). Tidak bisa reset password.",
          },
          { status: 400 }
        );
      }

      const passwordHash = await hashPassword(data.password);
      await db.user.update({
        where: { id: userId },
        data: { passwordHash },
      });

      return NextResponse.json({
        message:
          "Password berhasil diubah. Silakan sign in dengan password baru.",
      });
    }

    return NextResponse.json({ message: "Aksi tidak dikenal" }, { status: 400 });
  } catch (err: any) {
    console.error("[POST /api/reset-password] error:", err);
    return NextResponse.json(
      { message: err.message || "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

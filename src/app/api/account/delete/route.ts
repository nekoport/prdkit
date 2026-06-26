import { NextRequest, NextResponse } from "next/server";
import { requireUserApi } from "@/lib/session";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/security";
import { sanitizeError } from "@/lib/error-sanitizer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const BodySchema = z.object({
  confirmEmail: z.string().email(),
});

/**
 * POST /api/account/delete
 *
 * A06:2025 Insecure Design — irreversible action needs confirmation.
 * User harus input email mereka sendiri untuk konfirmasi.
 *
 * Setelah delete:
 * - Cascade delete semua PRD + chat threads (sudah di schema)
 * - Sign out user (client side handle redirect)
 * - Audit log dengan detail
 *
 * Rate limit: 3 attempt per hour per user (mencegah brute-force konfirmasi)
 */
export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUserApi();
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || "Unauthorized" },
      { status: err.status || 401 }
    );
  }

  try {

    // Rate limit
    const rl = await rateLimit(`acct-del:${user.id}`, 3, 60 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { message: "Terlalu banyak percobaan. Coba lagi nanti." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Email konfirmasi tidak valid." },
        { status: 400 }
      );
    }

    // Email confirmation check — prevent accidental delete
    if (parsed.data.confirmEmail.toLowerCase().trim() !== user.email.toLowerCase()) {
      auditLog("SUSPICIOUS_ACTIVITY", {
        userId: user.id,
        email: user.email,
        details: {
          action: "account_delete_email_mismatch",
          attempted: parsed.data.confirmEmail,
        },
      });
      return NextResponse.json(
        { message: "Email konfirmasi tidak cocok dengan akun kamu." },
        { status: 400 }
      );
    }

    // Hitung data yang akan dihapus (untuk audit log)
    const [prdCount, chatCount] = await Promise.all([
      db.prdDocument.count({ where: { userId: user.id } }),
      db.chatThread.count({ where: { userId: user.id } }),
    ]);

    // Hard delete user (cascade akan hapus PrdDocument + ChatThread)
    await db.user.delete({
      where: { id: user.id },
    });

    auditLog("ACCOUNT_DELETED", {
      userId: user.id,
      email: user.email,
      details: {
        prdsDeleted: prdCount,
        chatsDeleted: chatCount,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Akun dan semua data terkait telah dihapus permanen.",
      deleted: {
        prds: prdCount,
        chats: chatCount,
      },
    });
  } catch (err: any) {
    const safe = sanitizeError(err, "POST /api/account/delete");
    return NextResponse.json({ message: safe.message }, { status: safe.status });
  }
}

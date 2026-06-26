/**
 * Admin access control.
 *
 - Admin ditentukan oleh env var ADMIN_EMAILS (comma-separated).
 - Saat user sign in / sign up, jika email ada di list, role di-DB update jadi "admin".
 - Halaman /admin dan API /api/admin/* hanya bisa diakses user dengan role "admin".
 */

import { db } from "@/lib/db";

const adminEmails = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email: string): boolean {
  return adminEmails.includes(email.toLowerCase().trim());
}

export async function getUserRole(userId: string): Promise<"admin" | "user"> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, email: true },
  });
  if (!user) return "user";

  // Auto-promote jika email ada di ADMIN_EMAILS tapi role belum ter-set
  if (isAdminEmail(user.email) && user.role !== "admin") {
    await db.user.update({
      where: { id: userId },
      data: { role: "admin" },
    });
    return "admin";
  }

  return user.role as "admin" | "user";
}

export async function requireAdmin(userId: string): Promise<void> {
  const role = await getUserRole(userId);
  if (role !== "admin") {
    throw new Error("FORBIDDEN: Kamu tidak punya akses admin.");
  }
}

export const COST_PER_PRD = parseFloat(process.env.COST_PER_PRD || "0.015");
export const COST_PER_REVISION = parseFloat(
  process.env.COST_PER_REVISION || "0.005"
);

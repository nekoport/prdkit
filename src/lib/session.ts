import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserRole } from "@/lib/admin";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: "admin" | "user";
}

/**
 * For SERVER COMPONENTS (pages) — redirects to /sign-in if not authenticated.
 * Throws NEXT_REDIRECT (handled by Next.js) which works in pages but NOT in API routes.
 */
export async function requireUser(): Promise<SessionUser> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/sign-in");
  }
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, name: true },
  });
  if (!user) redirect("/sign-in");

  const role = await getUserRole(user.id);
  return { ...user, role };
}

/**
 * For SERVER COMPONENTS (pages) — redirects to /dashboard if not admin.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") {
    redirect("/dashboard");
  }
  return user;
}

/**
 * For API ROUTES — returns user or throws { status, message } error.
 * Use this in route handlers instead of requireUser().
 *
 * Usage:
 * ```ts
 * try {
 *   const user = await requireUserApi();
 *   // ... handle request
 * } catch (err: any) {
 *   return NextResponse.json({ message: err.message }, { status: err.status });
 * }
 * ```
 */
export async function requireUserApi(): Promise<SessionUser> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    const err = new Error("Unauthorized — silakan sign in terlebih dahulu.") as any;
    err.status = 401;
    throw err;
  }
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, name: true },
  });
  if (!user) {
    const err = new Error("Unauthorized — user tidak ditemukan.") as any;
    err.status = 401;
    throw err;
  }

  const role = await getUserRole(user.id);
  return { ...user, role };
}

/**
 * For API ROUTES — returns admin user or throws { status, message } error.
 */
export async function requireAdminApi(): Promise<SessionUser> {
  const user = await requireUserApi();
  if (user.role !== "admin") {
    const err = new Error("Forbidden — akses admin diperlukan.") as any;
    err.status = 403;
    throw err;
  }
  return user;
}

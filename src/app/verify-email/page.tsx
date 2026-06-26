import { db } from "@/lib/db";
import { consumeVerificationToken, sendWelcomeEmail } from "@/lib/email";
import { auditLog } from "@/lib/security";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, MailCheck } from "lucide-react";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="max-w-md text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h1 className="font-display text-2xl font-bold">Token tidak valid</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Link verifikasi tidak lengkap. Cek kembali email kamu.
            </p>
            <Button asChild className="mt-6">
              <Link href="/sign-in">Kembali ke sign in</Link>
            </Button>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const userId = await consumeVerificationToken(token);

  if (!userId) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="max-w-md text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
            <h1 className="font-display text-2xl font-bold">Token kedaluwarsa</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Link verifikasi sudah tidak valid atau sudah dipakai. Silakan sign
              in untuk kirim ulang link verifikasi.
            </p>
            <Button asChild className="mt-6">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  await db.user.update({
    where: { id: userId },
    data: { emailVerified: new Date() },
  });

  // Get user info untuk welcome email
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  if (user) {
    auditLog("EMAIL_VERIFICATION_SUCCESS", { userId, email: user.email });
    // Kirim welcome email setelah verifikasi sukses
    await sendWelcomeEmail(user.email, user.name);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
            <CheckCircle2 className="h-8 w-8 text-accent" />
          </div>
          <h1 className="font-display text-2xl font-bold">
            Email berhasil diverifikasi!
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Akun kamu sudah aktif. Sekarang kamu bisa sign in dan mulai bikin PRD
            pertama kamu.
          </p>
          <div className="mt-6 space-y-2">
            <Button asChild className="cta-glow w-full" size="lg">
              <Link href="/sign-in">
                <MailCheck className="mr-2 h-4 w-4" /> Sign in sekarang
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

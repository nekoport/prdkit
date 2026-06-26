"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SiteFooter } from "@/components/site-footer";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2, AlertCircle, FileText } from "lucide-react";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password minimal 6 karakter.");
      return;
    }
    if (password !== confirm) {
      toast.error("Password dan konfirmasi tidak cocok.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          token,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess(true);
      toast.success("Password berhasil diubah!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  // No token
  if (!token) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-7 w-7 text-destructive" />
            </div>
            <h1 className="font-display text-2xl font-bold">Link tidak valid</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Link reset password tidak lengkap. Pastikan kamu mengklik link dari
              email yang kami kirim.
            </p>
            <Button asChild className="mt-6 w-full" size="lg">
              <Link href="/forgot-password">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Minta link baru
              </Link>
            </Button>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 inline-flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
              <FileText className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <span className="font-display text-base font-bold tracking-tight">
              PRDKit
            </span>
          </Link>

          <Card className="overflow-hidden border-border/60 shadow-sm">
            <div className="h-1 w-full bg-gradient-to-r from-accent via-accent/60 to-transparent" />

            {success ? (
              <CardContent className="p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                  <CheckCircle2 className="h-7 w-7 text-accent" />
                </div>
                <h1 className="font-display text-2xl font-bold">
                  Password berhasil diubah!
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  Sekarang kamu bisa sign in dengan password baru.
                </p>
                <Button
                  asChild
                  className="cta-glow mt-6 w-full"
                  size="lg"
                >
                  <Link href="/sign-in">
                    Sign in sekarang
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            ) : (
              <>
                <CardHeader className="pb-4">
                  <CardTitle className="font-display text-2xl">
                    Reset password
                  </CardTitle>
                  <CardDescription>
                    Masukkan password baru untuk akun PRDKit kamu.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium">
                        Password baru
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        disabled={loading}
                        className="h-11 rounded-lg"
                      />
                      <p className="text-xs text-muted-foreground">
                        Minimal 6 karakter.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm" className="text-sm font-medium">
                        Konfirmasi password
                      </Label>
                      <Input
                        id="confirm"
                        type="password"
                        required
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        autoComplete="new-password"
                        disabled={loading}
                        className="h-11 rounded-lg"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="cta-glow h-11 w-full gap-2 rounded-lg"
                      size="lg"
                      disabled={loading || !password || !confirm}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...
                        </>
                      ) : (
                        <>
                          Ubah password
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>

                  <p className="mt-6 text-center text-sm text-muted-foreground">
                    Ingat password kamu?{" "}
                    <Link
                      href="/sign-in"
                      className="font-medium text-foreground underline underline-offset-4 hover:text-accent"
                    >
                      Sign in
                    </Link>
                  </p>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

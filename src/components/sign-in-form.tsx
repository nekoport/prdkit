"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { SiteFooter } from "@/components/site-footer";
import { toast } from "sonner";
import { ArrowRight, FileText, Sparkles, Zap, ShieldCheck } from "lucide-react";

interface SignInFormProps {
  isGoogleEnabled: boolean;
}

export function SignInForm({ isGoogleEnabled }: SignInFormProps) {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      mode: "signin",
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      // Handle special case: email not verified
      if (res.error.startsWith("EMAIL_NOT_VERIFIED:")) {
        toast.info(
          "Email belum diverifikasi. Link verifikasi baru sudah dikirim ke email kamu.",
          { duration: 6000 }
        );
        return;
      }
      toast.error(res.error);
      return;
    }
    toast.success("Selamat datang kembali!");
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        {/* Left — visual panel */}
        <aside className="relative hidden w-1/2 overflow-hidden bg-mesh-warm lg:block">
          <div className="noise-overlay absolute inset-0" />
          <div className="relative flex h-full flex-col justify-between p-12">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-80"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
                <FileText className="h-4 w-4" strokeWidth={2.5} />
              </div>
              <span className="font-display text-base font-bold tracking-tight">
                PRDKit
              </span>
            </Link>

            <div className="max-w-md">
              <h2 className="font-display text-4xl font-bold leading-tight tracking-tight">
                Selamat datang kembali.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Masuk untuk lanjut bikin dan revisi PRD kamu.
              </p>

              <div className="mt-10 space-y-4">
                {[
                  {
                    icon: Zap,
                    title: "Generate PRD <90 detik",
                    desc: "Claude menyusun 10-section otomatis",
                  },
                  {
                    icon: Sparkles,
                    title: "Revisi via chat natural",
                    desc: "Minta AI ubah database, tambah fitur, dll",
                  },
                  {
                    icon: ShieldCheck,
                    title: "PRD tersimpan di akun kamu",
                    desc: "Tidak ada leak, tidak ada public sharing",
                  },
                ].map((f) => (
                  <div key={f.title} className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background/60 text-accent backdrop-blur-sm">
                      <f.icon className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {f.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} PRDKit &middot; Free forever
            </p>
          </div>
        </aside>

        {/* Right — form panel */}
        <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2.5 lg:hidden"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
                <FileText className="h-4 w-4" strokeWidth={2.5} />
              </div>
              <span className="font-display text-base font-bold tracking-tight">
                PRDKit
              </span>
            </Link>

            <div className="mb-8">
              <h1 className="font-display text-3xl font-bold tracking-tight">
                Sign in
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Masuk ke akun PRDKit kamu untuk lanjut bikin PRD.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kamu@email.com"
                  autoComplete="email"
                  disabled={loading}
                  className="h-11 rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-muted-foreground underline underline-offset-4 hover:text-accent"
                  >
                    Lupa password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                  className="h-11 rounded-lg"
                />
              </div>
              <Button
                type="submit"
                className="cta-glow h-11 w-full gap-2 rounded-lg text-base"
                disabled={loading}
              >
                {loading ? "Memproses..." : "Sign in"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            {isGoogleEnabled && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      atau
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="h-11 w-full rounded-lg"
                  onClick={() => signIn("google", { callbackUrl })}
                  disabled={loading}
                >
                  <svg
                    className="mr-2 h-4 w-4"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in dengan Google
                </Button>
              </>
            )}

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Belum punya akun?{" "}
              <Link
                href="/sign-up"
                className="font-medium text-foreground underline underline-offset-4 hover:text-accent"
              >
                Daftar gratis
              </Link>
            </p>
          </div>
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}

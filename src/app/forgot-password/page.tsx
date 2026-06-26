"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SiteFooter } from "@/components/site-footer";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2, MailCheck, FileText } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSent(true);
      toast.success("Permintaan terkirim");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2.5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
              <FileText className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <span className="font-display text-base font-bold tracking-tight">
              PRDKit
            </span>
          </Link>

          <Card className="overflow-hidden border-border/60 shadow-sm">
            <div className="h-1 w-full bg-gradient-to-r from-accent via-accent/60 to-transparent" />

            {sent ? (
              <CardContent className="p-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                  <MailCheck className="h-7 w-7 text-accent" />
                </div>
                <h1 className="font-display text-2xl font-bold">
                  Cek email kamu
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  Jika email <span className="font-medium text-foreground">{email}</span> terdaftar,
                  link reset password sudah dikirim. Cek folder inbox dan spam.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Link berlaku 1 jam.
                </p>

                <div className="mt-6 space-y-2">
                  <Button
                    asChild
                    className="cta-glow w-full"
                    size="lg"
                  >
                    <Link href="/sign-in">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Kembali ke sign in
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-sm"
                    onClick={() => setSent(false)}
                  >
                    Kirim ulang ke email lain
                  </Button>
                </div>
              </CardContent>
            ) : (
              <>
                <CardHeader className="pb-4">
                  <CardTitle className="font-display text-2xl">
                    Lupa password?
                  </CardTitle>
                  <CardDescription>
                    Masukkan email akun PRDKit kamu. Kami kirim link reset
                    password ke email tersebut.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
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
                    <Button
                      type="submit"
                      className="cta-glow h-11 w-full gap-2 rounded-lg"
                      size="lg"
                      disabled={loading || !email}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Mengirim...
                        </>
                      ) : (
                        <>
                          Kirim link reset
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

"use client";

import Link from "next/link";
import { useEffect } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Home, RefreshCw, AlertTriangle } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Capture error ke Sentry (jika enabled)
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(error);
    }
    // Log ke console untuk debugging
    console.error("[APP_ERROR]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="max-w-md text-center">
          {/* Error icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>

          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Terjadi kesalahan
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Maaf, ada yang tidak berfungsi dengan baik. Tim kami sudah diberi
            notifikasi otomatis. Coba refresh halaman, atau kembali ke beranda
            kalau masalah berlanjut.
          </p>

          {/* Error digest untuk support reference (jika ada) */}
          {error.digest && (
            <p className="mt-4 rounded-md border border-border/60 bg-muted/30 px-3 py-2 font-mono text-[11px] text-muted-foreground">
              Error ID: {error.digest}
            </p>
          )}

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              onClick={reset}
              className="cta-glow gap-2"
              size="lg"
            >
              <RefreshCw className="h-4 w-4" />
              Coba lagi
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="/">
                <Home className="h-4 w-4" />
                Ke beranda
              </Link>
            </Button>
          </div>

          <p className="mt-8 text-xs text-muted-foreground">
            Kalau error berulang, hubungi{" "}
            <a
              href="mailto:support@prdkit.app"
              className="font-medium text-foreground underline underline-offset-4 hover:text-accent"
            >
              support@prdkit.app
            </a>{" "}
            dengan Error ID di atas.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Home, Search, FileText } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="max-w-md text-center">
          {/* Big 404 with gradient */}
          <p className="font-display text-[120px] font-bold leading-none tracking-tighter text-gradient-warm sm:text-[160px]">
            404
          </p>

          <div className="mx-auto mb-6 mt-4 h-px w-16 accent-line" />

          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Halaman tidak ditemukan
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            URL yang kamu cari mungkin sudah dihapus, diubah, atau tidak pernah
            ada. Coba kembali ke beranda atau cari PRD kamu di dashboard.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="cta-glow gap-2" size="lg">
              <Link href="/">
                <Home className="h-4 w-4" />
                Ke beranda
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="/dashboard">
                <FileText className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          </div>

          {/* Decorative footer */}
          <div className="mt-12 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Search className="h-3 w-3" />
            <span>Error code: PRDKit-404-Not-Found</span>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

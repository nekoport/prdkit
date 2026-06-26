import Link from "next/link";
import { DonationButton } from "@/components/donation-button";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/40 bg-secondary/30">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Top: brand + donation */}
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="h-px w-8 accent-line" />
            <div className="text-sm">
              <p className="font-display font-semibold text-foreground">
                PRDKit
              </p>
              <p className="text-xs text-muted-foreground">
                Generator PRD gratis untuk AI coding
              </p>
            </div>
          </div>

          <DonationButton
            variant="default"
            size="sm"
            className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
          />
        </div>

        {/* Middle: link grid */}
        <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Produk
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Beranda
                </Link>
              </li>
              <li>
                <Link
                  href="/new"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Bikin PRD
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Legal
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/terms"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Syarat &amp; Ketentuan
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Kebijakan Privasi
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Resources
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://context7.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Context7
                </a>
              </li>
              <li>
                <a
                  href="https://www.anthropic.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Anthropic Claude
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Dukung
            </p>
            <p className="text-xs text-muted-foreground">
              PRDKit 100% gratis. Bantu keberlanjutan via donasi sukarela.
            </p>
          </div>
        </div>

        {/* Bottom: copyright */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border/40 pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} PRDKit. Dibuat di Indonesia.
          </p>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-border/60 bg-background px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              100% free
            </span>
            <span className="rounded-full border border-accent/40 bg-accent/[0.04] px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-accent">
              Open-source ready
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

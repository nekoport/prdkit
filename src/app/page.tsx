import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatsBranding } from "@/components/stats-branding";
import { DonationButton } from "@/components/donation-button";
import {
  ArrowRight,
  Sparkles,
  FileText,
  Code2,
  Zap,
  GitBranch,
  Layers,
  ShieldCheck,
  PenLine,
  MessagesSquare,
  Download,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero — full bleed mesh gradient */}
        <section className="relative overflow-hidden bg-mesh-warm">
          <div className="noise-overlay relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
            <div className="mx-auto max-w-3xl text-center">
              {/* Top badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                </span>
                <span className="font-medium text-foreground/80">
                  Free forever
                </span>
                <span className="text-muted-foreground">&middot;</span>
                <span className="text-muted-foreground">
                  Open-source ready
                </span>
              </div>

              {/* Headline */}
              <h1 className="font-display text-balance text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
                <span className="block">Bikin PRD yang</span>
                <span className="block text-gradient-warm italic">AI paham</span>
                <span className="mt-2 block text-2xl font-normal text-muted-foreground sm:text-3xl md:text-4xl">
                  dalam satu prompt.
                </span>
              </h1>

              {/* Subhead */}
              <p className="mx-auto mt-8 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
                Dari ide jadi dokumen PRD terstruktur 10-section yang langsung
                bisa diimplementasikan Cursor, Claude Code, atau v0.{" "}
                <span className="text-foreground/80">
                  Gratis, tanpa kartu kredit, tanpa batasan halaman.
                </span>
              </p>

              {/* CTA */}
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="cta-glow h-12 w-full gap-2 rounded-full px-8 text-base sm:w-auto"
                >
                  <Link href="/sign-up">
                    Mulai bikin PRD
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 w-full gap-2 rounded-full px-8 text-base sm:w-auto"
                >
                  <Link href="/sign-in">Sudah punya akun</Link>
                </Button>
              </div>

              {/* Trust line */}
              <p className="mt-8 text-xs text-muted-foreground">
                Powered by{" "}
                <span className="font-medium text-foreground/70">Claude</span>
                {" "}&middot;{" "}
                Integrasi{" "}
                <span className="font-medium text-foreground/70">Context7</span>{" "}
                untuk dokumentasi terkini
              </p>
            </div>

            {/* Decorative floating PRD mockup */}
            <div className="mt-16 hidden sm:block">
              <div className="mx-auto max-w-3xl">
                <div className="glass-card relative rounded-2xl p-1 shadow-2xl">
                  <div className="rounded-xl bg-background/95 p-6">
                    <div className="mb-4 flex items-center gap-2 border-b border-border/60 pb-3">
                      <div className="flex gap-1.5">
                        <span className="h-3 w-3 rounded-full bg-red-400/70" />
                        <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
                        <span className="h-3 w-3 rounded-full bg-green-400/70" />
                      </div>
                      <span className="ml-2 font-mono text-xs text-muted-foreground">
                        prd-manajemen-stok.md
                      </span>
                    </div>
                    <div className="space-y-2 text-left font-mono text-[11px] leading-relaxed">
                      <p className="text-foreground">
                        <span className="text-accent">#</span> PRD — Sistem
                        Manajemen Stok
                      </p>
                      <p className="text-muted-foreground">
                        <span className="text-accent">##</span> 1. Overview
                      </p>
                      <p className="text-muted-foreground/80 pl-3">
                        Aplikasi ini bertujuan untuk mendigitalkan...
                      </p>
                      <p className="text-muted-foreground">
                        <span className="text-accent">##</span> 5. Architecture
                      </p>
                      <pre className="rounded bg-muted/60 p-2 text-[10px] text-muted-foreground/80">
                        <code>{`sequenceDiagram
  User->>UI: Input Data
  UI->>Server: POST /api/stock
  Server->>DB: Validasi
  DB-->>Server: OK`}</code>
                      </pre>
                      <p className="text-muted-foreground">
                        <span className="text-accent">##</span> 8. Acceptance
                        Criteria
                      </p>
                      <p className="pl-3 text-muted-foreground/80">
                        <span className="text-accent">AC-001:</span> Given user
                        di /new...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats strip — live + static */}
        <section className="border-y border-border/40 bg-background/60">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            {/* Live stats */}
            <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
              <p className="text-sm text-muted-foreground">
                Dipercaya oleh
              </p>
              <StatsBranding variant="inline" className="text-base" />
            </div>

            {/* Static stats */}
            <div className="grid grid-cols-2 gap-4 border-t border-border/40 pt-6 md:grid-cols-4">
              {[
                { num: "10", label: "Section per PRD", sub: "struktur lengkap" },
                { num: "<90s", label: "Waktu generate", sub: "via Claude" },
                { num: "0", label: "Biaya", sub: "free forever" },
                { num: "∞", label: "PRD per user", sub: "tanpa limit" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                    {s.num}
                  </p>
                  <p className="mt-1 text-xs font-medium text-foreground/80">
                    {s.label}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {s.sub}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3 main cards */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3 rounded-full px-3 py-1">
              <Sparkles className="mr-1 h-3 w-3" /> Mulai dari sini
            </Badge>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Mau ngapain hari ini?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Tiga pintu masuk utama. Pilih salah satu.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                icon: PenLine,
                title: "Bikin PRD",
                desc: "Dari ide jadi rencana development yang siap dipake AI.",
                cta: "Mulai",
                href: "/new",
                featured: true,
              },
              {
                icon: Layers,
                title: "Dashboard",
                desc: "Lihat, edit, dan revisi semua PRD yang sudah kamu bikin.",
                cta: "Buka",
                href: "/dashboard",
                featured: false,
              },
              {
                icon: Code2,
                title: "Contoh struktur",
                desc: "Pelajari struktur 10-section yang dihasilkan otomatis.",
                cta: "Lihat",
                href: "/#structure",
                featured: false,
              },
            ].map((card) => (
              <Card
                key={card.title}
                className={`card-hover-lift relative overflow-hidden ${
                  card.featured
                    ? "border-accent/30 bg-accent/[0.02]"
                    : ""
                }`}
              >
                {card.featured && (
                  <div className="absolute right-3 top-3">
                    <Badge
                      variant="default"
                      className="bg-accent text-accent-foreground"
                    >
                      Populer
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <div
                    className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${
                      card.featured
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-foreground/70"
                    }`}
                  >
                    <card.icon className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <CardTitle className="text-xl">{card.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {card.desc}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    asChild
                    variant="ghost"
                    className="group w-full justify-between px-0 hover:bg-transparent hover:px-0"
                  >
                    <Link href={card.href}>
                      <span className="text-sm font-medium">
                        {card.cta}
                      </span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/5 transition-all group-hover:bg-foreground group-hover:text-background">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Why section — bento grid */}
        <section className="border-y border-border/40 bg-secondary/30">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="mb-12 max-w-2xl">
              <Badge variant="outline" className="mb-3 rounded-full">
                Why PRDKit
              </Badge>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Kenapa PRD ini bisa langsung dipahami AI?
              </h2>
              <p className="mt-3 text-muted-foreground">
                Struktur 10-section yang dirancang untuk LLM, bukan untuk
                manusia. Setiap detailnya punya tujuan: membuat AI coding agent
                tidak halusinasi dan tidak over-engineer.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Zap,
                  title: "Eksplisit, bukan implisit",
                  body: "Setiap requirement ditulis tegas. AI tidak perlu menebak 'login sosial' itu Google atau GitHub — sudah ditulis.",
                  span: "md:col-span-2",
                },
                {
                  icon: GitBranch,
                  title: "Constraint-driven",
                  body: "Bukan 'bikin fitur chat', tapi 'WebSocket, max 50 pesan, truncate >2000 char'. AI langsung tahu implementasinya.",
                  span: "",
                },
                {
                  icon: ShieldCheck,
                  title: "Out-of-scope eksplisit",
                  body: "Daftar tegas apa yang TIDAK dibangun. Mencegah AI over-engineering dan menghemat token.",
                  span: "",
                },
                {
                  icon: FileText,
                  title: "Given-When-Then",
                  body: "Acceptance criteria pakai format BDD yang langsung bisa dites oleh AI coding agent seperti Cursor dan Claude Code.",
                  span: "",
                },
                {
                  icon: Code2,
                  title: "Data model + API contract",
                  body: "Schema database dan endpoint API di-definisikan di awal. Tidak ada halusinasi field atau asumsi salah struktur.",
                  span: "lg:col-span-2",
                },
                {
                  icon: Layers,
                  title: "AI Implementation Hints",
                  body: "Saran file structure, komponen utama, dan urutan implementasi. AI tinggal ikuti peta jalan yang sudah jelas.",
                  span: "",
                },
              ].map((f) => (
                <Card
                  key={f.title}
                  className={`card-hover-lift border-border/60 bg-background ${f.span}`}
                >
                  <CardHeader>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <f.icon className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <CardTitle className="text-base">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{f.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Structure preview */}
        <section id="structure" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <Badge variant="outline" className="mb-3 rounded-full">
                Struktur PRD
              </Badge>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                10 section wajib yang dihasilkan
              </h2>
              <p className="mt-4 text-muted-foreground">
                Setiap PRD yang dihasilkan mengikuti struktur 10-section yang
                sudah teruji efektif untuk AI coding agent. Tidak ada bagian
                yang boleh dikosongkan — semua section harus punya konten
                substansial.
              </p>
              <div className="mt-6 space-y-2">
                <Button asChild size="lg" className="cta-glow h-12 gap-2 rounded-full px-6">
                  <Link href="/sign-up">
                    Coba sekarang <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <Card className="overflow-hidden border-border/60 shadow-lg">
              <CardContent className="p-0">
                <div className="border-b border-border/60 bg-muted/40 px-5 py-3">
                  <p className="font-mono text-xs text-muted-foreground">
                    prd-output.md
                  </p>
                </div>
                <ol className="divide-y divide-border/40">
                  {[
                    { n: 1, title: "Overview", desc: "Konteks & tujuan" },
                    { n: 2, title: "Requirements", desc: "Daftar tegas tingkat tinggi" },
                    { n: 3, title: "Core Features", desc: "Fitur MVP bernomor" },
                    { n: 4, title: "User Flow", desc: "Alur langkah-demi-langkah" },
                    { n: 5, title: "Architecture", desc: "Diagram sequence Mermaid" },
                    { n: 6, title: "Database Schema", desc: "ERD Mermaid + tabel deskripsi" },
                    { n: 7, title: "Design Constraints", desc: "Stack & typography" },
                    { n: 8, title: "Acceptance Criteria", desc: "Format Given-When-Then" },
                    { n: 9, title: "Out-of-Scope", desc: "Boundary eksplisit" },
                    { n: 10, title: "AI Implementation Hints", desc: "File structure & komponen" },
                  ].map((s) => (
                    <li
                      key={s.n}
                      className="flex items-center gap-4 px-5 py-2.5 transition-colors hover:bg-muted/30"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-foreground/5 font-mono text-xs font-bold text-foreground/70">
                        {String(s.n).padStart(2, "0")}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {s.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {s.desc}
                        </p>
                      </div>
                      {s.n >= 8 && (
                        <Badge
                          variant="outline"
                          className="border-accent/40 text-[10px] text-accent"
                        >
                          AI-friendly
                        </Badge>
                      )}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features matrix */}
        <section className="border-t border-border/40 bg-secondary/30">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="mb-12 text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Semua yang kamu butuhkan
              </h2>
              <p className="mt-3 text-muted-foreground">
                Fitur lengkap, gratis, tanpa batasan.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: PenLine,
                  title: "Generator AI",
                  body: "Claude Sonnet menyusun 10-section PRD dari ide kamu dalam <90 detik.",
                },
                {
                  icon: MessagesSquare,
                  title: "Revisi via Chat",
                  body: "Minta AI ubah database, tambah fitur, atau sederhanakan section — tanpa rewrite manual.",
                },
                {
                  icon: Code2,
                  title: "Context7 Integration",
                  body: "Auto-detect library di ide, fetch dokumentasi terkini, jadikan konteks LLM.",
                },
                {
                  icon: Download,
                  title: "Export Markdown",
                  body: "Download .md siap pakai untuk repo, Cursor, atau Claude Code project.",
                },
                {
                  icon: ShieldCheck,
                  title: "Akun pribadi",
                  body: "Semua PRD tersimpan di akun kamu. Tidak ada public sharing, tidak ada leak.",
                },
                {
                  icon: Zap,
                  title: "Gratis selamanya",
                  body: "Tanpa kartu kredit, tanpa trial, tanpa upsell. Bayar kalau mau via donation.",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="group rounded-xl border border-border/60 bg-background p-5 transition-colors hover:border-accent/40"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground/70 transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                    <f.icon className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <h3 className="font-display text-base font-semibold">
                    {f.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {f.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden bg-mesh-warm">
          <div className="noise-overlay relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6">
            <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              <span className="block">Punya ide produk?</span>
              <span className="mt-1 block text-gradient-warm italic">
                Ubah jadi PRD sekarang.
              </span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-muted-foreground">
              Gratis, tanpa komitmen, tanpa email marketing. Daftar 30 detik,
              langsung bikin PRD pertama kamu.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="cta-glow h-12 gap-2 rounded-full px-8 text-base"
              >
                <Link href="/sign-up">
                  Mulai gratis <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <DonationButton
                variant="outline"
                size="lg"
                className="h-12 rounded-full px-8 text-base"
              />
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              PRDKit gratis selamanya. Donasi sukarela untuk dukung
              keberlanjutan.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

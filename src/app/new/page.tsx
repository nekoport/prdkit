"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  PrdGenerationProgress,
} from "@/components/prd-generation-progress";
import { toast } from "sonner";
import {
  Sparkles,
  ArrowRight,
  Lightbulb,
  PenLine,
  Wand2,
  Zap,
  X,
  FileText,
} from "lucide-react";

const EXAMPLE_IDEAS = [
  {
    title: "Manajemen Stok Gudang",
    text: "Aplikasi web untuk admin tunggal yang mengelola stok gudang. Fitur: input produk dengan SKU & lokasi rak, pencatatan stok masuk/keluar dengan nomor batch, dashboard dengan low stock alert. Tech: Next.js + SQLite. Sederhana, tanpa login sosial.",
  },
  {
    title: "Marketplace Tukang Lokal",
    text: "Marketplace jasa tukang lokal di Jakarta, dengan booking slot, pembayaran COD, dan rating dua arah. Ada dashboard admin untuk verifikasi tukang dan moderation review.",
  },
  {
    title: "Habit Tracker",
    text: "App habit tracker dengan streak counter, reminder push notification, dan statistik mingguan. Mobile-first PWA, support offline mode.",
  },
  {
    title: "Uptime Monitor",
    text: "Dashboard analytics untuk monitoring uptime website pribadi, dengan alert email jika down lebih dari 5 menit. Cron job setiap 1 menit, simpan history 90 hari.",
  },
  {
    title: "Invoice Generator",
    text: "SaaS invoice generator untuk freelancer, dengan template PDF, multi-currency, dan export ke CSV. Bisa simpan klien dan item berulang.",
  },
];

export default function NewPrdPage() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [detectedLibs, setDetectedLibs] = useState<string[]>([]);
  const [genStatus, setGenStatus] = useState<
    "idle" | "running" | "done" | "error" | "cancelled"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [streamedContent, setStreamedContent] = useState<string>("");
  const [streamStep, setStreamStep] = useState<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);

  function detectLibs(text: string) {
    const lower = text.toLowerCase();
    const known = [
      "next.js",
      "react",
      "vue",
      "supabase",
      "prisma",
      "tailwind",
      "shadcn",
      "stripe",
      "midtrans",
      "openai",
      "claude",
    ];
    setDetectedLibs(known.filter((l) => lower.includes(l)));
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setIdea(e.target.value);
    detectLibs(e.target.value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (idea.trim().length < 20) {
      toast.error("Ide minimal 20 karakter. Jelaskan lebih detail.");
      return;
    }
    setLoading(true);
    setGenStatus("running");
    setErrorMsg("");
    setStreamedContent("");
    setStreamStep("");

    // Create AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Use streaming endpoint (SSE)
      const res = await fetch("/api/prd/generate-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal generate PRD.");
      }

      if (!res.body) {
        throw new Error("Streaming tidak didukung browser ini.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let prdId: string | null = null;
      let lastChunkAt = Date.now();
      let hasReceivedChunk = false;

      // Stall detector: kalau tidak ada chunk baru selama 2 menit, anggap stuck
      const stallDetector = setInterval(() => {
        const stalled = Date.now() - lastChunkAt > 120000; // 2 min
        if (stalled && !hasReceivedChunk) {
          // Belum terima chunk apapun dalam 2 menit — kemungkinan WAF/network issue
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
        } else if (stalled && hasReceivedChunk) {
          // Sudah terima chunk tapi stuck >2 menit — mungkin LLM hang
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
        }
      }, 30000); // check tiap 30s

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          lastChunkAt = Date.now();
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "progress") {
                setStreamStep(data.message);
              } else if (data.type === "chunk") {
                hasReceivedChunk = true;
                setStreamedContent((prev) => prev + data.content);
              } else if (data.type === "complete") {
                prdId = data.id;
                setGenStatus("done");
                toast.success("PRD berhasil dibuat!");
                setTimeout(() => {
                  if (prdId) router.push(`/prd/${prdId}`);
                }, 1000);
              } else if (data.type === "error") {
                throw new Error(data.message);
              }
            } catch (parseErr) {
              // ignore parse errors
            }
          }
        }
      } finally {
        clearInterval(stallDetector);
      }

      // Kalau stream selesai tapi tidak ada complete event dan tidak ada error,
      // kemungkinan LLM return empty atau connection drop
      if (genStatus === "running" && !prdId) {
        if (streamedContent && streamedContent.length > 200) {
          // Ada content tapi tidak save — anggap success dengan content yang ada
          throw new Error(
            "Stream selesai tapi PRD tidak tersimpan. Coba lagi atau gunakan endpoint non-streaming."
          );
        } else {
          throw new Error(
            "Koneksi ke AI provider terputus atau diblokir. Coba lagi dalam beberapa saat, atau hubungi admin kalau masalah berlanjut."
          );
        }
      }
    } catch (err: any) {
      // AbortError = user cancelled manually
      if (err.name === "AbortError") {
        setGenStatus("cancelled");
        toast.info("Generate dibatalkan. Ide kamu tetap tersimpan di form.");
        return;
      }
      setGenStatus("error");
      setErrorMsg(err.message || "Terjadi kesalahan.");
      toast.error(err.message || "Terjadi kesalahan.");
      setLoading(false);
    } finally {
      abortControllerRef.current = null;
    }
  }

  function handleCancel() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setGenStatus("cancelled");
    setLoading(false);
  }

  function handleReset() {
    setGenStatus("idle");
    setErrorMsg("");
    setLoading(false);
    setStreamedContent("");
    setStreamStep("");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/40 px-3 py-1 text-xs">
              <Sparkles className="h-3 w-3 text-accent" />
              <span className="font-medium text-foreground/80">
                Generator PRD
              </span>
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Bikin PRD baru
            </h1>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Ceritakan ide kamu se detail mungkin. AI akan susun PRD 10-section
              siap diimplementasikan dalam &lt;90 detik.
            </p>
          </div>

          {/* Mode: idle/error/cancelled → show form; running/done → show progress */}
          {genStatus === "idle" ||
          genStatus === "error" ||
          genStatus === "cancelled" ? (
            <Card className="overflow-hidden border-border/60 shadow-sm">
              <div className="h-1 w-full bg-gradient-to-r from-accent via-accent/60 to-transparent" />
              <form onSubmit={handleSubmit} className="space-y-5 p-6 sm:p-7">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="idea"
                      className="text-sm font-medium text-foreground"
                    >
                      Deskripsi ide
                    </Label>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {idea.length} / 5000
                    </span>
                  </div>
                  <Textarea
                    id="idea"
                    value={idea}
                    onChange={handleChange}
                    placeholder={`Contoh: Aplikasi web untuk admin tunggal yang mengelola stok gudang.\n\nFitur:\n- Input produk dengan SKU & lokasi rak\n- Pencatatan stok masuk/keluar dengan nomor batch\n- Dashboard dengan low stock alert\n\nTech: Next.js + SQLite\nSederhana, tanpa login sosial.`}
                    rows={9}
                    required
                    disabled={loading}
                    className="resize-y rounded-lg border-border/60 bg-background text-sm leading-relaxed"
                  />
                  <p className="text-xs text-muted-foreground">
                    Tulis dalam Bahasa Indonesia santai. Sebutkan: untuk siapa,
                    masalah utama, fitur penting, constraint teknis (kalau ada).
                  </p>
                </div>

                {/* Detected libraries */}
                {detectedLibs.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 rounded-lg border border-accent/20 bg-accent/[0.04] p-3">
                    <Wand2 className="h-3.5 w-3.5 text-accent" />
                    <span className="text-xs font-medium text-foreground/80">
                      Library terdeteksi:
                    </span>
                    {detectedLibs.map((l) => (
                      <Badge
                        key={l}
                        variant="outline"
                        className="border-accent/40 bg-background text-[10px] text-accent"
                      >
                        {l}
                      </Badge>
                    ))}
                    <span className="text-[10px] text-muted-foreground">
                      (Context7 akan fetch docs terkini)
                    </span>
                  </div>
                )}

                {/* Example ideas */}
                <div className="rounded-xl border border-dashed border-border/60 bg-secondary/20 p-4">
                  <div className="mb-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Lightbulb className="h-3.5 w-3.5 text-accent" />
                    Butuh inspirasi? Klik salah satu:
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {EXAMPLE_IDEAS.map((ex, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setIdea(ex.text);
                          detectLibs(ex.text);
                        }}
                        disabled={loading}
                        className="group flex items-center gap-2.5 rounded-lg border border-border/60 bg-background p-2.5 text-left transition-all hover:border-accent/40 hover:bg-accent/[0.02] disabled:opacity-50"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-bold text-muted-foreground transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                          {String(i + 1).padStart(2, "0")}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-foreground">
                            {ex.title}
                          </p>
                          <p className="truncate text-[10px] text-muted-foreground">
                            {ex.text.slice(0, 50)}...
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading || idea.trim().length < 20}
                  className="cta-glow h-12 w-full gap-2 rounded-lg text-base"
                  size="lg"
                >
                  <PenLine className="h-4 w-4" />
                  Generate PRD
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>

              {/* Helper info */}
              <div className="grid grid-cols-3 gap-3 border-t border-border/40 px-6 py-4 text-center sm:px-7">
                {[
                  { icon: Zap, label: "<90 detik", sub: "waktu generate" },
                  { icon: Sparkles, label: "10 section", sub: "struktur lengkap" },
                  { icon: PenLine, label: "Bahasa ID", sub: "output santai" },
                ].map((h, i) => (
                  <div key={i}>
                    <h.icon className="mx-auto mb-1 h-4 w-4 text-accent" />
                    <p className="text-xs font-semibold text-foreground">
                      {h.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{h.sub}</p>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="overflow-hidden border-border/60 shadow-sm">
              <div className="h-1 w-full bg-gradient-to-r from-accent via-accent/60 to-transparent" />
              <div className="p-6 sm:p-8">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      {genStatus === "done" ? (
                        <Sparkles className="h-5 w-5" />
                      ) : (
                        <Wand2 className="h-5 w-5 animate-pulse" />
                      )}
                    </div>
                    <div>
                      <h2 className="font-display text-lg font-semibold">
                        {genStatus === "done"
                          ? "PRD siap!"
                          : "AI sedang menyusun PRD kamu"}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {genStatus === "done"
                          ? "Mengarahkan ke halaman PRD..."
                          : `Sedang memproses ide kamu (${idea.length} karakter)`}
                      </p>
                    </div>
                  </div>

                  {/* Cancel button — only show when running */}
                  {genStatus === "running" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      className="gap-1.5 rounded-lg text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                      Batalkan
                    </Button>
                  )}
                </div>

                <PrdGenerationProgress
                  status={genStatus === "cancelled" ? "error" : genStatus}
                  errorMessage={
                    genStatus === "cancelled"
                      ? "Generate dibatalkan oleh user."
                      : errorMsg
                  }
                />

                {/* Streaming preview — show partial PRD as it generates */}
                {(genStatus === "running" || genStatus === "done") &&
                  streamedContent && (
                    <div className="mt-5 overflow-hidden rounded-lg border border-border/60 bg-muted/30">
                      <div className="flex items-center gap-2 border-b border-border/40 bg-background/60 px-3 py-2">
                        <FileText className="h-3.5 w-3.5 text-accent" />
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {streamStep || "AI sedang menulis..."}
                        </span>
                        {genStatus === "running" && (
                          <span className="ml-auto flex h-2 w-2 animate-pulse rounded-full bg-accent" />
                        )}
                      </div>
                      <pre className="max-h-64 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed text-foreground/80">
                        {streamedContent}
                        {genStatus === "running" && (
                          <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-accent align-middle" />
                        )}
                      </pre>
                    </div>
                  )}

                {(genStatus === "error" || genStatus === "cancelled") && (
                  <div className="mt-6 flex flex-col items-center gap-3 border-t border-border/40 pt-6">
                    <p className="text-center text-sm text-muted-foreground">
                      {genStatus === "cancelled"
                        ? "Generate dibatalkan. Ide kamu tetap tersimpan di form, kamu bisa coba lagi atau ubah dulu."
                        : "Terjadi kesalahan saat generate. Coba lagi atau ganti ide kamu."}
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      className="gap-2"
                    >
                      Coba lagi
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {genStatus === "idle" && (
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Proses generate membutuhkan 60-90 detik. PRD akan otomatis tersimpan
              ke dashboard kamu.
            </p>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

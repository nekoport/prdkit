"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  FileText,
  Trash2,
  ArrowRight,
  Clock,
  Sparkles,
  Plus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export interface DashboardPrd {
  id: string;
  title: string;
  summary: string | null;
  tags: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function formatRelative(d: Date) {
  return formatDistanceToNow(d, { addSuffix: true, locale: idLocale });
}

export function DashboardClient({
  initialPrds,
}: {
  initialPrds: DashboardPrd[];
}) {
  const [prds, setPrds] = useState(initialPrds);
  const [pending, startTransition] = useTransition();

  async function handleDelete(id: string) {
    if (!confirm("Yakin hapus PRD ini? Tidak bisa di-undo.")) return;
    startTransition(async () => {
      const res = await fetch(`/api/prd/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Gagal hapus PRD.");
        return;
      }
      setPrds((p) => p.filter((x) => x.id !== id));
      toast.success("PRD dihapus.");
    });
  }

  if (prds.length === 0) {
    return (
      <Card className="overflow-hidden border-dashed border-2 bg-secondary/20">
        <div className="flex flex-col items-center justify-center gap-5 px-6 py-20 text-center">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <FileText className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Plus className="h-4 w-4" strokeWidth={2.5} />
            </div>
          </div>
          <div className="max-w-sm">
            <h3 className="font-display text-xl font-semibold">
              Belum ada PRD
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Mulai bikin PRD pertama kamu dari ide produk. AI akan susun
              10-section lengkap dalam &lt;90 detik.
            </p>
          </div>
          <Button asChild size="lg" className="cta-glow h-11 gap-2 rounded-full px-6">
            <Link href="/new">
              <Sparkles className="h-4 w-4" />
              Bikin PRD pertama
            </Link>
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          PRD terbaru
        </p>
        <p className="text-xs text-muted-foreground">
          {prds.length} total
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {prds.map((prd) => (
          <Card
            key={prd.id}
            className="card-hover-lift group relative flex flex-col overflow-hidden border-border/60 bg-background"
          >
            <Link
              href={`/prd/${prd.id}`}
              className="absolute inset-0 z-10"
              aria-label={`Buka ${prd.title}`}
            />
            {/* Top accent */}
            <div className="h-1 w-full bg-gradient-to-r from-accent/60 via-accent/30 to-transparent" />

            <div className="flex flex-1 flex-col p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  <FileText className="h-4 w-4" strokeWidth={2} />
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete(prd.id);
                  }}
                  disabled={pending}
                  className="z-20 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  aria-label="Hapus PRD"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <h3 className="line-clamp-2 font-display text-base font-semibold leading-snug">
                {prd.title}
              </h3>

              <p className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-muted-foreground">
                {prd.summary || "Tidak ada ringkasan."}
              </p>

              {prd.tags && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {prd.tags
                    .split(",")
                    .filter(Boolean)
                    .slice(0, 3)
                    .map((t) => (
                      <Badge
                        key={t}
                        variant="outline"
                        className="text-[10px] font-normal"
                      >
                        {t.trim()}
                      </Badge>
                    ))}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatRelative(prd.updatedAt)}</span>
                </div>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground/5 text-foreground/60 transition-all group-hover:bg-foreground group-hover:text-background">
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

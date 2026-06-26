"use client";

import { useEffect, useState } from "react";
import { Users, FileText } from "lucide-react";

interface Stats {
  users: number;
  prds: number;
  usersFormatted: string;
  prdsFormatted: string;
}

interface StatsBrandingProps {
  variant?: "inline" | "card";
  className?: string;
}

export function StatsBranding({
  variant = "inline",
  className,
}: StatsBrandingProps) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {
        // silent fail
      });
  }, []);

  if (!stats) {
    // Skeleton
    if (variant === "card") {
      return (
        <div className={`grid grid-cols-2 gap-3 ${className || ""}`}>
          {[0, 1].map((i) => (
            <div
              key={i}
              className="shimmer rounded-xl border border-border/40 p-4"
              style={{ height: 80 }}
            />
          ))}
        </div>
      );
    }
    return (
      <div className={`flex gap-4 ${className || ""}`}>
        <div className="shimmer h-4 w-20 rounded" />
        <div className="shimmer h-4 w-20 rounded" />
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={`grid grid-cols-2 gap-3 ${className || ""}`}>
        <div className="rounded-xl border border-border/60 bg-background p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Users className="h-4 w-4" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              Pengguna
            </span>
          </div>
          <p className="font-display text-2xl font-bold text-foreground">
            {stats.usersFormatted}
          </p>
          <p className="text-[10px] text-muted-foreground">
            sudah bergabung
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-background p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <FileText className="h-4 w-4" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              PRD dibuat
            </span>
          </div>
          <p className="font-display text-2xl font-bold text-foreground">
            {stats.prdsFormatted}
          </p>
          <p className="text-[10px] text-muted-foreground">
            dihasilkan AI
          </p>
        </div>
      </div>
    );
  }

  // Inline variant
  return (
    <div
      className={`flex flex-wrap items-center gap-x-6 gap-y-2 text-sm ${className || ""}`}
    >
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <Users className="h-3.5 w-3.5 text-accent" />
        <span className="font-semibold text-foreground">
          {stats.usersFormatted}
        </span>{" "}
        pengguna
      </span>
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <FileText className="h-3.5 w-3.5 text-accent" />
        <span className="font-semibold text-foreground">
          {stats.prdsFormatted}
        </span>{" "}
        PRD dibuat
      </span>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  FileText,
  TrendingUp,
  DollarSign,
  Sparkles,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Activity,
  Cpu,
} from "lucide-react";
import Link from "next/link";

interface AdminStats {
  llmProvider: {
    active: string;
    model: string;
  };
  overview: {
    totalUsers: number;
    totalPrds: number;
    todayUsers: number;
    todayPrds: number;
    yesterdayPrds: number;
    prdGrowthPct: number;
    last7dPrds: number;
    last30dPrds: number;
    last30dChatThreads: number;
    avgPrdPerUser: number;
  };
  charts: {
    dailyUsers: { date: string; count: number }[];
    dailyPrds: { date: string; count: number }[];
  };
  recent: {
    users: Array<{
      id: string;
      email: string;
      name: string | null;
      provider: string;
      role: string;
      emailVerified: string | null;
      createdAt: string;
    }>;
    prds: Array<{
      id: string;
      title: string;
      summary: string | null;
      createdAt: string;
      user: { email: string; name: string | null };
    }>;
  };
  breakdown: {
    providers: { provider: string; count: number }[];
  };
  cost: {
    costPerPrd: number;
    costPerRevision: number;
    estimated30d: number;
    estimatedTotal: number;
    prdCost30d: number;
    revisionCost30d: number;
  };
}

export function AdminDashboardClient() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(async (r) => {
        if (!r.ok) {
          const e = await r.json().catch(() => ({}));
          throw new Error(e.message || "Gagal load stats");
        }
        return r.json();
      })
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-destructive">{error}</p>
      </Card>
    );
  }

  if (!stats) return null;

  const { llmProvider, overview, charts, recent, breakdown, cost } = stats;

  return (
    <div className="space-y-6">
      {/* Top metrics cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Users}
          label="Total Pengguna"
          value={overview.totalUsers.toLocaleString("id-ID")}
          sub={`${overview.todayUsers} baru hari ini`}
          trend={overview.todayUsers > 0 ? "up" : undefined}
          trendValue={overview.todayUsers > 0 ? `+${overview.todayUsers}` : undefined}
        />
        <MetricCard
          icon={FileText}
          label="Total PRD"
          value={overview.totalPrds.toLocaleString("id-ID")}
          sub={`${overview.todayPrds} dibuat hari ini`}
          trend={overview.prdGrowthPct > 0 ? "up" : overview.prdGrowthPct < 0 ? "down" : undefined}
          trendValue={`${overview.prdGrowthPct > 0 ? "+" : ""}${overview.prdGrowthPct}%`}
        />
        <MetricCard
          icon={Activity}
          label="PRD 7 Hari"
          value={overview.last7dPrds.toLocaleString("id-ID")}
          sub={`${overview.last30dPrds} dalam 30 hari`}
        />
        <MetricCard
          icon={TrendingUp}
          label="Avg PRD/User"
          value={overview.avgPrdPerUser.toString()}
          sub={`${overview.last30dChatThreads} revisi 30 hari`}
        />
      </div>

      {/* LLM Provider */}
      <Card>
        <div className="flex items-center gap-3 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Cpu className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">LLM Provider Aktif</p>
            <p className="font-display text-lg font-bold">
              {llmProvider.active === "agentrouter-glm" ? "AgentRouter GLM" : llmProvider.active === "anthropic-claude" ? "Anthropic Claude" : "None"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Model</p>
            <p className="font-mono text-sm font-semibold">{llmProvider.model}</p>
          </div>
        </div>
      </Card>

      {/* Cost overview */}
      <Card className="overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-yellow-500/60 via-yellow-500/40 to-transparent" />
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-500">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Estimasi biaya 30 hari</p>
              <p className="font-display text-2xl font-bold">
                ${cost.estimated30d.toFixed(2)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                ${cost.prdCost30d.toFixed(2)} PRD + ${cost.revisionCost30d.toFixed(2)} revisi
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-500">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Estimasi biaya total</p>
              <p className="font-display text-2xl font-bold">
                ${cost.estimatedTotal.toFixed(2)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Sejak launch
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Asumsi cost</p>
              <p className="font-mono text-sm font-semibold">
                ${cost.costPerPrd.toFixed(3)}/PRD
              </p>
              <p className="font-mono text-[10px] text-muted-foreground">
                ${cost.costPerRevision.toFixed(3)}/revisi
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="PRD Dibuat (30 hari)"
          data={charts.dailyPrds}
          color="accent"
        />
        <ChartCard
          title="Pengguna Baru (30 hari)"
          data={charts.dailyUsers}
          color="teal"
        />
      </div>

      {/* Recent activity + Breakdown */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent signups */}
        <Card className="lg:col-span-1">
          <div className="border-b border-border/40 px-4 py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4 text-accent" /> Pengguna Terbaru
            </h3>
          </div>
          <ScrollArea className="h-[320px]">
            <div className="divide-y divide-border/40">
              {recent.users.length === 0 ? (
                <p className="p-4 text-center text-xs text-muted-foreground">
                  Belum ada pengguna
                </p>
              ) : (
                recent.users.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 p-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                      {(u.name || u.email)[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">
                        {u.name || u.email}
                      </p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {u.email}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      {u.role === "admin" && (
                        <Badge variant="outline" className="border-accent/40 text-[9px] text-accent">
                          ADMIN
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {formatRelative(u.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Recent PRDs */}
        <Card className="lg:col-span-2">
          <div className="border-b border-border/40 px-4 py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4 text-accent" /> PRD Terbaru
            </h3>
          </div>
          <ScrollArea className="h-[320px]">
            <div className="divide-y divide-border/40">
              {recent.prds.length === 0 ? (
                <p className="p-4 text-center text-xs text-muted-foreground">
                  Belum ada PRD
                </p>
              ) : (
                recent.prds.map((p) => (
                  <Link
                    key={p.id}
                    href={`/prd/${p.id}`}
                    className="flex items-start gap-3 p-3 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <FileText className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{p.title}</p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {p.summary || "Tanpa ringkasan"}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        oleh {p.user.name || p.user.email} · {formatRelative(p.createdAt)}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>

      {/* Provider breakdown */}
      <Card>
        <div className="border-b border-border/40 px-4 py-3">
          <h3 className="text-sm font-semibold">Breakdown Auth Provider</h3>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-3">
            {breakdown.providers.map((p) => (
              <div
                key={p.provider}
                className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2"
              >
                <span className="text-xs font-medium capitalize">{p.provider}</span>
                <Badge variant="secondary" className="text-[10px]">
                  {p.count} user
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  trendValue,
}: {
  icon: any;
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down";
  trendValue?: string;
}) {
  return (
    <Card className="card-hover-lift">
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Icon className="h-4 w-4" />
          </div>
          {trend && trendValue && (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                trend === "up" ? "text-emerald-600" : "text-destructive"
              }`}
            >
              {trend === "up" ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {trendValue}
            </span>
          )}
        </div>
        <p className="font-display text-2xl font-bold">{value}</p>
        <p className="text-xs font-medium text-foreground/80">{label}</p>
        {sub && <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>}
      </div>
    </Card>
  );
}

function ChartCard({
  title,
  data,
  color,
}: {
  title: string;
  data: { date: string; count: number }[];
  color: "accent" | "teal";
}) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const colorClass = color === "accent" ? "bg-accent" : "bg-emerald-500";
  const hoverClass = color === "accent" ? "hover:bg-accent/80" : "hover:bg-emerald-500/80";

  return (
    <Card>
      <div className="border-b border-border/40 px-5 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{title}</h3>
          <span className="text-xs text-muted-foreground">
            Total: {total}
          </span>
        </div>
      </div>
      <div className="p-5">
        <div className="flex h-40 items-end gap-[2px]">
          {data.map((d, i) => {
            const height = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
            const showLabel = i % 5 === 0; // label every 5 days
            return (
              <div
                key={d.date}
                className="group relative flex flex-1 flex-col items-center gap-1"
                style={{ minWidth: 0 }}
              >
                <div className="relative flex w-full flex-1 items-end justify-center">
                  <div
                    className={`w-full rounded-sm ${colorClass} ${hoverClass} transition-all`}
                    style={{
                      height: `${Math.max(height, d.count > 0 ? 4 : 0)}%`,
                      minHeight: d.count > 0 ? "2px" : "0",
                    }}
                  />
                  {/* Tooltip */}
                  <div className="absolute -top-8 hidden whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background group-hover:block">
                    {d.count} · {formatDate(d.date)}
                  </div>
                </div>
                {showLabel && (
                  <span className="text-[9px] text-muted-foreground">
                    {formatDateShort(d.date)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "baru saja";
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffHr < 24) return `${diffHr} jam lalu`;
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return formatDateShort(iso);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

import { requireAdmin } from "@/lib/session";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AdminDashboardClient } from "@/components/admin-dashboard-client";
import { AlertCircle } from "lucide-react";

export const metadata = {
  title: "Admin Dashboard",
};

export default async function AdminPage() {
  const user = await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full border border-accent/40 bg-accent/[0.04] px-2.5 py-0.5 text-xs font-medium text-accent">
                ADMIN
              </span>
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                Dashboard
              </p>
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Admin Overview
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Halo {user.name || user.email}. Pantau penggunaan PRDKit, biaya API,
              dan aktivitas user.
            </p>
          </div>

          {/* Warning banner */}
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/[0.04] p-3 text-xs">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-500" />
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">
                Catatan biaya:
              </span>{" "}
              Estimasi biaya dihitung berdasarkan asumsi{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
                COST_PER_PRD
              </code>{" "}
              dan{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
                COST_PER_REVISION
              </code>{" "}
              di env var. Aktual bisa berbeda — cek billing Anthropic untuk
              angka pasti.
            </p>
          </div>

          <AdminDashboardClient />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

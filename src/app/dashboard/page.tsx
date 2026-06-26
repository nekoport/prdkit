import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DashboardClient } from "@/components/dashboard-client";
import { StatsBranding } from "@/components/stats-branding";
import { DonationButton } from "@/components/donation-button";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function DashboardPage() {
  const user = await requireUser();
  const prds = await db.prdDocument.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      summary: true,
      tags: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                Dashboard
              </p>
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Halo, {user.name || user.email.split("@")[0]}.
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Kamu punya{" "}
                <span className="font-medium text-foreground">{prds.length}</span>{" "}
                PRD tersimpan.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <DonationButton
                variant="outline"
                size="lg"
                className="h-11 rounded-full"
              />
              <Button
                asChild
                size="lg"
                className="cta-glow h-11 gap-2 rounded-full px-6"
              >
                <Link href="/new">
                  <Plus className="h-4 w-4" /> Bikin PRD
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats branding */}
          <div className="mb-10">
            <StatsBranding variant="card" />
          </div>

          <DashboardClient initialPrds={prds} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

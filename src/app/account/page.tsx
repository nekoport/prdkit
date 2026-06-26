import { requireUser } from "@/lib/session";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AccountSettingsClient } from "@/components/account-settings-client";
import { db } from "@/lib/db";

export const metadata = {
  title: "Pengaturan Akun",
};

export default async function AccountPage() {
  const user = await requireUser();

  const stats = await db.user.findUnique({
    where: { id: user.id },
    select: {
      _count: {
        select: {
          prdDocuments: true,
          chatThreads: true,
        },
      },
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
          {/* Header */}
          <div className="mb-8">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Pengaturan
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Akun
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Kelola akun PRDKit kamu. Email: {user.email}
            </p>
          </div>

          <AccountSettingsClient
            userEmail={user.email}
            userName={user.name || ""}
            userRole={user.role}
            prdCount={stats?._count.prdDocuments || 0}
            chatCount={stats?._count.chatThreads || 0}
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

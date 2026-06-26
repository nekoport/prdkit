import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PrdViewerClient } from "@/components/prd-viewer-client";

export default async function PrdViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const prd = await db.prdDocument.findFirst({
    where: { id, userId: user.id },
    select: {
      id: true,
      title: true,
      idea: true,
      markdown: true,
      tags: true,
      createdAt: true,
      updatedAt: true,
      chatThreads: {
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: { id: true, messages: true },
      },
    },
  });

  if (!prd) notFound();

  let initialMessages: any[] = [];
  if (prd.chatThreads[0]?.messages) {
    try {
      initialMessages = JSON.parse(prd.chatThreads[0].messages);
    } catch {
      initialMessages = [];
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <PrdViewerClient
          prd={{
            id: prd.id,
            title: prd.title,
            idea: prd.idea,
            markdown: prd.markdown,
            tags: prd.tags,
            updatedAt: prd.updatedAt.toISOString(),
          }}
          initialMessages={initialMessages}
        />
      </main>
      <SiteFooter />
    </div>
  );
}

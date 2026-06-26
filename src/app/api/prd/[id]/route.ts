import { NextRequest, NextResponse } from "next/server";
import { requireUserApi } from "@/lib/session";
import { db } from "@/lib/db";
import { revisePrd } from "@/lib/llm";
import { extractSummary, extractTitle } from "@/lib/prd-prompt";
import { z } from "zod";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUserApi();
    const { id } = await params;
    const prd = await db.prdDocument.findFirst({
      where: { id, userId: user.id },
      select: {
        id: true,
        title: true,
        idea: true,
        markdown: true,
        summary: true,
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
    if (!prd) {
      return NextResponse.json({ message: "PRD tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json(prd);
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || "Server error" },
      { status: err.status || 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUserApi();
    const { id } = await params;
    const body = await req.json();
    const schema = z.object({
      markdown: z.string().min(50),
      title: z.string().optional(),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Body tidak valid" }, { status: 400 });
    }

    const existing = await db.prdDocument.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ message: "PRD tidak ditemukan" }, { status: 404 });
    }

    const title = parsed.data.title || extractTitle(parsed.data.markdown);
    const summary = extractSummary(parsed.data.markdown);

    const updated = await db.prdDocument.update({
      where: { id },
      data: {
        markdown: parsed.data.markdown,
        title,
        summary,
      },
      select: { id: true, title: true, updatedAt: true },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || "Server error" },
      { status: err.status || 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUserApi();
    const { id } = await params;
    const existing = await db.prdDocument.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ message: "PRD tidak ditemukan" }, { status: 404 });
    }
    await db.prdDocument.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || "Server error" },
      { status: err.status || 500 }
    );
  }
}

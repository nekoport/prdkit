import { NextRequest, NextResponse } from "next/server";
import { requireUserApi } from "@/lib/session";
import { db } from "@/lib/db";
import { revisePrd } from "@/lib/llm";
import { checkChatRevisionLimit } from "@/lib/rate-limit";
import { z } from "zod";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  ts: number;
}

const BodySchema = z.object({
  instruction: z.string().min(5, "Instruksi terlalu pendek").max(2000),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUserApi();
    const { id } = await params;

    const prd = await db.prdDocument.findFirst({
      where: { id, userId: user.id },
      include: { chatThreads: { orderBy: { updatedAt: "desc" }, take: 1 } },
    });
    if (!prd) {
      return NextResponse.json({ message: "PRD tidak ditemukan" }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "Body bukan JSON valid" }, { status: 400 });
    }
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "Input tidak valid" },
        { status: 400 }
      );
    }

    // Load existing chat history
    let thread = prd.chatThreads[0];
    let messages: ChatMessage[] = [];
    if (thread) {
      try {
        messages = JSON.parse(thread.messages) as ChatMessage[];
      } catch {
        messages = [];
      }
    }

    // Add user instruction to history
    const userMsg: ChatMessage = {
      role: "user",
      content: parsed.data.instruction,
      ts: Date.now(),
    };
    messages.push(userMsg);

    // Rate limit chat revisions: 50/day per user
    const rl = await checkChatRevisionLimit(user.id);
    if (!rl.ok) {
      const hoursLeft = Math.ceil((rl.resetAt - Date.now()) / (60 * 60 * 1000));
      return NextResponse.json(
        {
          message: `Limit revisi harian tercapai (${rl.limit}/24 jam). Coba lagi dalam ${hoursLeft} jam.`,
          resetAt: rl.resetAt,
          limit: rl.limit,
        },
        { status: 429 }
      );
    }

    // Call LLM to revise
    const { markdown, model } = await revisePrd(prd.markdown, parsed.data.instruction);

    // Update PRD content
    await db.prdDocument.update({
      where: { id: prd.id },
      data: { markdown },
    });

    // Add assistant message to history
    const assistantMsg: ChatMessage = {
      role: "assistant",
      content: `PRD telah direvisi sesuai instruksi. Model: ${model}.`,
      ts: Date.now(),
    };
    messages.push(assistantMsg);

    // Persist thread
    if (thread) {
      await db.chatThread.update({
        where: { id: thread.id },
        data: { messages: JSON.stringify(messages) },
      });
    } else {
      await db.chatThread.create({
        data: {
          prdId: prd.id,
          userId: user.id,
          messages: JSON.stringify(messages),
        },
      });
    }

    return NextResponse.json({
      markdown,
      model,
      messages: messages.slice(-6), // return last 6 messages for UI
    });
  } catch (err: any) {
    console.error("[POST /api/prd/[id]/chat] error:", err);
    return NextResponse.json(
      { message: err.message || "Server error" },
      { status: err.status || 500 }
    );
  }
}

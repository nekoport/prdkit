import { NextRequest } from "next/server";
import { requireUserApi } from "@/lib/session";
import { db } from "@/lib/db";
import { generatePrd } from "@/lib/llm";
import {
  detectLibraries,
  fetchContext7Docs,
  isContext7Enabled,
} from "@/lib/context7";
import { extractSummary, extractTitle } from "@/lib/prd-prompt";
import { checkPrdGenerateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/security";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BodySchema = z.object({
  idea: z
    .string()
    .min(20, "Ide minimal 20 karakter")
    .max(5000, "Ide maksimal 5000 karakter"),
});

/**
 * POST /api/prd/generate-stream
 *
 * Server-Sent Events (SSE) endpoint untuk streaming PRD generation.
 *
 * Events:
 * - {"type":"progress","step":"analyze","message":"Menganalisis ide..."}
 * - {"type":"chunk","content":"# PRD — ..."}  // partial markdown
 * - {"type":"complete","id":"...","title":"...","model":"..."}
 * - {"type":"error","message":"..."}
 *
 * Client-side: gunakan EventSource atau fetch + ReadableStream.
 */
export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUserApi();
  } catch (err: any) {
    return new Response(
      JSON.stringify({ type: "error", message: err.message || "Unauthorized" }),
      { status: err.status || 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Rate limit
  const rl = await checkPrdGenerateLimit(user.id);
  if (!rl.ok) {
    const hoursLeft = Math.ceil((rl.resetAt - Date.now()) / (60 * 60 * 1000));
    return new Response(
      JSON.stringify({
        type: "error",
        message: `Limit generate PRD harian tercapai (${rl.limit}/24 jam). Coba lagi dalam ${hoursLeft} jam.`,
      }),
      {
        status: 429,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ type: "error", message: "Body bukan JSON valid" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        type: "error",
        message: parsed.error.issues[0]?.message || "Input tidak valid",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  const idea = parsed.data.idea;

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // controller might be closed already
        }
      };

      try {
        // Step 1: Analyze
        send({
          type: "progress",
          step: "analyze",
          message: "Menganalisis ide kamu...",
        });
        await sleep(800);

        // Step 2: Context7 (if enabled)
        const libs = isContext7Enabled() ? detectLibraries(idea) : [];
        if (libs.length > 0) {
          send({
            type: "progress",
            step: "context7",
            message: `Mengambil dokumentasi: ${libs.join(", ")}...`,
          });
          const docs = await fetchContext7Docs(libs);
          const snippets = docs.map((d) => `### ${d.library}\n${d.snippet}`);
          send({
            type: "progress",
            step: "context7_done",
            message: `Dokumentasi siap (${docs.length} library)`,
          });
          await sleep(300);

          // Generate with streaming chunks
          send({
            type: "progress",
            step: "generate",
            message: "AI sedang menyusun PRD...",
          });

          const result = await generatePrd({
            idea,
            context7Snippets: snippets,
            onToken: (chunk) => {
              send({ type: "chunk", content: chunk });
            },
          });
          await finalizePrd(controller, send, user!, idea, result, libs, rl);
        } else {
          // No Context7 needed
          send({
            type: "progress",
            step: "generate",
            message: "AI sedang menyusun PRD...",
          });

          const result = await generatePrd({
            idea,
            onToken: (chunk) => {
              send({ type: "chunk", content: chunk });
            },
          });
          await finalizePrd(controller, send, user!, idea, result, [], rl);
        }
      } catch (err: any) {
        console.error("[SSE generate-stream] error:", err);
        send({
          type: "error",
          message: err.message || "Terjadi kesalahan saat generate PRD.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // disable nginx buffering (Vercel)
    },
  });
}

async function finalizePrd(
  controller: ReadableStreamDefaultController,
  send: (data: any) => void,
  user: { id: string; email: string },
  idea: string,
  result: { markdown: string; model: string; durationMs: number },
  libs: string[],
  rl: { remaining: number; limit: number; resetAt: number }
) {
  if (!result.markdown || result.markdown.length < 200) {
    send({
      type: "error",
      message: "AI menghasilkan PRD yang terlalu pendek. Coba ide yang lebih detail.",
    });
    return;
  }

  const title = extractTitle(result.markdown);
  const summary = extractSummary(result.markdown);
  const tags = libs.length > 0 ? libs.join(",") : null;

  const prd = await db.prdDocument.create({
    data: {
      userId: user.id,
      title,
      idea,
      markdown: result.markdown,
      summary,
      tags,
    },
  });

  auditLog("PRD_GENERATED", {
    userId: user.id,
    email: user.email,
    details: {
      prdId: prd.id,
      model: result.model,
      durationMs: result.durationMs,
      streaming: true,
    },
  });

  send({
    type: "complete",
    id: prd.id,
    title: prd.title,
    model: result.model,
    durationMs: result.durationMs,
    rateLimit: { remaining: rl.remaining - 1, limit: rl.limit },
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

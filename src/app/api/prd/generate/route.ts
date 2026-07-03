import { NextRequest, NextResponse } from "next/server";
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
import { sanitizeError } from "@/lib/error-sanitizer";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BodySchema = z.object({
  idea: z.string().min(20, "Ide minimal 20 karakter").max(5000, "Ide maksimal 5000 karakter"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUserApi();

    // Rate limit: 10 PRD generate per day per user
    const rl = await checkPrdGenerateLimit(user.id);
    if (!rl.ok) {
      const hoursLeft = Math.ceil((rl.resetAt - Date.now()) / (60 * 60 * 1000));
      return NextResponse.json(
        {
          message: `Limit generate PRD harian tercapai (${rl.limit}/24 jam). Coba lagi dalam ${hoursLeft} jam, atau upgrade ke donatur untuk limit lebih tinggi.`,
          resetAt: rl.resetAt,
          limit: rl.limit,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(rl.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rl.resetAt),
            "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          },
        }
      );
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
    const idea = parsed.data.idea;

    // Detect libraries → fetch Context7 docs if enabled
    const libs = isContext7Enabled() ? detectLibraries(idea) : [];
    const docs = await fetchContext7Docs(libs);
    const snippets = docs.map(
      (d) => `### ${d.library}\n${d.snippet}`
    );

    // Generate via LLM
    const result = await generatePrd({
      idea,
      context7Snippets: snippets,
    });

    if (!result.markdown || result.markdown.length < 200) {
      return NextResponse.json(
        { message: "AI menghasilkan PRD yang terlalu pendek. Coba ide yang lebih detail." },
        { status: 422 }
      );
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
      details: { prdId: prd.id, model: result.model, durationMs: result.durationMs },
    });

    return NextResponse.json(
      {
        id: prd.id,
        title: prd.title,
        model: result.model,
        durationMs: result.durationMs,
        rateLimit: { remaining: rl.remaining - 1, limit: rl.limit },
      },
      {
        status: 200,
        headers: {
          "X-RateLimit-Limit": String(rl.limit),
          "X-RateLimit-Remaining": String(rl.remaining - 1),
          "X-RateLimit-Reset": String(rl.resetAt),
        },
      }
    );
  } catch (err: any) {
    const safe = sanitizeError(err, "POST /api/prd/generate");
    return NextResponse.json({ message: safe.message }, { status: safe.status });
  }
}

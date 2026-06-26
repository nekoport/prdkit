import { NextRequest, NextResponse } from "next/server";
import { detectLibraries, fetchContext7Docs, isContext7Enabled } from "@/lib/context7";
import { requireUserApi } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/security";
import { z } from "zod";

const BodySchema = z.object({
  text: z.string().min(1).max(10000),
});

export async function POST(req: NextRequest) {
  try {
    // A01: Require auth — anonymous users cannot trigger external fetch
    const user = await requireUserApi();

    // A06: Rate limit — 20 context7 fetch per user per hour
    const rl = await rateLimit(
      `ctx7:${user.id}`,
      20,
      60 * 60 * 1000
    );
    if (!rl.ok) {
      auditLog("RATE_LIMIT_HIT", {
        userId: user.id,
        email: user.email,
        details: { endpoint: "context7" },
      });
      return NextResponse.json(
        { message: "Rate limit tercapai untuk fetch Context7. Coba lagi nanti." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Input tidak valid" }, { status: 400 });
    }

    if (!isContext7Enabled()) {
      return NextResponse.json({
        enabled: false,
        libraries: [],
        docs: [],
        message: "Context7 API key tidak dikonfigurasi. Set CONTEXT7_API_KEY di .env untuk enable.",
      });
    }

    const libs = detectLibraries(parsed.data.text);
    const docs = await fetchContext7Docs(libs);

    return NextResponse.json({
      enabled: true,
      libraries: libs,
      docs: docs.map((d) => ({ library: d.library, snippet: d.snippet.slice(0, 500) + "..." })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || "Server error" },
      { status: err.status || 500 }
    );
  }
}

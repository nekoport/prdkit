import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Cache stats for 5 minutes to avoid hammering DB
let cache: { value: any; expiresAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export async function GET() {
  try {
    if (cache && cache.expiresAt > Date.now()) {
      return NextResponse.json(cache.value);
    }

    const [userCount, prdCount] = await Promise.all([
      db.user.count(),
      db.prdDocument.count(),
    ]);

    // Format angka: 1234 -> 1.2K, 1234567 -> 1.2M
    const formatNumber = (n: number) => {
      if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
      if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
      return String(n);
    };

    const result = {
      users: userCount,
      prds: prdCount,
      usersFormatted: formatNumber(userCount),
      prdsFormatted: formatNumber(prdCount),
      generatedAt: new Date().toISOString(),
    };

    cache = { value: result, expiresAt: Date.now() + CACHE_TTL };

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err: any) {
    console.error("[GET /api/stats] error:", err);
    // Fail gracefully — return zeros so UI doesn't break
    return NextResponse.json({
      users: 0,
      prds: 0,
      usersFormatted: "0",
      prdsFormatted: "0",
    });
  }
}

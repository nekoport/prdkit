/**
 * Context7 integration.
 *
 * Context7 adalah MCP server yang menyediakan dokumentasi up-to-date
 * untuk library/framework populer. Kita pakai untuk:
 * 1. Resolve nama library → library ID Context7.
 * 2. Fetch dokumentasi terkini sebagai konteks tambahan untuk LLM saat generate PRD.
 *
 * API: https://mcp.context7.com/http (REST-style endpoints)
 * Auth: API key via header CONTEXT7_API_KEY (optional untuk free tier).
 *
 * Kalau tidak ada API key, fungsi akan return empty array (PRD tetap jalan,
 * tapi tanpa konteks terkini — LLM akan rely on training data).
 */

const CONTEXT7_BASE = "https://context7.com/api/v1";

export interface Context7Library {
  id: string;
  name: string;
  description?: string;
}

export interface Context7Doc {
  library: string;
  snippet: string; // ~500-1500 chars of relevant doc
}

const apiKey = process.env.CONTEXT7_API_KEY;

export function isContext7Enabled(): boolean {
  return !!apiKey;
}

/**
 * Detect library mentions in user idea text.
 * Cari kata kunci umum: next.js, react, vue, supabase, prisma, tailwind, dll.
 */
export function detectLibraries(text: string): string[] {
  const lower = text.toLowerCase();
  const known = [
    "next.js",
    "nextjs",
    "react",
    "vue",
    "nuxt",
    "svelte",
    "sveltekit",
    "supabase",
    "prisma",
    "tailwind",
    "shadcn",
    "express",
    "fastify",
    "nestjs",
    "trpc",
    "drizzle",
    "postgres",
    "postgresql",
    "mysql",
    "sqlite",
    "mongodb",
    "redis",
    "stripe",
    "midtrans",
    "xendit",
    "openai",
    "anthropic",
    "claude",
    "vercel",
    "cloudflare",
    "firebase",
    "auth.js",
    "nextauth",
  ];
  return known.filter((lib) => lower.includes(lib));
}

/**
 * Fetch docs dari Context7 untuk library tertentu.
 * Kalau API key tidak tersedia, return empty array.
 */
export async function fetchContext7Docs(
  libraries: string[]
): Promise<Context7Doc[]> {
  if (!apiKey || libraries.length === 0) return [];

  const results: Context7Doc[] = [];
  // Limit ke 3 library pertama untuk hemat token
  for (const lib of libraries.slice(0, 3)) {
    try {
      const res = await fetch(
        `${CONTEXT7_BASE}/search?query=${encodeURIComponent(lib)}`,
        {
          headers: { "CONTEXT7_API_KEY": apiKey },
          signal: AbortSignal.timeout(5000),
        }
      );
      if (!res.ok) continue;
      const data = (await res.json()) as any;
      const libId = data?.results?.[0]?.id;
      if (!libId) continue;

      const docRes = await fetch(
        `${CONTEXT7_BASE}/${libId}?type=txt&topic=overview`,
        {
          headers: { "CONTEXT7_API_KEY": apiKey },
          signal: AbortSignal.timeout(8000),
        }
      );
      if (!docRes.ok) continue;
      const txt = await docRes.text();
      const snippet = txt.slice(0, 1200);
      results.push({ library: lib, snippet });
    } catch {
      // fail silently — Context7 is best-effort
    }
  }
  return results;
}

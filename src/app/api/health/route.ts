import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Health check endpoint untuk monitoring (UptimeRobot, BetterStack, dll).
 *
 * Checks:
 * - Database connection (Prisma)
 * - Critical env vars
 * - LLM API key presence
 *
 * Response:
 * - 200: all healthy
 * - 503: one or more checks failed
 *
 * Don't expose sensitive info — only boolean status.
 */
export async function GET() {
  const checks: Record<string, boolean> = {};
  let allHealthy = true;

  // 1. Database check
  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch {
    checks.database = false;
    allHealthy = false;
  }

  // 2. Critical env vars
  checks.nextauthSecret = !!process.env.NEXTAUTH_SECRET;
  checks.databaseUrl = !!process.env.DATABASE_URL;
  if (!checks.nextauthSecret || !checks.databaseUrl) {
    allHealthy = false;
  }

  // 3. LLM provider (at least one must be present)
  //    Priority: Anthropic > AgentRouter (GLM 5.2)
  checks.llmProvider = !!(
    process.env.ANTHROPIC_API_KEY ||
    process.env.AGENTROUTER_API_KEY
  );
  if (!checks.llmProvider) {
    allHealthy = false;
  }

  // Detail: which provider is active (tanpa bocor key)
  (checks as any).providerActive = (
    process.env.ANTHROPIC_API_KEY ? "anthropic" :
    process.env.AGENTROUTER_API_KEY ? "agentrouter-glm" :
    "none"
  );

  // 4. Optional services (don't fail health if missing, just report)
  checks.email = !!process.env.RESEND_API_KEY;
  checks.redis = !!process.env.UPSTASH_REDIS_REST_URL;
  checks.sentry = !!process.env.NEXT_PUBLIC_SENTRY_DSN;
  checks.context7 = !!process.env.CONTEXT7_API_KEY;
  checks.googleOauth = !!(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );

  const status = allHealthy ? 200 : 503;

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      checks,
      uptime: process.uptime(),
      version: process.env.npm_package_version || "unknown",
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}

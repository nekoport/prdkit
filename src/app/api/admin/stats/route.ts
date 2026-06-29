import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/session";
import { COST_PER_PRD, COST_PER_REVISION } from "@/lib/admin";
import { getActiveProvider } from "@/lib/llm";

export async function GET() {
  let user;
  try {
    user = await requireAdminApi();
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || "Unauthorized" },
      { status: err.status || 401 }
    );
  }

  try {

    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);
    const last7DaysStart = new Date(todayStart.getTime() - 7 * 86400000);
    const last30DaysStart = new Date(todayStart.getTime() - 30 * 86400000);

    // Parallel queries for efficiency
    const [
      totalUsers,
      totalPrds,
      todayUsers,
      todayPrds,
      yesterdayPrds,
      last7dPrds,
      last30dPrds,
      last30dChatThreads,
      last30dUsersAgg,
      last30dPrdsAgg,
      recentUsers,
      recentPrds,
      providerBreakdown,
    ] = await Promise.all([
      db.user.count(),
      db.prdDocument.count(),
      db.user.count({ where: { createdAt: { gte: todayStart } } }),
      db.prdDocument.count({ where: { createdAt: { gte: todayStart } } }),
      db.prdDocument.count({
        where: {
          createdAt: { gte: yesterdayStart, lt: todayStart },
        },
      }),
      db.prdDocument.count({ where: { createdAt: { gte: last7DaysStart } } }),
      db.prdDocument.count({ where: { createdAt: { gte: last30DaysStart } } }),
      db.chatThread.count({
        where: { createdAt: { gte: last30DaysStart } },
      }),
      // Last 30 days users aggregate (group by day)
      db.user.groupBy({
        by: ["createdAt"],
        _count: { _all: true },
        where: { createdAt: { gte: last30DaysStart } },
        orderBy: { createdAt: "asc" },
      }),
      // Last 30 days PRDs aggregate
      db.prdDocument.groupBy({
        by: ["createdAt"],
        _count: { _all: true },
        where: { createdAt: { gte: last30DaysStart } },
        orderBy: { createdAt: "asc" },
      }),
      // Recent signups (10 latest)
      db.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          email: true,
          name: true,
          provider: true,
          role: true,
          emailVerified: true,
          createdAt: true,
        },
      }),
      // Recent PRDs (10 latest)
      db.prdDocument.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          summary: true,
          createdAt: true,
          user: {
            select: { email: true, name: true },
          },
        },
      }),
      // Auth provider breakdown
      db.user.groupBy({
        by: ["provider"],
        _count: { _all: true },
      }),
    ]);

    // Build daily arrays for charts (last 30 days)
    const dailyUsers = buildDailyArray(last30dUsersAgg, last30DaysStart, 30);
    const dailyPrds = buildDailyArray(last30dPrdsAgg, last30DaysStart, 30);

    // Today's PRD growth %
    const prdGrowthPct =
      yesterdayPrds > 0
        ? ((todayPrds - yesterdayPrds) / yesterdayPrds) * 100
        : todayPrds > 0
        ? 100
        : 0;

    // Cost estimation
    const estimatedCostPrds = last30dPrds * COST_PER_PRD;
    const estimatedCostRevisions = last30dChatThreads * COST_PER_REVISION;
    const estimatedCost30d = estimatedCostPrds + estimatedCostRevisions;
    const estimatedCostTotal =
      totalPrds * COST_PER_PRD + last30dChatThreads * COST_PER_REVISION;

    // Avg PRD per user
    const avgPrdPerUser = totalUsers > 0 ? totalPrds / totalUsers : 0;

    return NextResponse.json({
      llmProvider: (() => {
        const active = getActiveProvider();
        const model =
          active === "agentrouter-glm"
            ? process.env.AGENTROUTER_MODEL || "glm-5.2"
            : active === "anthropic-claude"
              ? "claude-sonnet-4-5-20250929"
              : "zai-default";
        return { active, model };
      })(),
      overview: {
        totalUsers,
        totalPrds,
        todayUsers,
        todayPrds,
        yesterdayPrds,
        prdGrowthPct: Math.round(prdGrowthPct * 10) / 10,
        last7dPrds,
        last30dPrds,
        last30dChatThreads,
        avgPrdPerUser: Math.round(avgPrdPerUser * 10) / 10,
      },
      charts: {
        dailyUsers, // [{date: "2025-06-01", count: 3}, ...]
        dailyPrds,
      },
      recent: {
        users: recentUsers.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
          emailVerified: u.emailVerified?.toISOString() || null,
        })),
        prds: recentPrds.map((p) => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
        })),
      },
      breakdown: {
        providers: providerBreakdown.map((p) => ({
          provider: p.provider,
          count: p._count._all,
        })),
      },
      cost: {
        costPerPrd: COST_PER_PRD,
        costPerRevision: COST_PER_REVISION,
        estimated30d: Math.round(estimatedCost30d * 100) / 100,
        estimatedTotal: Math.round(estimatedCostTotal * 100) / 100,
        prdCost30d: Math.round(estimatedCostPrds * 100) / 100,
        revisionCost30d: Math.round(estimatedCostRevisions * 100) / 100,
      },
    });
  } catch (err: any) {
    console.error("[GET /api/admin/stats] error:", err);
    return NextResponse.json(
      { message: err.message || "Server error" },
      { status: 500 }
    );
  }
}

/**
 * Build array of {date, count} for last N days.
 * Fills missing days with 0.
 */
function buildDailyArray(
  agg: { createdAt: Date; _count: { _all: number } }[],
  startDate: Date,
  numDays: number
) {
  const result: { date: string; count: number }[] = [];
  const dateMap = new Map<string, number>();

  for (const item of agg) {
    const d = new Date(item.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    dateMap.set(key, (dateMap.get(key) || 0) + item._count._all);
  }

  for (let i = 0; i < numDays; i++) {
    const d = new Date(startDate.getTime() + i * 86400000);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    result.push({
      date: key,
      count: dateMap.get(key) || 0,
    });
  }

  return result;
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { COST_PER_PRD, COST_PER_REVISION } from "@/lib/admin";
import { auditLog } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cron job untuk check biaya API harian.
 * Run daily via Vercel Cron (lihat vercel.json).
 *
 * Logic:
 * - Hitung biaya 24 jam terakhir (PRD generate + chat revision)
 * - Kalau > DAILY_COST_ALERT_THRESHOLD (default $5), kirim email alert ke admin
 * - Kalau > DAILY_COST_CRITICAL_THRESHOLD (default $20), kirim alert urgent
 *
 * Security:
 * - Hanya bisa di-call dengan CRON_SECRET header (Vercel Cron auto-set ini)
 * - Tanpa secret, return 401
 *
 * Setup di Vercel:
 * 1. Set env var: CRON_SECRET (generate random 32-byte)
 * 2. Set env var: ADMIN_EMAIL_FOR_ALERTS (email penerima alert)
 * 3. Set env var: DAILY_COST_ALERT_THRESHOLD (default 5)
 * 4. Set env var: DAILY_COST_CRITICAL_THRESHOLD (default 20)
 * 5. vercel.json sudah configure cron schedule (daily at 00:00 UTC)
 */

const ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL;
const ALERT_THRESHOLD = parseFloat(process.env.DAILY_COST_ALERT_THRESHOLD || "5");
const CRITICAL_THRESHOLD = parseFloat(
  process.env.DAILY_COST_CRITICAL_THRESHOLD || "20"
);

export async function GET(req: NextRequest) {
  // Verify CRON_SECRET
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    // Don't leak whether secret is configured — return 401 generic
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Hitung aktivitas 24 jam terakhir
    const [prdCount24h, chatCount24h] = await Promise.all([
      db.prdDocument.count({
        where: { createdAt: { gte: yesterday } },
      }),
      db.chatThread.count({
        where: { createdAt: { gte: yesterday } },
      }),
    ]);

    const cost24h =
      prdCount24h * COST_PER_PRD + chatCount24h * COST_PER_REVISION;

    // Hitung total sejak launch
    const [totalPrds, totalChats] = await Promise.all([
      db.prdDocument.count(),
      db.chatThread.count(),
    ]);
    const totalCost = totalPrds * COST_PER_PRD + totalChats * COST_PER_REVISION;

    const result = {
      timestamp: now.toISOString(),
      period: "24h",
      prdGenerated: prdCount24h,
      chatRevisions: chatCount24h,
      cost24h: Math.round(cost24h * 1000) / 1000,
      totalPrds,
      totalChats,
      totalCost: Math.round(totalCost * 1000) / 1000,
      alertThreshold: ALERT_THRESHOLD,
      criticalThreshold: CRITICAL_THRESHOLD,
      alertTriggered: false,
      alertLevel: "none" as "none" | "warning" | "critical",
    };

    // Trigger alert kalau cost melebihi threshold
    if (cost24h >= CRITICAL_THRESHOLD) {
      result.alertTriggered = true;
      result.alertLevel = "critical";
      await sendCostAlertEmail(result, "critical");
      auditLog("SUSPICIOUS_ACTIVITY", {
        details: {
          reason: "cost_critical_threshold_exceeded",
          cost24h: result.cost24h,
          threshold: CRITICAL_THRESHOLD,
        },
      });
    } else if (cost24h >= ALERT_THRESHOLD) {
      result.alertTriggered = true;
      result.alertLevel = "warning";
      await sendCostAlertEmail(result, "warning");
      auditLog("SUSPICIOUS_ACTIVITY", {
        details: {
          reason: "cost_alert_threshold_exceeded",
          cost24h: result.cost24h,
          threshold: ALERT_THRESHOLD,
        },
      });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[CRON cost-check] error:", err);
    return NextResponse.json(
      { message: "Cron job failed", error: err.message },
      { status: 500 }
    );
  }
}

async function sendCostAlertEmail(
  data: any,
  level: "warning" | "critical"
): Promise<void> {
  if (!ADMIN_ALERT_EMAIL) {
    console.log(
      `[cron] ADMIN_ALERT_EMAIL not set, skip email. Alert level: ${level}`
    );
    return;
  }

  const resendKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;
  if (!resendKey || !emailFrom) {
    console.log(
      `[cron] Resend not configured, skip email. Alert level: ${level}`
    );
    return;
  }

  const subject =
    level === "critical"
      ? `[URGENT] PRDKit cost critical: $${data.cost24h} in 24h`
      : `[Alert] PRDKit cost warning: $${data.cost24h} in 24h`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
  <div style="background: white; border-radius: 12px; padding: 32px; border: 1px solid #e5e3df;">
    <h1 style="color: ${level === "critical" ? "#dc2626" : "#f59e0b"}; margin: 0 0 16px;">
      ${level === "critical" ? "🚨 Critical" : "⚠️ Warning"}: Cost Alert
    </h1>
    <p style="font-size: 14px; color: #555; line-height: 1.6;">
      Biaya API PRDKit 24 jam terakhir melebihi threshold.
    </p>
    <table style="width: 100%; margin: 24px 0; border-collapse: collapse;">
      <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Period</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">Last 24 hours</td></tr>
      <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">PRD generated</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">${data.prdGenerated}</td></tr>
      <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Chat revisions</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">${data.chatRevisions}</td></tr>
      <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Cost 24h</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 700; color: ${level === "critical" ? "#dc2626" : "#f59e0b"};">$${data.cost24h}</td></tr>
      <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Total cost (since launch)</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: 600;">$${data.totalCost}</td></tr>
      <tr><td style="padding: 8px; color: #666;">Threshold (${level})</td><td style="padding: 8px; font-weight: 600;">$${level === "critical" ? data.criticalThreshold : data.alertThreshold}</td></tr>
    </table>
    <p style="font-size: 13px; color: #555; line-height: 1.6;">
      ${level === "critical"
        ? "Biaya mencapai level critical. Pertimbangkan: cek aktivitas user suspicious, temporary disable signup, atau review rate limit."
        : "Biaya mendekati threshold critical. Monitor trending, pertimbangkan adjust rate limit kalau perlu."}
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
    <p style="font-size: 12px; color: #888; margin: 0;">
      Email ini dikirim otomatis oleh Vercel Cron (daily 00:00 UTC). Cek billing Anthropic untuk angka pasti.
    </p>
  </div>
</body>
</html>
`.trim();

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom,
        to: ADMIN_ALERT_EMAIL,
        subject,
        html,
      }),
    });
    if (!res.ok) {
      console.error("[cron] Resend error:", await res.text());
    }
  } catch (err) {
    console.error("[cron] Failed to send cost alert email:", err);
  }
}

/**
 * Rate limiter — simple in-memory Map (single-instance dev).
 *
 * Production multi-instance (Vercel): set UPSTASH_REDIS_REST_URL + TOKEN,
 * then uncomment the Upstash branch below.
 *
 * Limit: 10 PRD generate per user per 24h (free tier protection)
 *       50 chat revisions per user per 24h
 *       30 auth attempts per IP per hour (anti brute-force)
 */

interface RateBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateBucket>();

// Cleanup expired entries every 5 minutes
let lastCleanup = Date.now();
function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 5 * 60 * 1000) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  cleanup();

  // Production: use Upstash Redis
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return rateLimitUpstash(key, limit, windowMs);
  }

  // Dev: in-memory
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    const bucket: RateBucket = { count: 1, resetAt: now + windowMs };
    buckets.set(key, bucket);
    return { ok: true, remaining: limit - 1, resetAt: bucket.resetAt, limit };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      resetAt: existing.resetAt,
      limit,
    };
  }

  existing.count += 1;
  return {
    ok: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
    limit,
  };
}

async function rateLimitUpstash(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  // Upstash Redis REST API — fixed-window counter
  // INCR + EXPIRE pattern
  const url = `${process.env.UPSTASH_REDIS_REST_URL}/incr/${encodeURIComponent(
    key
  )}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      },
    });
    if (!res.ok) throw new Error(`Upstash error: ${res.status}`);
    const data = (await res.json()) as { result: number };
    const count = data.result;

    if (count === 1) {
      // Set expiry on first hit
      await fetch(
        `${process.env.UPSTASH_REDIS_REST_URL}/expire/${encodeURIComponent(
          key
        )}/${Math.ceil(windowMs / 1000)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
          },
        }
      );
    }

    return {
      ok: count <= limit,
      remaining: Math.max(0, limit - count),
      resetAt: Date.now() + windowMs,
      limit,
    };
  } catch (err) {
    // Fail open (allow request) if Redis is down — better than blocking legit users
    console.error("[rate-limit] Upstash error, failing open:", err);
    return { ok: true, remaining: limit, resetAt: Date.now() + windowMs, limit };
  }
}

// Preset limits
export const LIMITS = {
  PRD_GENERATE: { limit: 10, windowMs: 24 * 60 * 60 * 1000 }, // 10/day
  CHAT_REVISION: { limit: 50, windowMs: 24 * 60 * 60 * 1000 }, // 50/day
  AUTH_ATTEMPT: { limit: 30, windowMs: 60 * 60 * 1000 }, // 30/hour
  SIGNUP: { limit: 5, windowMs: 60 * 60 * 1000 }, // 5/hour per IP
} as const;

export async function checkPrdGenerateLimit(userId: string) {
  return rateLimit(
    `prd-gen:${userId}`,
    LIMITS.PRD_GENERATE.limit,
    LIMITS.PRD_GENERATE.windowMs
  );
}

export async function checkChatRevisionLimit(userId: string) {
  return rateLimit(
    `chat-rev:${userId}`,
    LIMITS.CHAT_REVISION.limit,
    LIMITS.CHAT_REVISION.windowMs
  );
}

export async function checkAuthLimit(ip: string) {
  return rateLimit(
    `auth:${ip}`,
    LIMITS.AUTH_ATTEMPT.limit,
    LIMITS.AUTH_ATTEMPT.windowMs
  );
}

export async function checkSignupLimit(ip: string) {
  return rateLimit(
    `signup:${ip}`,
    LIMITS.SIGNUP.limit,
    LIMITS.SIGNUP.windowMs
  );
}

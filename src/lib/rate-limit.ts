// Simple in-memory fixed-window rate limiter.
// SECURITY WARNING: This is a basic implementation with limitations:
// - Resets on server restart, allowing bypass via restart attacks
// - Does not share state across multiple instances/serverless invocations
// - Memory can grow unbounded under attack (pruned at MAX_BUCKETS)
// For production/multi-instance deployments, use Redis/Upstash instead.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function prune() {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Returns rate limit status including remaining attempts and reset time.
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimitWithInfo(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  if (buckets.size > MAX_BUCKETS) prune();

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  
  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }
  
  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}

/**
 * Returns true if the request is allowed, false if the limit is exceeded.
 * @deprecated Use rateLimitWithInfo for better visibility into rate limit status
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  return rateLimitWithInfo(key, limit, windowMs).allowed;
}

/** Extract a client key (best-effort IP) from request headers. */
export function clientKey(headers: Headers, suffix = ""): string {
  const ip =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown";
  return suffix ? `${ip}:${suffix}` : ip;
}

// Presets
export const AUTH_LIMIT = { limit: 5, windowMs: 10 * 60_000 }; // 5 attempts / 10 min
export const OTP_VERIFY_LIMIT = { limit: 3, windowMs: 15 * 60_000 }; // 3 attempts / 15 min (brute force protection)

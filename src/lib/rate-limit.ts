// Simple in-memory fixed-window rate limiter.
// Note: per-process memory — resets on restart and does not share state
// across multiple instances/serverless invocations. For multi-instance
// deployments, back this with Redis/Upstash instead.

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
 * Returns true if the request is allowed, false if the limit is exceeded.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (buckets.size > MAX_BUCKETS) prune();

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
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

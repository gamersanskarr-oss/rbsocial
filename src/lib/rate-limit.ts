import "server-only";
import { headers } from "next/headers";

/**
 * In-memory sliding-window rate limiter for server actions.
 *
 * Limits are per-server-instance — on Vercel (multiple lambdas) an attacker
 * could multiply the cap by instance count, so treat these as abuse
 * brakes, not hard walls. Firestore-write cost stays bounded either way.
 */
type Bucket = { count: number; resetAt: number };

const g = globalThis as unknown as { __rateBuckets?: Map<string, Bucket> };
const buckets = () => (g.__rateBuckets ??= new Map<string, Bucket>());

/** Caller IP from the proxy headers (Vercel sets x-forwarded-for). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

/** Returns true if the call is within `limit` hits per `windowMs`. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const map = buckets();

  // Lazy sweep so the map can't grow unbounded.
  if (map.size > 5000) {
    for (const [k, b] of map) if (b.resetAt <= now) map.delete(k);
  }

  const b = map.get(key);
  if (!b || b.resetAt <= now) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count++;
  return true;
}

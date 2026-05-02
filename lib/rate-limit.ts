// In-memory rate limiter. State resets on serverless cold starts.
// For persistent cross-instance limiting, replace with Upstash Redis.

interface Entry { count: number; resetAt: number; }
const store = new Map<string, Entry>();

/** Returns true if the request is ALLOWED (within limit). */
export function checkRateLimit(key: string, maxRequests: number, windowSecs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowSecs * 1000 });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

// Prune expired entries to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const [k, e] of store) if (now > e.resetAt) store.delete(k);
}, 60_000);

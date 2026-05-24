/**
 * In-memory rate limiter for webhook endpoints
 * Prevents abuse by limiting requests per API key per time window
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Store: "apiKey:timeWindow" -> { count, resetAt }
const requestCounts = new Map<string, RateLimitEntry>();

// Cleanup interval
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of requestCounts.entries()) {
    if (entry.resetAt < now) {
      requestCounts.delete(key);
    }
  }
  // Also cleanup if map gets too large
  if (requestCounts.size > 10000) {
    const entriesToDelete = Math.floor(requestCounts.size * 0.1);
    let deleted = 0;
    for (const [key] of requestCounts.entries()) {
      if (deleted >= entriesToDelete) break;
      requestCounts.delete(key);
      deleted++;
    }
  }
}, 60000); // Cleanup every minute

/**
 * Check if request is within rate limit
 * @param apiKey The API key making the request
 * @param limit Max requests per window (default: 10)
 * @param windowMs Time window in milliseconds (default: 60000 = 1 minute)
 * @returns true if within limit, false if rate limited
 */
export function checkRateLimit(
  apiKey: string,
  limit: number = 10,
  windowMs: number = 60000
): boolean {
  if (!apiKey) {
    return false; // No API key provided
  }

  const now = Date.now();
  const timeWindow = Math.floor(now / windowMs);
  const key = `${apiKey}:${timeWindow}`;

  const current = requestCounts.get(key) || {
    count: 0,
    resetAt: now + windowMs,
  };

  if (current.count >= limit) {
    return false; // Rate limit exceeded
  }

  current.count++;
  requestCounts.set(key, current);

  return true; // Within limit
}

/**
 * Get current request count for debugging
 */
export function getRateLimitStatus(apiKey: string, windowMs: number = 60000): { count: number; limit: number; remaining: number } {
  const now = Date.now();
  const timeWindow = Math.floor(now / windowMs);
  const key = `${apiKey}:${timeWindow}`;
  const limit = 10;

  const current = requestCounts.get(key);
  const count = current?.count || 0;

  return {
    count,
    limit,
    remaining: Math.max(0, limit - count),
  };
}

/**
 * Reset rate limit for an API key (admin function)
 */
export function resetRateLimit(apiKey: string, windowMs: number = 60000): void {
  const now = Date.now();
  const timeWindow = Math.floor(now / windowMs);
  const key = `${apiKey}:${timeWindow}`;
  requestCounts.delete(key);
}

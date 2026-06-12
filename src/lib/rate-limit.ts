type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

declare global {
  var rateLimitCache: Map<string, RateLimitEntry> | undefined;
}

const cache = global.rateLimitCache ?? new Map<string, RateLimitEntry>();
global.rateLimitCache = cache;

export function checkRateLimit({ key, limit, windowMs }: RateLimitOptions) {
  const now = Date.now();
  const existingEntry = cache.get(key);

  if (!existingEntry || existingEntry.resetAt <= now) {
    cache.set(key, {
      count: 1,
      resetAt: now + windowMs
    });

    return {
      allowed: true,
      remaining: limit - 1,
      retryAfterSeconds: 0
    };
  }

  if (existingEntry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((existingEntry.resetAt - now) / 1000)
    };
  }

  existingEntry.count += 1;

  return {
    allowed: true,
    remaining: limit - existingEntry.count,
    retryAfterSeconds: 0
  };
}

export function resetRateLimitCache() {
  cache.clear();
}

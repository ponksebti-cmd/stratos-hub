// middleware/rateLimit.js — In-memory token-bucket rate limiter
// No external dependencies — works with Bun's built-in runtime.

const store = new Map(); // storeKey → { count, resetAt }

// Purge expired buckets every 2 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of store.entries()) {
    if (val.resetAt <= now) store.delete(key);
  }
}, 2 * 60_000).unref?.();

function createLimiter({ windowMs, max, keyPrefix = "" }) {
  return function check(ip, extra = "") {
    const storeKey = `${keyPrefix}:${ip}:${extra}`;
    const now = Date.now();
    const existing = store.get(storeKey);

    if (!existing || existing.resetAt <= now) {
      store.set(storeKey, { count: 1, resetAt: now + windowMs });
      return { limited: false, remaining: max - 1, retryAfter: 0 };
    }

    existing.count += 1;
    const remaining = Math.max(0, max - existing.count);
    const retryAfter = Math.ceil((existing.resetAt - now) / 1000);

    if (existing.count > max) {
      return { limited: true, remaining: 0, retryAfter };
    }

    return { limited: false, remaining, retryAfter: 0 };
  };
}

// Strict: 10 attempts per IP per 15 min — auth endpoints
export const authLimiter = createLimiter({
  windowMs: 15 * 60_000,
  max: 10,
  keyPrefix: "auth",
});

// Standard: 120 requests per IP per minute — authenticated API
export const apiLimiter = createLimiter({
  windowMs: 60_000,
  max: 120,
  keyPrefix: "api",
});

// Widget chat: 20 messages per IP per minute — public endpoint
export const widgetLimiter = createLimiter({
  windowMs: 60_000,
  max: 20,
  keyPrefix: "widget",
});

// Webhook: 50 per IP per minute — external service callbacks
export const webhookLimiter = createLimiter({
  windowMs: 60_000,
  max: 50,
  keyPrefix: "webhook",
});

export function rateLimitResponse(retryAfter) {
  return Response.json(
    { error: "Too many requests. Please slow down and try again." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": "0",
      },
    }
  );
}

// Extract the real client IP (Railway/Nginx set X-Forwarded-For)
export function getClientIP(req) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Minimal in-memory rate limiter (no external dependency).
 * Protects auth endpoints from brute-force / abuse.
 */

const createRateLimiter = ({ windowMs = 60 * 1000, max = 20, message }) => {
  const hits = new Map(); // key -> { count, resetAt }

  const cleanup = (now) => {
    for (const [key, entry] of hits.entries()) {
      if (entry.resetAt <= now) {
        hits.delete(key);
      }
    }
  };

  return (req, res, next) => {
    const now = Date.now();
    cleanup(now);

    const key = req.ip || req.socket?.remoteAddress || "unknown";
    const entry = hits.get(key) || { count: 0, resetAt: now + windowMs };

    if (entry.resetAt <= now) {
      entry.count = 0;
      entry.resetAt = now + windowMs;
    }

    entry.count += 1;
    hits.set(key, entry);

    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - entry.count)));

    if (entry.count > max) {
      return res.status(429).json({
        status: "error",
        message: message || "Too many requests. Please try again later.",
      });
    }

    next();
  };
};

module.exports = { createRateLimiter };

const redis = require('../config/redis');

async function aiRateLimiter(req, res, next) {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const key = `analyze:count:${userId}:${today}`;

    const count = await redis.get(key);
    const currentCount = parseInt(count || '0', 10);

    if (currentCount >= 30) {
      return res.status(429).json({
        success: false,
        error: 'Daily AI analysis limit reached (30/day). Try again tomorrow.',
        code: 'RATE_LIMIT_EXCEEDED',
      });
    }

    await redis.incr(key);
    if (currentCount === 0) {
      await redis.expire(key, 86400); // 24 hours TTL
    }

    req.aiCallCount = currentCount + 1;
    next();
  } catch (err) {
    console.error('Rate limiter error:', err.message);
    next(); // fail open — don't block if Redis is down
  }
}

module.exports = { aiRateLimiter };

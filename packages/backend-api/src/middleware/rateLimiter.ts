import { Request, Response, NextFunction } from 'express';
import redis from '../config/redis';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipIf?: (req: Request) => boolean; // Skip rate limiting condition
  message?: string; // Custom error message
}

export const createRateLimiter = (options: RateLimitOptions) => {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req) => req.ip || 'unknown',
    skipIf = () => false,
    message = 'Too many requests, please try again later.'
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip rate limiting if condition is met
      if (skipIf(req)) {
        return next();
      }

      const key = `rate_limit:${keyGenerator(req)}`;
      const currentTime = Date.now();
      const windowStart = currentTime - windowMs;

      // Use Redis to track requests
      const multi = redis.multi();
      
      // Remove expired entries
      multi.zRemRangeByScore(key, 0, windowStart);
      
      // Add current request
      multi.zAdd(key, { score: currentTime, value: currentTime.toString() });
      
      // Count requests in window
      multi.zCard(key);
      
      // Set expiration
      multi.expire(key, Math.ceil(windowMs / 1000));
      
      const results = await multi.exec();
      
      if (!results) {
        throw new Error('Redis operation failed');
      }

      const requestCount = results[2] as number;

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, maxRequests - requestCount).toString(),
        'X-RateLimit-Reset': new Date(currentTime + windowMs).toISOString()
      });

      if (requestCount > maxRequests) {
        return res.status(429).json({
          error: message,
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }

      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // Continue without rate limiting if Redis fails
      next();
    }
  };
};

// Pre-configured rate limiters
export const generalRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
});

export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 auth attempts per 15 minutes
  keyGenerator: (req) => `auth:${req.ip}`,
  message: 'Too many authentication attempts, please try again later.'
});

export const dataIngestionRateLimit = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 50, // 50 data uploads per 5 minutes
  keyGenerator: (req) => req.user?.id || req.ip || 'unknown',
  skipIf: (req) => !req.user, // Skip if not authenticated
});

export const leaderboardRateLimit = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: 20, // 20 leaderboard requests per minute
}); 
import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Rate limit: 120 requests per minute per token
export const createRateLimiter = () => {
  return rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 120, // Limit each IP to 120 requests per windowMs
    message: {
      error: {
        code: 'rate_limit_exceeded',
        message: 'Too many requests, please try again later.'
      }
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Use token-based limiting instead of IP
    keyGenerator: (req: Request) => {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7); // Use token as key
      }
      return req.ip || 'anonymous'; // Fallback to IP
    },
    // Custom handler to include rate limit headers
    handler: (req: Request, res: Response) => {
      res.set({
        'X-RateLimit-Limit': '120',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(Date.now() + 60 * 1000).toISOString()
      });
      res.status(429).json({
        error: {
          code: 'rate_limit_exceeded',
          message: 'Too many requests, please try again later.'
        }
      });
    }
  });
};

// Skip rate limiting for health checks
export const skipHealthCheck = (req: Request) => {
  return req.path === '/v1/health';
};

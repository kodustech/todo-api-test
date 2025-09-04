"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.skipHealthCheck = exports.createRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Rate limit: 120 requests per minute per token
const createRateLimiter = () => {
    return (0, express_rate_limit_1.default)({
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
        keyGenerator: (req) => {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                return authHeader.substring(7); // Use token as key
            }
            return req.ip || 'anonymous'; // Fallback to IP
        },
        // Custom handler to include rate limit headers
        handler: (req, res) => {
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
exports.createRateLimiter = createRateLimiter;
// Skip rate limiting for health checks
const skipHealthCheck = (req) => {
    return req.path === '/v1/health';
};
exports.skipHealthCheck = skipHealthCheck;
//# sourceMappingURL=rateLimit.js.map
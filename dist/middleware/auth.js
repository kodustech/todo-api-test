"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.optionalAuth = optionalAuth;
const Error_1 = require("../models/Error");
// Simple in-memory token store (in production, this would be a database/redis)
const VALID_TOKENS = new Set([
    'test-token-123', // For development/testing
    'dev-token-456'
]);
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json((0, Error_1.createErrorResponse)(Error_1.ERROR_CODES.UNAUTHORIZED, 'Authorization header is required'));
        return;
    }
    const token = authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : authHeader;
    if (!token) {
        res.status(401).json((0, Error_1.createErrorResponse)(Error_1.ERROR_CODES.UNAUTHORIZED, 'Bearer token is required'));
        return;
    }
    // In production, validate token against database/API key service
    if (!VALID_TOKENS.has(token)) {
        res.status(401).json((0, Error_1.createErrorResponse)(Error_1.ERROR_CODES.UNAUTHORIZED, 'Invalid or expired token'));
        return;
    }
    // Extract user ID from token (simplified - in production use JWT decoding)
    req.userId = `usr_${token.split('-').pop()}`;
    next();
}
// Health endpoint doesn't require authentication
function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        if (VALID_TOKENS.has(token)) {
            req.userId = `usr_${token.split('-').pop()}`;
        }
    }
    next();
}
//# sourceMappingURL=auth.js.map
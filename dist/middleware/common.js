"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestId = requestId;
exports.extractIdempotencyKey = extractIdempotencyKey;
exports.corsHandler = corsHandler;
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
exports.requestLogger = requestLogger;
const uuid_1 = require("uuid");
const Error_1 = require("../models/Error");
// Request ID middleware
function requestId(req, res, next) {
    req.requestId = (0, uuid_1.v4)();
    res.setHeader('X-Request-ID', req.requestId);
    next();
}
// Idempotency key extraction middleware
function extractIdempotencyKey(req, res, next) {
    const idempotencyKey = req.headers['idempotency-key'];
    if (idempotencyKey) {
        req.idempotencyKey = idempotencyKey;
    }
    next();
}
// CORS middleware
function corsHandler(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Idempotency-Key, If-Match');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    next();
}
// Global error handler
function errorHandler(error, req, res, next) {
    console.error(`Error [${req.requestId}]:`, error);
    // Default error response
    res.status(500).json((0, Error_1.createErrorResponse)(Error_1.ERROR_CODES.INTERNAL_ERROR, 'Internal server error', undefined, req.requestId));
}
// 404 handler
function notFoundHandler(req, res) {
    res.status(404).json((0, Error_1.createErrorResponse)(Error_1.ERROR_CODES.NOT_FOUND, `Route ${req.method} ${req.path} not found`, undefined, req.requestId));
}
// Request logging middleware (simplified)
function requestLogger(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${req.requestId}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    });
    next();
}
//# sourceMappingURL=common.js.map
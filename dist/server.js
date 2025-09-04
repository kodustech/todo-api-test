"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const rateLimit_1 = require("./middleware/rateLimit");
const common_1 = require("./middleware/common");
// Routes
const health_1 = __importDefault(require("./routes/health"));
const tasks_1 = __importDefault(require("./routes/tasks"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // Disable CSP for API
    crossOriginEmbedderPolicy: false
}));
// CORS middleware
app.use(common_1.corsHandler);
// Request logging and ID
app.use(common_1.requestLogger);
app.use(common_1.requestId);
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Idempotency key extraction
app.use(common_1.extractIdempotencyKey);
// Rate limiting (skip health checks)
app.use('/v1', (0, rateLimit_1.createRateLimiter)());
// API versioning
app.use('/v1', health_1.default);
app.use('/v1/tasks', tasks_1.default);
// Handle unimplemented endpoints (Lists, Comments, Webhooks, Batch)
app.use('/v1/lists', (req, res) => {
    res.status(501).json({
        error: {
            code: 'not_implemented',
            message: 'Lists endpoint not implemented in MVP'
        }
    });
});
app.use('/v1/comments', (req, res) => {
    res.status(501).json({
        error: {
            code: 'not_implemented',
            message: 'Comments endpoint not implemented in MVP'
        }
    });
});
app.use('/v1/webhooks', (req, res) => {
    res.status(501).json({
        error: {
            code: 'not_implemented',
            message: 'Webhooks endpoint not implemented in MVP'
        }
    });
});
app.use('/v1/batch', (req, res) => {
    res.status(501).json({
        error: {
            code: 'not_implemented',
            message: 'Batch operations not implemented in MVP'
        }
    });
});
// 404 handler
app.use(common_1.notFoundHandler);
// Error handler (must be last)
app.use(common_1.errorHandler);
// Start server
app.listen(PORT, () => {
    console.log(`🚀 Todo List API MVP v1 running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/v1/health`);
    console.log(`📋 API base URL: http://localhost:${PORT}/v1`);
    console.log(`🔑 Test tokens: test-token-123, dev-token-456`);
});
// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});
//# sourceMappingURL=server.js.map
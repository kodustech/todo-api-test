"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_CODES = void 0;
exports.createErrorResponse = createErrorResponse;
// Common error codes
exports.ERROR_CODES = {
    VALIDATION_ERROR: 'validation_error',
    NOT_FOUND: 'not_found',
    UNAUTHORIZED: 'unauthorized',
    FORBIDDEN: 'forbidden',
    CONFLICT: 'conflict',
    RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
    INTERNAL_ERROR: 'internal_error',
    NOT_IMPLEMENTED: 'not_implemented'
};
// Helper function to create error responses
function createErrorResponse(code, message, details, requestId) {
    return {
        error: {
            code,
            message,
            details,
            requestId
        }
    };
}
//# sourceMappingURL=Error.js.map
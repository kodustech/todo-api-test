export interface ErrorDetail {
    field?: string;
    rule?: string;
    message?: string;
}
export interface ApiError {
    code: string;
    message: string;
    details?: ErrorDetail[];
    requestId?: string;
}
export interface ErrorResponse {
    error: ApiError;
}
export declare const ERROR_CODES: {
    readonly VALIDATION_ERROR: "validation_error";
    readonly NOT_FOUND: "not_found";
    readonly UNAUTHORIZED: "unauthorized";
    readonly FORBIDDEN: "forbidden";
    readonly CONFLICT: "conflict";
    readonly RATE_LIMIT_EXCEEDED: "rate_limit_exceeded";
    readonly INTERNAL_ERROR: "internal_error";
    readonly NOT_IMPLEMENTED: "not_implemented";
};
export declare function createErrorResponse(code: string, message: string, details?: ErrorDetail[], requestId?: string): ErrorResponse;
//# sourceMappingURL=Error.d.ts.map
import { Request } from 'express';
export interface ApiRequest extends Request {
    userId?: string;
    requestId?: string;
    idempotencyKey?: string;
}
export interface HealthResponse {
    status: 'ok';
}
export type Cursor = string;
export interface RateLimitHeaders {
    'X-RateLimit-Limit': number;
    'X-RateLimit-Remaining': number;
    'X-RateLimit-Reset': number;
}
export interface ApiHeaders {
    'Content-Type': 'application/json; charset=utf-8';
    'ETag'?: string;
    'X-Next-Cursor'?: string;
    'X-Prev-Cursor'?: string;
}
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;
export type ApiResponse<T> = {
    success: true;
    data: T;
} | {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Array<{
            field?: string;
            rule?: string;
        }>;
    };
};
//# sourceMappingURL=Api.d.ts.map
import { Request } from 'express';

// Extended Request interface with our custom properties
export interface ApiRequest extends Request {
  userId?: string;
  requestId?: string;
  idempotencyKey?: string;
}

// Health check response
export interface HealthResponse {
  status: 'ok';
}

// Cursor for pagination
export type Cursor = string;

// Rate limit headers
export interface RateLimitHeaders {
  'X-RateLimit-Limit': number;
  'X-RateLimit-Remaining': number;
  'X-RateLimit-Reset': number;
}

// Common response headers
export interface ApiHeaders {
  'Content-Type': 'application/json; charset=utf-8';
  'ETag'?: string;
  'X-Next-Cursor'?: string;
  'X-Prev-Cursor'?: string;
}

// Utility type for making fields optional except for required ones
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

// Utility type for API responses
export type ApiResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field?: string; rule?: string }>;
  };
};

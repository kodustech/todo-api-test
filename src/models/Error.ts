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

// Common error codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'validation_error',
  NOT_FOUND: 'not_found',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  CONFLICT: 'conflict',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  INTERNAL_ERROR: 'internal_error',
  NOT_IMPLEMENTED: 'not_implemented'
} as const;

// Helper function to create error responses
export function createErrorResponse(
  code: string,
  message: string,
  details?: ErrorDetail[],
  requestId?: string
): ErrorResponse {
  return {
    error: {
      code,
      message,
      details,
      requestId
    }
  };
}

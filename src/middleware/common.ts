import { Request, Response, NextFunction } from 'express';
import { ApiRequest } from '../models/Api';
import { v4 as uuidv4 } from 'uuid';
import { createErrorResponse, ERROR_CODES } from '../models/Error';

// Request ID middleware
export function requestId(req: ApiRequest, res: Response, next: NextFunction): void {
  req.requestId = uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
}

// Idempotency key extraction middleware
export function extractIdempotencyKey(req: ApiRequest, res: Response, next: NextFunction): void {
  const idempotencyKey = req.headers['idempotency-key'] as string;
  if (idempotencyKey) {
    req.idempotencyKey = idempotencyKey;
  }
  next();
}

// CORS middleware
export function corsHandler(req: Request, res: Response, next: NextFunction): void {
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
export function errorHandler(
  error: Error,
  req: ApiRequest,
  res: Response,
  next: NextFunction
): void {
  console.error(`Error [${req.requestId}]:`, error);

  // Default error response
  res.status(500).json(createErrorResponse(
    ERROR_CODES.INTERNAL_ERROR,
    'Internal server error',
    undefined,
    req.requestId
  ));
}

// 404 handler
export function notFoundHandler(req: ApiRequest, res: Response): void {
  res.status(404).json(createErrorResponse(
    ERROR_CODES.NOT_FOUND,
    `Route ${req.method} ${req.path} not found`,
    undefined,
    req.requestId
  ));
}

// Request logging middleware (simplified)
export function requestLogger(req: ApiRequest, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.requestId}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });

  next();
}

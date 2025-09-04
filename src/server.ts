import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { createRateLimiter, skipHealthCheck } from './middleware/rateLimit';
import {
  requestId,
  extractIdempotencyKey,
  corsHandler,
  errorHandler,
  notFoundHandler,
  requestLogger
} from './middleware/common';

// Routes
import healthRoutes from './routes/health';
import taskRoutes from './routes/tasks';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API
  crossOriginEmbedderPolicy: false
}));

// CORS middleware
app.use(corsHandler);

// Request logging and ID
app.use(requestLogger);
app.use(requestId);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Idempotency key extraction
app.use(extractIdempotencyKey);

// Rate limiting (skip health checks)
app.use('/v1', createRateLimiter());

// API versioning
app.use('/v1', healthRoutes);
app.use('/v1/tasks', taskRoutes);

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
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

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

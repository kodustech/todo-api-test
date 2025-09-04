import { Router } from 'express';
import { optionalAuth } from '../middleware/auth';
import { HealthResponse } from '../models/Api';

const router = Router();

// GET /v1/health → 200 OK { "status": "ok" }
router.get('/health', optionalAuth, (req, res) => {
  const response: HealthResponse = { status: 'ok' };
  res.json(response);
});

export default router;

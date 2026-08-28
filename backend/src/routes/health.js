import { Router } from 'express';

const router = Router();

/**
 * GET /api/health
 * Public health check endpoint.
 */
router.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    service: 'civicfix-backend',
  });
});

export default router;

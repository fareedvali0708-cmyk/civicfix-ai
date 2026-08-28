import { Router } from 'express';
import { getOverview, getIssueDetail } from '../controllers/governmentController.js';

const router = Router();

/**
 * GET /api/government/overview
 * Returns system metrics, issues queue, departments, and escalations
 */
router.get('/overview', getOverview);

/**
 * GET /api/government/issues/:id
 * Returns complete issue detail including timeline, agent logs, and escalation info
 */
router.get('/issues/:id', getIssueDetail);

export default router;

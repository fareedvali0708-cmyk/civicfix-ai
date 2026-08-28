import { Router } from 'express';
import { processIntake } from '../controllers/issuesController.js';

const router = Router();

/**
 * POST /api/issues/intake
 * Body: { issueId: "<uuid>", issue?: <issueObject> }
 *
 * Triggers the Intake Agent and begins orchestration for a civic issue.
 * Kept as the primary route (matches existing frontend API call shape).
 */
router.post('/intake', processIntake);

/**
 * POST /api/issues/:id/intake
 * URL param: :id = issue UUID
 *
 * Spec-compliant alias. Copies the :id param into req.body.issueId
 * before delegating to the same processIntake controller.
 */
router.post('/:id/intake', (req, res, next) => {
  // Merge URL param into body so the controller can find it in one place
  req.body = { ...req.body, issueId: req.params.id };
  return processIntake(req, res, next);
});

export default router;

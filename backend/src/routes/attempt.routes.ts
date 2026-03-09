import { Router } from 'express';
import { startAttempt, submitAttempt, getResult } from '../controllers/attempt.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.post('/attempts', requireAuth, startAttempt);
router.post('/attempts/:id/submit', requireAuth, submitAttempt);
router.get('/attempts/:id/result', requireAuth, getResult);

export default router;

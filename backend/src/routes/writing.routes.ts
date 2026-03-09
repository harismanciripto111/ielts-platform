import { Router } from 'express';
import { submitWriting, getSubmissions, getSubmission, triggerScore } from '../controllers/writing.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.post('/submit', requireAuth, submitWriting);
router.get('/submissions', requireAuth, getSubmissions);
router.get('/submissions/:id', requireAuth, getSubmission);
router.post('/score/:id', requireAuth, triggerScore);

export default router;

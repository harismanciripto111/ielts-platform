import { Router } from 'express';
import { getSubmissions, manualScore, getSettings, updateSettings, getAiLogs } from '../controllers/admin.controller';
import { requireAdmin } from '../middleware/auth';

const router = Router();
router.get('/submissions', requireAdmin, getSubmissions);
router.put('/submissions/:id/score', requireAdmin, manualScore);
router.get('/settings', requireAdmin, getSettings);
router.put('/settings', requireAdmin, updateSettings);
router.get('/ai-logs', requireAdmin, getAiLogs);

export default router;

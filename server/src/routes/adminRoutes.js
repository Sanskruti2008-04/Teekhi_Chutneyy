import { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { getAllAdminReports } from '../controllers/adminController.js';
const router = Router();
router.get('/reports', protect, adminOnly, getAllAdminReports);
export default router;

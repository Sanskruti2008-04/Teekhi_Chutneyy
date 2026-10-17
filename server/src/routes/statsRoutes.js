import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { getStats } from '../controllers/statsController.js';
const router = Router();
router.get('/', protect, getStats);
export default router;

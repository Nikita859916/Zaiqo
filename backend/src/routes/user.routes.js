import { Router } from 'express';
import { getUserProfile, updateUserProfile } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// Protect all user profile endpoints
router.use(protect);

router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);

export default router;

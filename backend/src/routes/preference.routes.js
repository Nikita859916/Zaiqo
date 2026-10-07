import { Router } from 'express';
import {
  getPreferences,
  createPreferences,
  updatePreferences,
  deletePreferences,
} from '../controllers/preference.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// All preference endpoints require authentication
router.use(protect);

router.route('/')
  .get(getPreferences)
  .post(createPreferences)
  .put(updatePreferences)
  .delete(deletePreferences);

export default router;

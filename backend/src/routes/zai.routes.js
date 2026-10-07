import express from 'express';
import { handleZaiMessage } from '../controllers/zai.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/zai/message
 * @desc    Send a message to Zai orchestration assistant
 * @access  Private (Authenticated users only)
 */
router.post('/message', protect, handleZaiMessage);

export default router;

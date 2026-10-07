import { Router } from 'express';
import {
  analyzeFoodPhoto,
  getFoodAnalysisHistory,
  getFoodAnalysisById,
  deleteFoodAnalysis,
} from '../controllers/foodAnalysis.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { uploadFoodPhoto } from '../middleware/upload.middleware.js';

const router = Router();

// All food photo analysis routes require authentication
router.use(protect);

// Upload and analyze food image
router.post('/', uploadFoodPhoto, analyzeFoodPhoto);

// Get user analysis history
router.get('/', getFoodAnalysisHistory);

// Single analysis operations
router.get('/:id', getFoodAnalysisById);
router.delete('/:id', deleteFoodAnalysis);

export default router;

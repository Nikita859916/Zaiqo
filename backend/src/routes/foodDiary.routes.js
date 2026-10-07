import { Router } from 'express';
import {
  createDiaryEntry,
  createFromAnalysis,
  getDailySummary,
  getHistory,
  getEntryById,
  updateEntry,
  deleteEntry,
} from '../controllers/foodDiary.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// All food diary routes require authentication
router.use(protect);

// Specific routes (MUST precede parameterized :id routes)
router.post('/from-analysis/:analysisId', createFromAnalysis);
router.get('/daily', getDailySummary);
router.get('/history', getHistory);

// Base route for manual creation
router.post('/', createDiaryEntry);

// Parameterized item routes
router.get('/:id', getEntryById);
router.patch('/:id', updateEntry);
router.delete('/:id', deleteEntry);

export default router;

import { Router } from 'express';
import {
  createMealPlan,
  getMealPlans,
  getMealPlanById,
  updateMealPlan,
  deleteMealPlan,
  updateMealSlot,
} from '../controllers/mealPlan.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// All Meal Planner routes require authentication
router.use(protect);

router.post('/', createMealPlan);
router.get('/', getMealPlans);
router.get('/:id', getMealPlanById);
router.put('/:id/meals', updateMealSlot);
router.put('/:id', updateMealPlan);
router.delete('/:id', deleteMealPlan);

export default router;

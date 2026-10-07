import { Router } from 'express';
import {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  generateRecipe,
  getRecommendations,
  getRecipeGroceries,
  getRecipePriceComparison,
} from '../controllers/recipe.controller.js';
import {
  saveRecipe,
  unsaveRecipe,
  getSavedRecipes,
  getRecipeSavedStatus,
} from '../controllers/savedRecipe.controller.js';
import { protect, optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Saved recipes collection route (defined before /:id to prevent route shadowing)
router.get('/saved', protect, getSavedRecipes);

// Saved recipe status and save/unsave actions for a specific recipe
router.get('/:recipeId/saved', protect, getRecipeSavedStatus);
router.post('/:recipeId/save', protect, saveRecipe);
router.delete('/:recipeId/save', protect, unsaveRecipe);

// Recipe Intelligence endpoints (defined before /:id to prevent route shadowing)
router.post('/generate', protect, generateRecipe);
router.post('/recommend', protect, getRecommendations);

// Recipe grocery intelligence & price comparison routes
router.get('/:id/groceries', optionalAuth, getRecipeGroceries);
router.get('/:id/price-comparison', optionalAuth, getRecipePriceComparison);

// Public / optional auth read routes
router.get('/', optionalAuth, getRecipes);
router.get('/:id', optionalAuth, getRecipeById);

// Authenticated mutation routes
router.post('/', protect, createRecipe);
router.put('/:id', protect, updateRecipe);
router.delete('/:id', protect, deleteRecipe);

export default router;

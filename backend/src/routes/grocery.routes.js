import { Router } from 'express';
import {
  createGroceryList,
  getGroceryLists,
  getGroceryListById,
  updateGroceryList,
  deleteGroceryList,
  addGroceryItem,
  updateGroceryItem,
  deleteGroceryItem,
  createFromMealPlan,
  createFromRecipes,
  addRecipesToList,
  getGroupedGroceryListById,
  getShoppingLinksForList,
  getPriceComparisonForList,
} from '../controllers/grocery.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// All Grocery routes require authentication
router.use(protect);

// Grocery list collection routes
router.post('/', createGroceryList);
router.get('/', getGroceryLists);

// Generate grocery list from recipes or meal plan (placed before :id to prevent route shadowing)
router.post('/from-meal-plan/:mealPlanId', createFromMealPlan);
router.post('/from-recipes', createFromRecipes);

// Category grouped view, marketplace shopping links, and price comparison
router.get('/:id/grouped', getGroupedGroceryListById);
router.get('/:id/shopping-links', getShoppingLinksForList);
router.get('/:id/price-comparison', getPriceComparisonForList);

// Recipe ingredients appending to existing list
router.post('/:id/recipes', addRecipesToList);

// Item operations on a grocery list
router.post('/:id/items', addGroceryItem);
router.put('/:id/items/:itemId', updateGroceryItem);
router.delete('/:id/items/:itemId', deleteGroceryItem);

// Single grocery list CRUD
router.get('/:id', getGroceryListById);
router.put('/:id', updateGroceryList);
router.delete('/:id', deleteGroceryList);

export default router;

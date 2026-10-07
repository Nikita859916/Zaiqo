import mongoose from 'mongoose';
import groceryService from '../services/grocery.service.js';
import groceryIntelligenceService from '../services/groceryIntelligence.service.js';
import priceIntelligenceService from '../services/priceIntelligence.service.js';
import {
  validateGroceryListInput,
  validateGroceryItemInput,
} from '../utils/groceryValidation.js';
import { badRequest, ApiError } from '../utils/apiError.js';

/**
 * Check if MongoDB connection is active
 */
const checkDbConnection = (next) => {
  if (mongoose.connection.readyState !== 1) {
    next(
      new ApiError(
        503,
        'Database service is currently unavailable. Please verify MONGODB_URI configuration.'
      )
    );
    return false;
  }
  return true;
};

/**
 * Create a new grocery list
 * POST /api/grocery
 */
export const createGroceryList = async (req, res, next) => {
  try {
    const validation = validateGroceryListInput(req.body, false);
    if (!validation.isValid) {
      return next(badRequest(validation.error));
    }

    if (!checkDbConnection(next)) return;

    const groceryList = await groceryService.createGroceryList(
      req.user._id,
      validation.sanitized
    );

    res.status(201).json({
      success: true,
      message: 'Grocery list created successfully',
      data: groceryList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Return the authenticated user's grocery lists
 * GET /api/grocery
 */
export const getGroceryLists = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    const { page, limit } = req.query;
    const result = await groceryService.getGroceryLists(req.user._id, {
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Return one grocery list belonging to the authenticated user
 * GET /api/grocery/:id
 */
export const getGroceryListById = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    const groceryList = await groceryService.getGroceryListById(
      req.user._id,
      req.params.id
    );

    res.status(200).json({
      success: true,
      data: groceryList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing grocery list
 * PUT /api/grocery/:id
 */
export const updateGroceryList = async (req, res, next) => {
  try {
    const validation = validateGroceryListInput(req.body, true);
    if (!validation.isValid) {
      return next(badRequest(validation.error));
    }

    if (!checkDbConnection(next)) return;

    const updated = await groceryService.updateGroceryList(
      req.user._id,
      req.params.id,
      validation.sanitized
    );

    res.status(200).json({
      success: true,
      message: 'Grocery list updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an existing grocery list
 * DELETE /api/grocery/:id
 */
export const deleteGroceryList = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    await groceryService.deleteGroceryList(req.user._id, req.params.id);

    res.status(200).json({
      success: true,
      message: 'Grocery list deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a grocery item to an existing list
 * POST /api/grocery/:id/items
 */
export const addGroceryItem = async (req, res, next) => {
  try {
    const validation = validateGroceryItemInput(req.body, false);
    if (!validation.isValid) {
      return next(badRequest(validation.error));
    }

    if (!checkDbConnection(next)) return;

    const updatedList = await groceryService.addItem(
      req.user._id,
      req.params.id,
      validation.sanitized
    );

    res.status(201).json({
      success: true,
      message: 'Grocery item added successfully',
      data: updatedList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing grocery item within a list
 * PUT /api/grocery/:id/items/:itemId
 */
export const updateGroceryItem = async (req, res, next) => {
  try {
    const validation = validateGroceryItemInput(req.body, true);
    if (!validation.isValid) {
      return next(badRequest(validation.error));
    }

    if (!checkDbConnection(next)) return;

    const updatedList = await groceryService.updateItem(
      req.user._id,
      req.params.id,
      req.params.itemId,
      validation.sanitized
    );

    res.status(200).json({
      success: true,
      message: 'Grocery item updated successfully',
      data: updatedList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove an item from a grocery list
 * DELETE /api/grocery/:id/items/:itemId
 */
export const deleteGroceryItem = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    const updatedList = await groceryService.removeItem(
      req.user._id,
      req.params.id,
      req.params.itemId
    );

    res.status(200).json({
      success: true,
      message: 'Grocery item removed successfully',
      data: updatedList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate a consolidated grocery list from a user's meal plan
 * POST /api/grocery/from-meal-plan/:mealPlanId
 */
export const createFromMealPlan = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    const groceryList = await groceryService.createFromMealPlan(
      req.user._id,
      req.params.mealPlanId
    );

    res.status(201).json({
      success: true,
      message: 'Grocery list created from meal plan successfully',
      data: groceryList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate a consolidated grocery list from one or more recipes
 * POST /api/grocery/from-recipes
 */
export const createFromRecipes = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    if (!req.body || !Array.isArray(req.body.recipeIds) || req.body.recipeIds.length === 0) {
      return next(badRequest('Array of recipe IDs (recipeIds) is required.'));
    }

    const groceryList = await groceryIntelligenceService.createFromRecipes(
      req.user._id,
      req.body.recipeIds,
      { name: req.body.name }
    );

    res.status(201).json({
      success: true,
      message: 'Grocery list created from recipes successfully',
      data: groceryList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Append ingredients from recipes into an existing grocery list
 * POST /api/grocery/:id/recipes
 */
export const addRecipesToList = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    if (!req.body || !Array.isArray(req.body.recipeIds) || req.body.recipeIds.length === 0) {
      return next(badRequest('Array of recipe IDs (recipeIds) is required.'));
    }

    const updatedList = await groceryIntelligenceService.addRecipesToList(
      req.user._id,
      req.params.id,
      req.body.recipeIds
    );

    res.status(200).json({
      success: true,
      message: 'Ingredients added to grocery list successfully',
      data: updatedList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a grocery list with items grouped by category
 * GET /api/grocery/:id/grouped
 */
export const getGroupedGroceryListById = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    const groceryList = await groceryService.getGroceryListById(
      req.user._id,
      req.params.id
    );

    const grouped = groceryIntelligenceService.groupItemsByCategory(groceryList.items || []);

    res.status(200).json({
      success: true,
      data: {
        groceryList,
        groupedItems: grouped,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get external marketplace shopping links for a grocery list
 * GET /api/grocery/:id/shopping-links
 */
export const getShoppingLinksForList = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    const shoppingLinks = await priceIntelligenceService.getShoppingLinksForList(
      req.user._id,
      req.params.id,
      req.query.marketplace
    );

    res.status(200).json({
      success: true,
      message: 'Marketplace shopping links generated successfully',
      data: shoppingLinks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get price comparison evaluation for a grocery list
 * GET /api/grocery/:id/price-comparison
 */
export const getPriceComparisonForList = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    const context = {
      pincode: req.query.pincode || null,
      city: req.query.city || null,
    };

    const comparison = await priceIntelligenceService.getPriceComparisonForList(
      req.user._id,
      req.params.id,
      req.query.marketplace,
      context
    );

    res.status(200).json({
      success: true,
      message: 'Price comparison generated successfully',
      data: comparison,
    });
  } catch (error) {
    next(error);
  }
};


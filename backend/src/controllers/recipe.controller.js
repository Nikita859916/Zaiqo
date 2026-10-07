import mongoose from 'mongoose';
import recipeService from '../services/recipe.service.js';
import recipeIntelligenceService from '../services/recipeIntelligence.service.js';
import recipeGroceryService from '../services/recipeGrocery.service.js';
import aiRecipeService from '../services/ai/aiRecipe.service.js';
import { validateRecipeInput } from '../utils/recipeValidation.js';
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
 * Get all recipes with filtering and pagination
 * GET /api/recipes
 */
export const getRecipes = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    const {
      mealType,
      dietaryPreference,
      dietaryTag,
      cuisine,
      maxCookTime,
      maxCookingTime,
      difficulty,
      source,
      search,
      myRecipes,
      page,
      limit,
    } = req.query;

    const filters = {
      mealType,
      dietaryPreference,
      dietaryTag,
      cuisine,
      maxCookTime: maxCookTime || maxCookingTime,
      difficulty,
      source,
      search,
    };

    if (myRecipes === 'true' && req.user) {
      filters.createdBy = req.user._id;
    }

    const result = await recipeService.getRecipes(filters, { page, limit });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single recipe by its ID
 * GET /api/recipes/:id
 */
export const getRecipeById = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    const recipe = await recipeService.getRecipeById(req.params.id);

    res.status(200).json({
      success: true,
      data: recipe,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new recipe
 * POST /api/recipes
 */
export const createRecipe = async (req, res, next) => {
  try {
    const validation = validateRecipeInput(req.body, false);
    if (!validation.isValid) {
      return next(badRequest(validation.error));
    }

    if (!checkDbConnection(next)) return;

    const recipe = await recipeService.createRecipe(validation.sanitized, req.user);

    res.status(201).json({
      success: true,
      message: 'Recipe created successfully',
      data: recipe,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a recipe owned by the authenticated user
 * PUT /api/recipes/:id
 */
export const updateRecipe = async (req, res, next) => {
  try {
    const validation = validateRecipeInput(req.body, true);
    if (!validation.isValid) {
      return next(badRequest(validation.error));
    }

    if (!checkDbConnection(next)) return;

    const updated = await recipeService.updateRecipe(
      req.params.id,
      validation.sanitized,
      req.user
    );

    res.status(200).json({
      success: true,
      message: 'Recipe updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a recipe owned by the authenticated user
 * DELETE /api/recipes/:id
 */
export const deleteRecipe = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    await recipeService.deleteRecipe(req.params.id, req.user);

    res.status(200).json({
      success: true,
      message: 'Recipe deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate a personalized recipe using AI Recipe Intelligence
 * POST /api/recipes/generate
 */
export const generateRecipe = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    // Validate request contract
    const reqValidation = aiRecipeService.validateRecipeRequest(req.body);
    if (!reqValidation.isValid) {
      return next(badRequest(reqValidation.error));
    }

    const result = await recipeIntelligenceService.generatePersonalizedRecipe(
      req.user._id,
      reqValidation.sanitized,
      { persist: Boolean(req.body.persist) }
    );

    const statusCode = result.persisted ? 201 : 200;

    res.status(statusCode).json({
      success: true,
      message: result.persisted
        ? 'Recipe generated and saved successfully'
        : 'Recipe generated successfully',
      data: result.recipe,
      context: result.context,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get personalized recipe recommendations based on diary & preferences
 * POST /api/recipes/recommend
 */
export const getRecommendations = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    const result = await recipeIntelligenceService.getRecommendations(req.user._id, req.body);

    res.status(200).json({
      success: true,
      message: 'Recipe recommendations retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get normalized grocery items for a recipe
 * GET /api/recipes/:id/groceries
 */
export const getRecipeGroceries = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    const recipe = await recipeService.getRecipeById(req.params.id);
    const groceryItems = recipeGroceryService.recipeToGroceryItems(recipe);

    res.status(200).json({
      success: true,
      data: groceryItems,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get price comparison for a recipe's normalized ingredients
 * GET /api/recipes/:id/price-comparison
 */
export const getRecipePriceComparison = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    const context = {
      pincode: req.query.pincode || null,
      city: req.query.city || null,
    };

    const comparison = await recipeGroceryService.getRecipePriceComparison(
      req.params.id,
      req.query.marketplace,
      context
    );

    res.status(200).json({
      success: true,
      message: 'Recipe price comparison generated successfully',
      data: comparison,
    });
  } catch (error) {
    next(error);
  }
};


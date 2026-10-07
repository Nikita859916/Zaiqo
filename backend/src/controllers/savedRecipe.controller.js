import mongoose from 'mongoose';
import savedRecipeService from '../services/savedRecipe.service.js';
import { ApiError } from '../utils/apiError.js';

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
 * Save a recipe for the authenticated user
 * POST /api/recipes/:recipeId/save
 */
export const saveRecipe = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    const recipeId = req.params.recipeId || req.params.id;
    const saved = await savedRecipeService.saveRecipe(req.user._id, recipeId);

    res.status(201).json({
      success: true,
      message: 'Recipe saved successfully',
      data: saved,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a recipe from the authenticated user's saved collection
 * DELETE /api/recipes/:recipeId/save
 */
export const unsaveRecipe = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    const recipeId = req.params.recipeId || req.params.id;
    await savedRecipeService.unsaveRecipe(req.user._id, recipeId);

    res.status(200).json({
      success: true,
      message: 'Recipe removed from saved collection',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Return the authenticated user's saved recipes
 * GET /api/recipes/saved
 */
export const getSavedRecipes = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    const { page, limit } = req.query;
    const result = await savedRecipeService.getSavedRecipes(req.user._id, {
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
 * Return whether the authenticated user has saved the specific recipe
 * GET /api/recipes/:recipeId/saved
 */
export const getRecipeSavedStatus = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    const recipeId = req.params.recipeId || req.params.id;
    const isSaved = await savedRecipeService.isRecipeSaved(req.user._id, recipeId);

    res.status(200).json({
      success: true,
      data: {
        recipeId,
        isSaved,
      },
    });
  } catch (error) {
    next(error);
  }
};

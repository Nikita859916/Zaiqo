import mongoose from 'mongoose';
import SavedRecipe from '../models/savedRecipe.model.js';
import Recipe from '../models/recipe.model.js';
import { badRequest, notFound, conflict } from '../utils/apiError.js';

/**
 * Service to manage SavedRecipe business logic and database interactions
 */
class SavedRecipeService {
  /**
   * Save a recipe for the authenticated user
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string} recipeId
   * @returns {Promise<SavedRecipe>}
   */
  async saveRecipe(userId, recipeId) {
    if (!recipeId || !mongoose.Types.ObjectId.isValid(recipeId)) {
      throw badRequest('Invalid recipe ID format.');
    }

    // 1. Verify that the recipe exists in the database
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      throw notFound('Recipe not found.');
    }

    // 2. Check for duplicate save attempt
    const existing = await SavedRecipe.findOne({
      user: userId,
      recipe: recipeId,
    });
    if (existing) {
      throw conflict('Recipe is already in your saved collection.');
    }

    try {
      const savedDoc = await SavedRecipe.create({
        user: userId,
        recipe: recipeId,
      });

      return await savedDoc.populate('recipe');
    } catch (error) {
      if (error.code === 11000) {
        throw conflict('Recipe is already in your saved collection.');
      }
      throw error;
    }
  }

  /**
   * Remove a recipe from the authenticated user's saved collection
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string} recipeId
   * @returns {Promise<boolean>}
   */
  async unsaveRecipe(userId, recipeId) {
    if (!recipeId || !mongoose.Types.ObjectId.isValid(recipeId)) {
      throw badRequest('Invalid recipe ID format.');
    }

    const deleted = await SavedRecipe.findOneAndDelete({
      user: userId,
      recipe: recipeId,
    });

    if (!deleted) {
      throw notFound('Recipe was not found in your saved collection.');
    }

    return true;
  }

  /**
   * Get all saved recipes for the authenticated user with pagination
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {Object} pagination
   * @returns {Promise<{ savedRecipes: Array, pagination: Object }>}
   */
  async getSavedRecipes(userId, pagination = {}) {
    const page = Math.max(1, parseInt(pagination.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(pagination.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = { user: userId };

    const [savedRecipes, total] = await Promise.all([
      SavedRecipe.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('recipe'),
      SavedRecipe.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      savedRecipes,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Check whether a specific recipe is saved by the authenticated user
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string} recipeId
   * @returns {Promise<boolean>}
   */
  async isRecipeSaved(userId, recipeId) {
    if (!recipeId || !mongoose.Types.ObjectId.isValid(recipeId)) {
      throw badRequest('Invalid recipe ID format.');
    }

    const exists = await SavedRecipe.exists({
      user: userId,
      recipe: recipeId,
    });

    return Boolean(exists);
  }
}

export default new SavedRecipeService();

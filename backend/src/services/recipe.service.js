import mongoose from 'mongoose';
import Recipe from '../models/recipe.model.js';
import { badRequest, notFound, forbidden } from '../utils/apiError.js';

/**
 * Service to manage Recipe database interactions and business logic
 */
class RecipeService {
  /**
   * Fetch recipes with filtering and pagination
   * @param {Object} filters - Query filters
   * @param {Object} pagination - { page, limit }
   * @returns {Promise<{ recipes: Array, pagination: Object }>}
   */
  async getRecipes(filters = {}, pagination = {}) {
    const query = {};

    // 1. Meal Type filter
    if (filters.mealType) {
      query.mealType = String(filters.mealType).trim().toLowerCase();
    }

    // 2. Dietary preference / tag filter
    const dietaryTag = filters.dietaryPreference || filters.dietaryTag;
    if (dietaryTag) {
      const tags = Array.isArray(dietaryTag)
        ? dietaryTag.map((t) => String(t).trim().toLowerCase())
        : String(dietaryTag).split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
      if (tags.length > 0) {
        query.dietaryTags = { $in: tags };
      }
    }

    // 3. Cuisine filter
    if (filters.cuisine) {
      query.cuisine = String(filters.cuisine).trim().toLowerCase();
    }

    // 4. Max cook time filter
    const maxCookTimeParam = filters.maxCookTime !== undefined ? filters.maxCookTime : filters.maxCookingTime;
    if (maxCookTimeParam !== undefined && maxCookTimeParam !== '') {
      const maxTime = parseFloat(maxCookTimeParam);
      if (!isNaN(maxTime) && maxTime >= 0) {
        query.cookTime = { $lte: maxTime };
      }
    }

    // 5. Difficulty filter
    if (filters.difficulty) {
      query.difficulty = String(filters.difficulty).trim().toLowerCase();
    }

    // 6. Source filter
    if (filters.source) {
      query.source = String(filters.source).trim().toLowerCase();
    }

    // 7. CreatedBy / User filter
    if (filters.createdBy) {
      if (mongoose.Types.ObjectId.isValid(filters.createdBy)) {
        query.createdBy = filters.createdBy;
      }
    }

    // 8. Search keyword filter
    if (filters.search) {
      const escaped = String(filters.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (escaped) {
        const searchRegex = new RegExp(escaped, 'i');
        query.$or = [{ name: searchRegex }, { description: searchRegex }];
      }
    }

    // Pagination calculations
    const page = Math.max(1, parseInt(pagination.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(pagination.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const [recipes, total] = await Promise.all([
      Recipe.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email'),
      Recipe.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      recipes,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Get single recipe by ID
   * @param {string} id
   * @returns {Promise<Recipe>}
   */
  async getRecipeById(id) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw badRequest('Invalid recipe ID format.');
    }

    const recipe = await Recipe.findById(id).populate('createdBy', 'name email');
    if (!recipe) {
      throw notFound('Recipe not found.');
    }

    return recipe;
  }

  /**
   * Create a new recipe associated with the creating user
   * @param {Object} data
   * @param {Object} user - Authenticated user
   * @returns {Promise<Recipe>}
   */
  async createRecipe(data, user = null) {
    const payload = {
      ...data,
      createdBy: user ? user._id : null,
      source: data.source || (user ? 'user' : 'system'),
    };

    return Recipe.create(payload);
  }

  /**
   * Update an existing recipe with ownership verification
   * @param {string} id
   * @param {Object} data
   * @param {Object} user - Authenticated user
   * @returns {Promise<Recipe>}
   */
  async updateRecipe(id, data, user) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw badRequest('Invalid recipe ID format.');
    }

    const recipe = await Recipe.findById(id);
    if (!recipe) {
      throw notFound('Recipe not found.');
    }

    // Ownership check: user can only modify recipes they created
    if (!recipe.createdBy || recipe.createdBy.toString() !== user._id.toString()) {
      throw forbidden('You do not have permission to modify this recipe.');
    }

    // Preserve existing nutrition values if partial nutrition update provided
    if (data.nutrition) {
      recipe.nutrition = {
        ...(recipe.nutrition?.toObject ? recipe.nutrition.toObject() : recipe.nutrition),
        ...data.nutrition,
      };
      delete data.nutrition;
    }

    // Apply updates
    Object.assign(recipe, data);
    if (data.prepTime !== undefined || data.cookTime !== undefined) {
      recipe.totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
    }

    await recipe.save();
    return recipe;
  }

  /**
   * Delete an existing recipe with ownership verification
   * @param {string} id
   * @param {Object} user - Authenticated user
   * @returns {Promise<boolean>}
   */
  async deleteRecipe(id, user) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw badRequest('Invalid recipe ID format.');
    }

    const recipe = await Recipe.findById(id);
    if (!recipe) {
      throw notFound('Recipe not found.');
    }

    // Ownership check: user can only delete recipes they created
    if (!recipe.createdBy || recipe.createdBy.toString() !== user._id.toString()) {
      throw forbidden('You do not have permission to delete this recipe.');
    }

    await Recipe.findByIdAndDelete(id);
    return true;
  }
}

export default new RecipeService();

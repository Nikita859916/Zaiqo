import mongoose from 'mongoose';
import preferenceService from './preference.service.js';
import foodDiaryService from './foodDiary.service.js';
import recipeService from './recipe.service.js';
import geminiService from './gemini.service.js';
import aiRecipeService from './ai/aiRecipe.service.js';
import {
  validateGeneratedRecipeData,
  calculateRemainingNutrition,
} from '../utils/recipeIntelligenceValidation.js';
import { badRequest, notFound, ApiError } from '../utils/apiError.js';

/**
 * Recipe Intelligence Service
 * Responsible for context assembly (UserPreference + FoodDiary + MealPlan),
 * nutritional target tracking, recipe personalization, allergen safety enforcement,
 * and calling the AI provider for structured recipe generation.
 *
 * Does NOT own Recipe CRUD or persistence (delegates to recipeService).
 * Does NOT execute direct MongoDB queries outside domain service boundaries.
 */
class RecipeIntelligenceService {
  /**
   * Assemble bounded culinary and nutritional context for a user
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {Object} [parameters={}]
   * @returns {Promise<Object>}
   */
  async assembleContext(userId, parameters = {}) {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw badRequest('Valid user ID is required.');
    }

    // Parallel multi-domain retrieval
    const [preferences, dailySummary, recentHistory] = await Promise.all([
      preferenceService.getPreferencesByUserId(userId),
      foodDiaryService.getDailySummary(userId, parameters.date || null, parameters.timezone || 'Asia/Kolkata').catch(() => null),
      foodDiaryService.getHistory(userId, { limit: 10 }).catch(() => []),
    ]);

    // 1. User preferences context (only existing fields, sanitized)
    const userPreferences = {
      dietaryPreference: preferences?.dietaryPreference || 'no-preference',
      allergies: Array.isArray(preferences?.allergies) ? preferences.allergies : [],
      foodsToAvoid: Array.isArray(preferences?.foodsToAvoid) ? preferences.foodsToAvoid : [],
      preferredCuisines: Array.isArray(preferences?.preferredCuisines) ? preferences.preferredCuisines : [],
      cookingTime: preferences?.cookingTime || 'no-preference',
      spiceLevel: preferences?.spiceLevel || 'medium',
      wellnessGoals: Array.isArray(preferences?.wellnessGoals) ? preferences.wellnessGoals : [],
    };

    // 2. Daily summary and consumed totals
    const dailyTotals = dailySummary?.totals || {
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fats: 0,
    };

    // 3. Nutrition calculation (explicit targets only, never invented)
    const dailyTargets = preferences?.dailyNutritionTargets || null;
    const nutritionBalance = calculateRemainingNutrition(dailyTargets, dailyTotals);

    // 4. Bounded recent meals (repetition avoidance)
    const recentMeals = (Array.isArray(recentHistory) ? recentHistory : [])
      .slice(0, 10)
      .map((entry) => ({
        foodName: entry.foodName,
        mealType: entry.mealType,
        consumedAt: entry.consumedAt,
      }));

    const recentDishes = [...new Set(recentMeals.map((m) => m.foodName).filter(Boolean))];

    // 5. Meal context
    const requestedMealType = parameters.mealType
      ? String(parameters.mealType).trim().toLowerCase()
      : null;

    // Resolve target meal type: use requested or infer unlogged meal
    let targetMealType = requestedMealType;
    if (!targetMealType && dailySummary?.mealBreakdown) {
      if (dailySummary.mealBreakdown.breakfast?.calories === 0) targetMealType = 'breakfast';
      else if (dailySummary.mealBreakdown.lunch?.calories === 0) targetMealType = 'lunch';
      else if (dailySummary.mealBreakdown.dinner?.calories === 0) targetMealType = 'dinner';
      else targetMealType = 'snack';
    }
    if (!targetMealType) targetMealType = 'dinner';

    // 6. Ingredients, cooking time, cuisine
    const requestedIngredients = Array.isArray(parameters.ingredients)
      ? parameters.ingredients.filter((i) => typeof i === 'string' && i.trim().length > 0).map((i) => i.trim())
      : [];

    const cookingTime =
      parameters.cookingTime !== undefined && parameters.cookingTime !== null
        ? Number(parameters.cookingTime)
        : null;

    const cuisine =
      parameters.cuisine ||
      (userPreferences.preferredCuisines.length > 0 ? userPreferences.preferredCuisines[0] : null);

    const healthGoal =
      parameters.healthGoal ||
      (userPreferences.wellnessGoals.length > 0 ? userPreferences.wellnessGoals[0] : null);

    return {
      userId,
      userPreferences,
      nutritionContext: {
        hasTargets: nutritionBalance.hasTargets,
        consumed: nutritionBalance.consumed,
        targets: nutritionBalance.targets,
        remaining: nutritionBalance.remaining,
      },
      mealType: targetMealType,
      servings: parameters.servings ? Number(parameters.servings) : 2,
      recentMeals: recentDishes,
      requestedIngredients,
      cookingTime,
      cuisine,
      healthGoal,
      constraints: {
        allergies: userPreferences.allergies,
        foodsToAvoid: userPreferences.foodsToAvoid,
        dietaryPreference: userPreferences.dietaryPreference,
      },
    };
  }

  /**
   * Generate a personalized recipe for the user
   * Integrates context assembly, Gemini generation, output validation, and optional persistence.
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {Object} [parameters={}]
   * @param {Object} [options={}] - { persist: boolean }
   * @returns {Promise<{ recipe: Object, context: Object, persisted: boolean }>}
   */
  async generatePersonalizedRecipe(userId, parameters = {}, options = {}) {
    if (!userId) {
      throw badRequest('Authenticated user ID is required.');
    }

    if (!geminiService.isConfigured()) {
      throw new ApiError(503, 'AI recipe generation provider is not configured.');
    }

    // 1. Assemble context
    const context = await this.assembleContext(userId, parameters);

    // 2. Call Gemini
    const rawOutput = await geminiService.generateRecipe(context);

    // 3. Programmatic safety and schema validation (defense-in-depth)
    const validation = validateGeneratedRecipeData(rawOutput, context.userPreferences);
    if (!validation.isValid) {
      throw badRequest(validation.error);
    }

    // 3b. Request dietaryConstraints and excludedIngredients enforcement
    if (parameters.dietaryConstraints || parameters.excludedIngredients) {
      const constraintCheck = aiRecipeService.validateAiRecipeOutput(rawOutput, {
        dietaryConstraints: parameters.dietaryConstraints,
        excludedIngredients: parameters.excludedIngredients,
      });
      if (!constraintCheck.isValid) {
        throw badRequest(constraintCheck.error);
      }
    }

    let finalRecipe = validation.sanitized;

    // 4. Persistence handling (delegate to recipeService)
    const shouldPersist = Boolean(options.persist || parameters.persist);
    let persistedDoc = null;

    if (shouldPersist) {
      persistedDoc = await recipeService.createRecipe(
        {
          ...finalRecipe,
          source: 'ai',
        },
        { _id: userId }
      );
      finalRecipe = persistedDoc.toJSON ? persistedDoc.toJSON() : persistedDoc;
    }

    return {
      recipe: finalRecipe,
      context: {
        mealType: context.mealType,
        nutritionContext: context.nutritionContext,
        recentMealsCount: context.recentMeals.length,
        warnings: validation.warnings || [],
      },
      persisted: shouldPersist,
    };
  }

  /**
   * Recommend existing recipes from database or generate a new tailored recipe
   * based on the user's daily diary context.
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {Object} [parameters={}]
   * @returns {Promise<Object>}
   */
  async getRecommendations(userId, parameters = {}) {
    const context = await this.assembleContext(userId, parameters);

    const filters = {
      mealType: context.mealType,
    };

    if (context.userPreferences.dietaryPreference && context.userPreferences.dietaryPreference !== 'no-preference') {
      filters.dietaryPreference = context.userPreferences.dietaryPreference;
    }

    if (context.cookingTime) {
      filters.maxCookTime = context.cookingTime;
    }

    if (context.cuisine) {
      filters.cuisine = context.cuisine;
    }

    // Search catalog
    const existingResult = await recipeService.getRecipes(filters, { limit: 5 });

    // Exclude recently consumed meals from recommendations
    const filteredRecipes = (existingResult.recipes || []).filter((r) => {
      const name = r.name.toLowerCase();
      return !context.recentMeals.some((m) => name.includes(m.toLowerCase()));
    });

    return {
      mealType: context.mealType,
      nutritionContext: context.nutritionContext,
      recommendations: filteredRecipes,
      totalCatalogMatches: existingResult.pagination?.total || 0,
    };
  }
}

const recipeIntelligenceService = new RecipeIntelligenceService();
export default recipeIntelligenceService;

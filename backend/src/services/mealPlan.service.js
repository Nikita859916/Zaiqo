import mongoose from 'mongoose';
import MealPlan from '../models/mealPlan.model.js';
import Recipe from '../models/recipe.model.js';
import { badRequest, notFound, forbidden } from '../utils/apiError.js';

/**
 * Service to manage MealPlan business logic and database interactions
 */
class MealPlanService {
  /**
   * Helper to verify that all referenced recipes exist in database
   * @param {Array<string|mongoose.Types.ObjectId>} recipeIds
   */
  async verifyRecipesExist(recipeIds) {
    const validIds = recipeIds
      .filter(Boolean)
      .map((id) => (typeof id === 'string' ? id : id.toString()));

    const uniqueIds = [...new Set(validIds)];
    if (uniqueIds.length === 0) return;

    for (const id of uniqueIds) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw badRequest(`Invalid recipe ID format: ${id}`);
      }
    }

    const foundRecipes = await Recipe.find({
      _id: { $in: uniqueIds },
    }).select('_id');

    if (foundRecipes.length !== uniqueIds.length) {
      const foundSet = new Set(foundRecipes.map((r) => r._id.toString()));
      const missingId = uniqueIds.find((id) => !foundSet.has(id));
      throw notFound(`Referenced recipe with ID "${missingId}" does not exist.`);
    }
  }

  /**
   * Collect all recipe references inside meals array
   * @param {Array} meals
   * @returns {Array<string>}
   */
  collectRecipeIdsFromMeals(meals = []) {
    const ids = [];
    for (const meal of meals) {
      if (meal.breakfast) ids.push(meal.breakfast.toString());
      if (meal.lunch) ids.push(meal.lunch.toString());
      if (meal.dinner) ids.push(meal.dinner.toString());
      if (Array.isArray(meal.snacks)) {
        for (const s of meal.snacks) {
          if (s) ids.push(s.toString());
        }
      }
    }
    return ids;
  }

  /**
   * Create a new meal plan
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {Object} data
   * @returns {Promise<MealPlan>}
   */
  async createMealPlan(userId, data) {
    if (data.meals && data.meals.length > 0) {
      const referencedIds = this.collectRecipeIdsFromMeals(data.meals);
      await this.verifyRecipesExist(referencedIds);
    }

    const mealPlan = await MealPlan.create({
      ...data,
      user: userId,
    });

    return await mealPlan.populate(
      'meals.breakfast meals.lunch meals.dinner meals.snacks'
    );
  }

  /**
   * Get all meal plans for authenticated user with pagination
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {Object} pagination
   * @returns {Promise<{ mealPlans: Array, pagination: Object }>}
   */
  async getMealPlans(userId, pagination = {}) {
    const page = Math.max(1, parseInt(pagination.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(pagination.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = { user: userId };

    const [mealPlans, total] = await Promise.all([
      MealPlan.find(query)
        .sort({ startDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('meals.breakfast meals.lunch meals.dinner meals.snacks'),
      MealPlan.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      mealPlans,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Get a single meal plan by ID with ownership verification
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string} mealPlanId
   * @returns {Promise<MealPlan>}
   */
  async getMealPlanById(userId, mealPlanId) {
    if (!mealPlanId || !mongoose.Types.ObjectId.isValid(mealPlanId)) {
      throw badRequest('Invalid meal plan ID format.');
    }

    const mealPlan = await MealPlan.findById(mealPlanId).populate(
      'meals.breakfast meals.lunch meals.dinner meals.snacks'
    );

    if (!mealPlan) {
      throw notFound('Meal plan not found.');
    }

    if (mealPlan.user.toString() !== userId.toString()) {
      throw forbidden('You do not have permission to access this meal plan.');
    }

    return mealPlan;
  }

  /**
   * Update an existing meal plan with ownership verification
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string} mealPlanId
   * @param {Object} data
   * @returns {Promise<MealPlan>}
   */
  async updateMealPlan(userId, mealPlanId, data) {
    if (!mealPlanId || !mongoose.Types.ObjectId.isValid(mealPlanId)) {
      throw badRequest('Invalid meal plan ID format.');
    }

    const mealPlan = await MealPlan.findById(mealPlanId);
    if (!mealPlan) {
      throw notFound('Meal plan not found.');
    }

    if (mealPlan.user.toString() !== userId.toString()) {
      throw forbidden('You do not have permission to modify this meal plan.');
    }

    // Validate date range if updated
    const finalStart = data.startDate || mealPlan.startDate;
    const finalEnd = data.endDate || mealPlan.endDate;
    if (new Date(finalEnd) < new Date(finalStart)) {
      throw badRequest('End date cannot be before start date.');
    }

    // Validate referenced recipe IDs if meals updated
    if (data.meals) {
      const referencedIds = this.collectRecipeIdsFromMeals(data.meals);
      await this.verifyRecipesExist(referencedIds);
    }

    Object.assign(mealPlan, data);
    await mealPlan.save();

    return await mealPlan.populate(
      'meals.breakfast meals.lunch meals.dinner meals.snacks'
    );
  }

  /**
   * Delete an existing meal plan with ownership verification
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string} mealPlanId
   * @returns {Promise<boolean>}
   */
  async deleteMealPlan(userId, mealPlanId) {
    if (!mealPlanId || !mongoose.Types.ObjectId.isValid(mealPlanId)) {
      throw badRequest('Invalid meal plan ID format.');
    }

    const mealPlan = await MealPlan.findById(mealPlanId);
    if (!mealPlan) {
      throw notFound('Meal plan not found.');
    }

    if (mealPlan.user.toString() !== userId.toString()) {
      throw forbidden('You do not have permission to delete this meal plan.');
    }

    await MealPlan.findByIdAndDelete(mealPlanId);
    return true;
  }

  /**
   * Update a specific meal slot (date and meal type) within a meal plan
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string} mealPlanId
   * @param {Object} slotData - { date, mealType, recipeId, recipeIds }
   * @returns {Promise<MealPlan>}
   */
  async updateMealSlot(userId, mealPlanId, slotData) {
    if (!mealPlanId || !mongoose.Types.ObjectId.isValid(mealPlanId)) {
      throw badRequest('Invalid meal plan ID format.');
    }

    const mealPlan = await MealPlan.findById(mealPlanId);
    if (!mealPlan) {
      throw notFound('Meal plan not found.');
    }

    if (mealPlan.user.toString() !== userId.toString()) {
      throw forbidden('You do not have permission to modify this meal plan.');
    }

    const { date, mealType, recipeId, recipeIds } = slotData;

    // Verify referenced recipes exist
    if (mealType === 'snacks' && recipeIds && recipeIds.length > 0) {
      await this.verifyRecipesExist(recipeIds);
    } else if (mealType !== 'snacks' && recipeId) {
      await this.verifyRecipesExist([recipeId]);
    }

    const targetDateStr = new Date(date).toISOString().slice(0, 10);

    // Look for existing daily meal entry matching target date
    let dayEntry = mealPlan.meals.find(
      (m) => new Date(m.date).toISOString().slice(0, 10) === targetDateStr
    );

    if (dayEntry) {
      if (mealType === 'snacks') {
        dayEntry.snacks = recipeIds || [];
      } else {
        dayEntry[mealType] = recipeId || null;
      }
    } else {
      const newEntry = {
        date: new Date(date),
        breakfast: null,
        lunch: null,
        dinner: null,
        snacks: [],
      };
      if (mealType === 'snacks') {
        newEntry.snacks = recipeIds || [];
      } else {
        newEntry[mealType] = recipeId || null;
      }
      mealPlan.meals.push(newEntry);
    }

    // Sort meals chronologically
    mealPlan.meals.sort((a, b) => new Date(a.date) - new Date(b.date));

    await mealPlan.save();

    return await mealPlan.populate(
      'meals.breakfast meals.lunch meals.dinner meals.snacks'
    );
  }
}

export default new MealPlanService();

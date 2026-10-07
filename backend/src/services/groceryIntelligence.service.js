import mongoose from 'mongoose';
import MealPlan from '../models/mealPlan.model.js';
import Recipe from '../models/recipe.model.js';
import mealPlanService from './mealPlan.service.js';
import groceryService from './grocery.service.js';
import {
  validateIngredientData,
  getUnitDimension,
  formatOptimalQuantityAndUnit,
  resolveIngredientCategory,
} from '../utils/groceryIntelligenceValidation.js';
import { badRequest, notFound, forbidden } from '../utils/apiError.js';

/**
 * Service to manage Grocery Intelligence:
 * Deterministic ingredient normalization, unit conversion, duplicate aggregation,
 * multi-recipe extraction, and meal-plan shopping orchestration.
 */
class GroceryIntelligenceService {
  /**
   * Deterministically normalizes and aggregates an array of ingredient specifications
   * Merges dimensionally compatible duplicates and preserves incompatible units separately.
   * @param {Array<Object>} rawIngredients
   * @returns {Array<{ name: string, quantity: number, unit: string, category: string, checked: boolean }>}
   */
  normalizeAndAggregateIngredients(rawIngredients = []) {
    if (!Array.isArray(rawIngredients) || rawIngredients.length === 0) {
      return [];
    }

    const aggregatedMap = new Map();

    for (const rawIng of rawIngredients) {
      if (!rawIng || typeof rawIng !== 'object') continue;

      const validation = validateIngredientData(rawIng);
      if (!validation.isValid) continue;

      const { name, canonicalName, quantity, unit, category } = validation.sanitized;
      const dimInfo = getUnitDimension(unit);
      const baseQty = quantity * dimInfo.factorToBase;

      // Aggregation key combines canonical ingredient name AND dimension
      const aggregationKey = `${canonicalName}___${dimInfo.dimension}`;

      if (aggregatedMap.has(aggregationKey)) {
        const existing = aggregatedMap.get(aggregationKey);
        existing.baseQuantity += baseQty;

        // Upgrade category if this occurrence has an explicit specific category
        if (category && category !== 'other' && existing.category === 'other') {
          existing.category = category;
        }
      } else {
        aggregatedMap.set(aggregationKey, {
          displayName: name,
          canonicalName,
          baseQuantity: baseQty,
          dimension: dimInfo.dimension,
          fallbackUnit: dimInfo.baseUnit || unit,
          category,
          checked: Boolean(rawIng.checked),
        });
      }
    }

    // Format consolidated items into human-readable quantities and units
    const consolidated = [];
    for (const entry of aggregatedMap.values()) {
      const formatted = formatOptimalQuantityAndUnit(
        entry.baseQuantity,
        entry.dimension,
        entry.fallbackUnit
      );

      consolidated.push({
        name: entry.displayName,
        quantity: formatted.quantity,
        unit: formatted.unit,
        category: entry.category,
        checked: entry.checked || false,
      });
    }

    return consolidated;
  }

  /**
   * Helper to verify that all referenced recipes exist in database and are authorized
   * for the requesting user (either system-created or owned by the user).
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {Array<string>} recipeIds
   * @returns {Promise<Array<Recipe>>}
   */
  async verifyAndFetchRecipes(userId, recipeIds) {
    if (!Array.isArray(recipeIds) || recipeIds.length === 0) {
      throw badRequest('At least one recipe ID is required.');
    }

    const validIds = recipeIds
      .filter(Boolean)
      .map((id) => (typeof id === 'string' ? id.trim() : id.toString()));

    const uniqueIds = [...new Set(validIds)];
    if (uniqueIds.length === 0) {
      throw badRequest('At least one recipe ID is required.');
    }

    for (const id of uniqueIds) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw badRequest(`Invalid recipe ID format: "${id}".`);
      }
    }

    const recipes = await Recipe.find({ _id: { $in: uniqueIds } });

    if (recipes.length !== uniqueIds.length) {
      const foundSet = new Set(recipes.map((r) => r._id.toString()));
      const missingId = uniqueIds.find((id) => !foundSet.has(id));
      throw notFound(`Referenced recipe with ID "${missingId}" does not exist.`);
    }

    // Ownership check: User can access system recipes (createdBy === null) or their own recipes
    for (const recipe of recipes) {
      if (recipe.createdBy && recipe.createdBy.toString() !== userId.toString()) {
        throw forbidden('You do not have permission to access one or more referenced recipes.');
      }
    }

    return recipes;
  }

  /**
   * Aggregate ingredients from one or more recipes into a new normalized GroceryList
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {Array<string>} recipeIds
   * @param {Object} [options={}] - { name?: string }
   * @returns {Promise<GroceryList>}
   */
  async createFromRecipes(userId, recipeIds, options = {}) {
    if (!userId) {
      throw badRequest('User ID is required to generate grocery list.');
    }

    const recipes = await this.verifyAndFetchRecipes(userId, recipeIds);

    // Collect all ingredients across all referenced recipes
    const rawIngredients = [];
    for (const recipe of recipes) {
      for (const ing of recipe.ingredients || []) {
        rawIngredients.push({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          category: resolveIngredientCategory(ing.category, ing.name),
        });
      }
    }

    const consolidatedItems = this.normalizeAndAggregateIngredients(rawIngredients);

    const defaultName =
      recipes.length === 1
        ? `Grocery List for ${recipes[0].name}`
        : `Grocery List for ${recipes.length} Recipes`;

    const listName = options.name && options.name.trim().length >= 2
      ? options.name.trim()
      : defaultName;

    return groceryService.createGroceryList(userId, {
      name: listName,
      source: 'recipe',
      items: consolidatedItems,
    });
  }

  /**
   * Append ingredients from one or more recipes into an existing GroceryList
   * Merging compatible duplicates with existing list items.
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string} groceryListId
   * @param {Array<string>} recipeIds
   * @returns {Promise<GroceryList>}
   */
  async addRecipesToList(userId, groceryListId, recipeIds) {
    if (!userId) {
      throw badRequest('User ID is required.');
    }

    // 1. Verify grocery list exists and is owned by user
    const existingList = await groceryService.getGroceryListById(userId, groceryListId);

    // 2. Fetch and authorize recipes
    const recipes = await this.verifyAndFetchRecipes(userId, recipeIds);

    // 3. Combine existing grocery items with new recipe ingredients
    const combinedRaw = [];

    for (const item of existingList.items || []) {
      combinedRaw.push({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        checked: item.checked,
      });
    }

    for (const recipe of recipes) {
      for (const ing of recipe.ingredients || []) {
        combinedRaw.push({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          category: resolveIngredientCategory(ing.category, ing.name),
          checked: false,
        });
      }
    }

    const consolidatedItems = this.normalizeAndAggregateIngredients(combinedRaw);

    return groceryService.updateGroceryList(userId, groceryListId, {
      items: consolidatedItems,
    });
  }

  /**
   * Aggregate ingredients from a user's meal plan into a consolidated, normalized grocery list
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string} mealPlanId
   * @param {Object} [options={}] - { name?: string }
   * @returns {Promise<GroceryList>}
   */
  async createFromMealPlan(userId, mealPlanId, options = {}) {
    if (!userId) {
      throw badRequest('User ID is required.');
    }
    if (!mealPlanId || !mongoose.Types.ObjectId.isValid(mealPlanId)) {
      throw badRequest('Invalid meal plan ID format.');
    }

    // 1. Verify meal plan exists and is owned by user
    const mealPlan = await MealPlan.findById(mealPlanId);
    if (!mealPlan) {
      throw notFound('Meal plan not found.');
    }
    if (mealPlan.user.toString() !== userId.toString()) {
      throw forbidden('You do not have permission to access this meal plan.');
    }

    // 2. Collect referenced recipe IDs from all meals
    const recipeIdSet = new Set();
    for (const day of mealPlan.meals || []) {
      if (day.breakfast) recipeIdSet.add(day.breakfast._id ? day.breakfast._id.toString() : day.breakfast.toString());
      if (day.lunch) recipeIdSet.add(day.lunch._id ? day.lunch._id.toString() : day.lunch.toString());
      if (day.dinner) recipeIdSet.add(day.dinner._id ? day.dinner._id.toString() : day.dinner.toString());
      if (Array.isArray(day.snacks)) {
        for (const s of day.snacks) {
          if (s) recipeIdSet.add(s._id ? s._id.toString() : s.toString());
        }
      }
    }

    const uniqueRecipeIds = [...recipeIdSet];
    const rawIngredients = [];

    if (uniqueRecipeIds.length > 0) {
      const recipes = await Recipe.find({ _id: { $in: uniqueRecipeIds } });
      for (const recipe of recipes) {
        for (const ing of recipe.ingredients || []) {
          rawIngredients.push({
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            category: resolveIngredientCategory(ing.category, ing.name),
          });
        }
      }
    }

    const consolidatedItems = this.normalizeAndAggregateIngredients(rawIngredients);

    const listName = options.name && options.name.trim().length >= 2
      ? options.name.trim()
      : `Grocery List for ${mealPlan.name}`;

    return groceryService.createGroceryList(userId, {
      name: listName,
      source: 'meal-plan',
      items: consolidatedItems,
    });
  }

  /**
   * Group grocery items by category for structured shopping views
   * @param {Array<Object>} items
   * @returns {Object} - Keyed by category name with array of items
   */
  groupItemsByCategory(items = []) {
    const grouped = {};

    for (const item of items) {
      const category = (item.category || 'other').toLowerCase();
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    }

    return grouped;
  }
}

const groceryIntelligenceService = new GroceryIntelligenceService();
export default groceryIntelligenceService;

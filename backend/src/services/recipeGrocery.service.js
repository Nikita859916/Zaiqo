import mongoose from 'mongoose';
import ingredientNormalizationService from './ingredientNormalization.service.js';
import groceryService from './grocery.service.js';
import recipeService from './recipe.service.js';
import priceIntelligenceService from './priceIntelligence.service.js';
import priceComparisonService from './priceComparison.service.js';
import {
  mapConcurrent,
  DEFAULT_MAX_CONCURRENT_PRICE_REQUESTS,
} from '../utils/concurrency.js';
import {
  getUnitDimension,
  formatOptimalQuantityAndUnit,
  resolveIngredientCategory,
} from '../utils/groceryIntelligenceValidation.js';
import { badRequest, notFound } from '../utils/apiError.js';

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Service to orchestrate Recipe to Grocery List transformation,
 * deterministic duplicate merging, and price intelligence linkage.
 */
class RecipeGroceryService {
  /**
   * Validates raw or AI-generated recipe structure strictly before domain processing.
   * @param {any} recipe
   * @returns {{ isValid: boolean, sanitized?: Object, error?: string }}
   */
  validateRecipe(recipe) {
    if (!recipe || typeof recipe !== 'object' || Array.isArray(recipe)) {
      return { isValid: false, error: 'Recipe must be a valid JSON object.' };
    }

    // Prototype pollution defense
    if (
      Object.prototype.hasOwnProperty.call(recipe, '__proto__') ||
      Object.prototype.hasOwnProperty.call(recipe, 'constructor') ||
      Object.prototype.hasOwnProperty.call(recipe, 'prototype')
    ) {
      return { isValid: false, error: 'Forbidden prototype key detected in recipe.' };
    }

    // 1. Name / Title
    const nameVal = recipe.name !== undefined ? recipe.name : recipe.title;
    if (typeof nameVal !== 'string') {
      return { isValid: false, error: 'Recipe name must be a string.' };
    }
    const rawName = nameVal.trim();
    if (rawName.length < 2) {
      return { isValid: false, error: 'Recipe name must be at least 2 characters.' };
    }
    if (rawName.length > 120) {
      return { isValid: false, error: 'Recipe name cannot exceed 120 characters.' };
    }

    // 2. Servings
    if (recipe.servings !== undefined && typeof recipe.servings !== 'number') {
      return { isValid: false, error: 'Servings must be a number.' };
    }
    const servingsNum = Number(recipe.servings !== undefined ? recipe.servings : 1);
    if (!Number.isFinite(servingsNum) || servingsNum < 1 || servingsNum > 50) {
      return { isValid: false, error: 'Servings must be a positive number between 1 and 50.' };
    }

    // 3. Ingredients
    const rawIngredients = recipe.ingredients;
    if (!Array.isArray(rawIngredients) || rawIngredients.length === 0) {
      return { isValid: false, error: 'Recipe must include at least one ingredient.' };
    }
    if (rawIngredients.length > 50) {
      return { isValid: false, error: 'Recipe ingredients array exceeds safety limit of 50 items.' };
    }

    const validatedIngredients = [];
    for (let i = 0; i < rawIngredients.length; i++) {
      const item = rawIngredients[i];
      if (!item || (typeof item !== 'object' && typeof item !== 'string')) {
        return { isValid: false, error: `Ingredient at index ${i} is invalid.` };
      }

      const normalized = ingredientNormalizationService.normalizeIngredient(item);
      if (!normalized) {
        return { isValid: false, error: `Ingredient at index ${i} could not be parsed.` };
      }
      validatedIngredients.push(normalized);
    }

    // 4. Instructions / Steps
    const rawSteps = recipe.instructions || recipe.steps;
    const validatedSteps = [];
    if (rawSteps !== undefined && rawSteps !== null) {
      if (!Array.isArray(rawSteps)) {
        return { isValid: false, error: 'Recipe instructions must be an array.' };
      }
      if (rawSteps.length > 50) {
        return { isValid: false, error: 'Recipe instructions array exceeds safety limit of 50 steps.' };
      }

      for (let i = 0; i < rawSteps.length; i++) {
        const step = rawSteps[i];
        const text = typeof step === 'string' ? step.trim() : (step && typeof step === 'object' && step.text ? String(step.text).trim() : '');
        if (!text) {
          return { isValid: false, error: `Instruction step at index ${i} cannot be empty.` };
        }
        if (text.length > 1000) {
          return { isValid: false, error: `Instruction step at index ${i} exceeds maximum length of 1000 characters.` };
        }
        validatedSteps.push(text);
      }
    }

    // 5. Dietary Tags
    const dietaryTags = Array.isArray(recipe.dietaryTags)
      ? recipe.dietaryTags
          .filter((t) => typeof t === 'string' && t.trim().length > 0)
          .map((t) => t.trim().toLowerCase())
      : [];

    return {
      isValid: true,
      sanitized: {
        name: rawName,
        servings: Math.round(servingsNum),
        ingredients: validatedIngredients,
        instructions: validatedSteps,
        dietaryTags,
      },
    };
  }

  /**
   * Deterministically merges an array of normalized ingredients into grocery items.
   * Duplicate ingredients with the same canonical name and dimension are summed.
   * Incompatible units (e.g., piece vs gram) are preserved separately.
   * Distinct ingredients (e.g. olive oil vs coconut oil) are NEVER merged.
   * @param {Array<Object>} ingredients
   * @returns {Array<{ name: string, canonicalName: string, quantity: number, unit: string, category: string, checked: boolean }>}
   */
  mergeGroceryItems(ingredients = []) {
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return [];
    }

    const aggregationMap = new Map();

    for (const raw of ingredients) {
      const normalized = ingredientNormalizationService.normalizeIngredient(raw);
      if (!normalized) continue;

      const dimInfo = getUnitDimension(normalized.unit);
      const baseQty = normalized.quantity * dimInfo.factorToBase;

      // Aggregation key combines canonical identity AND physical dimension
      const aggregationKey = `${normalized.canonicalName}___${dimInfo.dimension}`;

      if (aggregationMap.has(aggregationKey)) {
        const existing = aggregationMap.get(aggregationKey);
        existing.baseQuantity += baseQty;

        // Upgrade category if this occurrence has an explicit specific category
        if (normalized.category && normalized.category !== 'other' && existing.category === 'other') {
          existing.category = normalized.category;
        }
      } else {
        aggregationMap.set(aggregationKey, {
          displayName: normalized.canonicalName,
          canonicalName: normalized.canonicalName,
          baseQuantity: baseQty,
          dimension: dimInfo.dimension,
          fallbackUnit: dimInfo.baseUnit || normalized.unit,
          category: normalized.category,
          checked: false,
        });
      }
    }

    const consolidated = [];
    for (const entry of aggregationMap.values()) {
      const formatted = formatOptimalQuantityAndUnit(
        entry.baseQuantity,
        entry.dimension,
        entry.fallbackUnit
      );

      consolidated.push({
        name: entry.displayName,
        canonicalName: entry.canonicalName,
        quantity: formatted.quantity,
        unit: formatted.unit,
        category: entry.category,
        checked: entry.checked,
      });
    }

    return consolidated;
  }

  /**
   * Extracts and aggregates grocery items from a single recipe
   * @param {Object} recipe
   * @returns {Array<Object>}
   */
  recipeToGroceryItems(recipe) {
    const validation = this.validateRecipe(recipe);
    if (!validation.isValid) {
      throw badRequest(validation.error);
    }

    return this.mergeGroceryItems(validation.sanitized.ingredients);
  }

  /**
   * Extracts and aggregates grocery items across multiple recipes
   * @param {Array<Object>} recipes
   * @returns {Array<Object>}
   */
  recipesToGroceryItems(recipes = []) {
    if (!Array.isArray(recipes) || recipes.length === 0) {
      return [];
    }

    const allIngredients = [];
    for (const r of recipes) {
      const items = this.recipeToGroceryItems(r);
      allIngredients.push(...items);
    }

    return this.mergeGroceryItems(allIngredients);
  }

  /**
   * Creates a persisted GroceryList from a recipe (or recipe ID)
   * Reuses existing groceryService without bypassing authentication or ownership.
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {Object|string} recipeDataOrId
   * @param {Object} [options={}]
   * @returns {Promise<GroceryList>}
   */
  async createGroceryListFromRecipe(userId, recipeDataOrId, options = {}) {
    if (!userId) {
      throw badRequest('Authenticated user ID is required.');
    }

    let recipe = null;
    if (typeof recipeDataOrId === 'string' || recipeDataOrId instanceof mongoose.Types.ObjectId) {
      recipe = await recipeService.getRecipeById(recipeDataOrId);
    } else if (recipeDataOrId && typeof recipeDataOrId === 'object') {
      recipe = recipeDataOrId;
    } else {
      throw badRequest('Invalid recipe data or ID provided.');
    }

    const groceryItems = this.recipeToGroceryItems(recipe);
    const listName = options.name && options.name.trim().length >= 2
      ? options.name.trim()
      : `Grocery List for ${recipe.name || recipe.title || 'Recipe'}`;

    return groceryService.createGroceryList(userId, {
      name: listName,
      source: 'recipe',
      items: groceryItems,
    });
  }

  /**
   * Appends ingredients from a recipe to an existing GroceryList
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string} groceryListId
   * @param {Object|string} recipeDataOrId
   * @returns {Promise<GroceryList>}
   */
  async addRecipeToGroceryList(userId, groceryListId, recipeDataOrId) {
    if (!userId) {
      throw badRequest('Authenticated user ID is required.');
    }

    const existingList = await groceryService.getGroceryListById(userId, groceryListId);

    let recipe = null;
    if (typeof recipeDataOrId === 'string' || recipeDataOrId instanceof mongoose.Types.ObjectId) {
      recipe = await recipeService.getRecipeById(recipeDataOrId);
    } else if (recipeDataOrId && typeof recipeDataOrId === 'object') {
      recipe = recipeDataOrId;
    } else {
      throw badRequest('Invalid recipe data or ID provided.');
    }

    const recipeGroceryItems = this.recipeToGroceryItems(recipe);

    // Combine existing items with new recipe items and merge duplicates
    const combined = [...(existingList.items || []), ...recipeGroceryItems];
    const mergedItems = this.mergeGroceryItems(combined);

    return groceryService.updateGroceryList(userId, groceryListId, {
      items: mergedItems,
    });
  }

  /**
   * Evaluates marketplace pricing for a recipe's normalized ingredients directly.
   * Links Recipe -> Grocery Items -> Existing Price Intelligence.
   * @param {Object|string} recipeDataOrId
   * @param {string} [preferredMarketplace=null]
   * @param {Object} [context={}]
   * @returns {Promise<Object>}
   */
  async getRecipePriceComparison(recipeDataOrId, preferredMarketplace = null, context = {}) {
    let recipe = null;
    if (typeof recipeDataOrId === 'string' || recipeDataOrId instanceof mongoose.Types.ObjectId) {
      recipe = await recipeService.getRecipeById(recipeDataOrId);
    } else if (recipeDataOrId && typeof recipeDataOrId === 'object') {
      recipe = recipeDataOrId;
    } else {
      throw badRequest('Invalid recipe data or ID provided.');
    }

    const items = this.recipeToGroceryItems(recipe);
    if (items.length === 0) {
      return {
        recipeName: recipe.name || recipe.title || 'Recipe',
        items: [],
        comparison: null,
        pricingAvailable: false,
      };
    }

    // Build standalone comparison for all recipe items with bounded concurrency
    const concurrency =
      priceIntelligenceService &&
      typeof priceIntelligenceService.getConcurrencyLimit === 'function'
        ? priceIntelligenceService.getConcurrencyLimit()
        : DEFAULT_MAX_CONCURRENT_PRICE_REQUESTS;

    const itemResults = await mapConcurrent(
      items,
      async (it) => {
        try {
          const comp = await priceIntelligenceService.getItemPriceComparisonAsync(
            it.name,
            preferredMarketplace,
            context
          );
          return {
            name: it.name,
            quantity: it.quantity,
            unit: it.unit,
            category: it.category,
            offers: comp.comparison?.offers || comp.offers || [],
            comparison: comp.comparison || null,
            pricingAvailable: comp.pricingAvailable || false,
          };
        } catch {
          return {
            name: it.name,
            quantity: it.quantity,
            unit: it.unit,
            category: it.category,
            offers: [],
            comparison: priceComparisonService.compareOffers([]),
            pricingAvailable: false,
          };
        }
      },
      {
        concurrency,
        continueOnError: true,
        onError: (err, it) => ({
          name: it?.name || '',
          quantity: it?.quantity,
          unit: it?.unit,
          category: it?.category,
          offers: [],
          comparison: priceComparisonService.compareOffers([]),
          pricingAvailable: false,
        }),
      }
    );

    const anyPricingAvailable = itemResults.some((i) => i.pricingAvailable);

    return {
      recipeName: recipe.name || recipe.title || 'Recipe',
      itemsCount: items.length,
      items: itemResults,
      pricingAvailable: anyPricingAvailable,
    };
  }
}

const recipeGroceryService = new RecipeGroceryService();
export default recipeGroceryService;

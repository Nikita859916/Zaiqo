import { getDefaultAiRecipeProvider, getAiRecipeProvider } from './index.js';
import dietaryConstraintService, {
  MEDICAL_SAFETY_DISCLAIMER,
} from '../dietaryConstraint.service.js';
import ingredientNormalizationService from '../ingredientNormalization.service.js';
import recipeGroceryService from '../recipeGrocery.service.js';
import recipeService from '../recipe.service.js';
import { ApiError, badRequest } from '../../utils/apiError.js';
import { VALID_MEAL_TYPES } from '../../utils/recipeValidation.js';

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * AI Recipe Generation Service
 * Orchestrates provider-agnostic recipe generation, strict contract validation,
 * deterministic dietary constraints, excluded-ingredient checks, non-medical framing,
 * optional persistence, and grocery intelligence pipeline integration.
 */
class AiRecipeService {
  constructor() {
    this.defaultTimeoutMs = 15000;
  }

  /**
   * Validate incoming recipe generation request contract
   * @param {Object} rawRequest
   * @returns {{ isValid: boolean, error?: string, sanitized?: Object }}
   */
  validateRecipeRequest(rawRequest) {
    if (!rawRequest || typeof rawRequest !== 'object' || Array.isArray(rawRequest)) {
      return { isValid: false, error: 'Recipe generation request must be a valid JSON object.' };
    }

    // Prototype pollution defense
    if (
      Object.prototype.hasOwnProperty.call(rawRequest, '__proto__') ||
      Object.keys(rawRequest).some((k) => FORBIDDEN_KEYS.has(k))
    ) {
      return { isValid: false, error: 'Forbidden prototype key detected in request.' };
    }

    // 1. Meal Type
    let mealType = 'dinner';
    if (rawRequest.mealType !== undefined && rawRequest.mealType !== null) {
      if (typeof rawRequest.mealType !== 'string') {
        return { isValid: false, error: 'Meal type must be a string.' };
      }
      const cleanMeal = rawRequest.mealType.trim().toLowerCase();
      if (!VALID_MEAL_TYPES.includes(cleanMeal)) {
        return {
          isValid: false,
          error: `Invalid meal type "${rawRequest.mealType}". Supported: ${VALID_MEAL_TYPES.join(', ')}.`,
        };
      }
      mealType = cleanMeal;
    }

    // 2. Servings
    let servings = 2;
    if (rawRequest.servings !== undefined && rawRequest.servings !== null) {
      if (typeof rawRequest.servings !== 'number' || !Number.isFinite(rawRequest.servings)) {
        return { isValid: false, error: 'Servings must be a valid number.' };
      }
      if (rawRequest.servings < 1 || rawRequest.servings > 50) {
        return { isValid: false, error: 'Servings must be between 1 and 50.' };
      }
      servings = Math.round(rawRequest.servings);
    }

    // 3. Cuisine
    let cuisine = null;
    if (rawRequest.cuisine !== undefined && rawRequest.cuisine !== null) {
      if (typeof rawRequest.cuisine !== 'string') {
        return { isValid: false, error: 'Cuisine must be a string.' };
      }
      cuisine = rawRequest.cuisine.trim().slice(0, 50);
    }

    // 4. Dietary Constraints (deterministic catalog validation)
    let dietaryConstraints = [];
    if (rawRequest.dietaryConstraints !== undefined && rawRequest.dietaryConstraints !== null) {
      if (!Array.isArray(rawRequest.dietaryConstraints)) {
        return { isValid: false, error: 'dietaryConstraints must be an array of strings.' };
      }
      if (rawRequest.dietaryConstraints.length > 20) {
        return { isValid: false, error: 'dietaryConstraints array exceeds limit of 20 items.' };
      }
      const constraintRes = dietaryConstraintService.validateConstraints(rawRequest.dietaryConstraints);
      if (!constraintRes.isValid) {
        return {
          isValid: false,
          error: (constraintRes.errors && constraintRes.errors.length > 0)
            ? constraintRes.errors.join('; ')
            : 'Unknown dietary constraint.',
        };
      }
      dietaryConstraints = constraintRes.sanitized;
    }

    // 5. Excluded Ingredients / Allergens
    let excludedIngredients = [];
    if (rawRequest.excludedIngredients !== undefined && rawRequest.excludedIngredients !== null) {
      if (!Array.isArray(rawRequest.excludedIngredients)) {
        return { isValid: false, error: 'excludedIngredients must be an array of strings.' };
      }
      if (rawRequest.excludedIngredients.length > 50) {
        return { isValid: false, error: 'excludedIngredients array exceeds limit of 50 items.' };
      }
      for (const item of rawRequest.excludedIngredients) {
        if (typeof item !== 'string' || item.trim().length === 0) {
          return { isValid: false, error: 'Excluded ingredient items must be non-empty strings.' };
        }
        if (item.length > 60) {
          return { isValid: false, error: 'Excluded ingredient item exceeds length limit of 60 chars.' };
        }
        excludedIngredients.push(item.trim().toLowerCase());
      }
    }

    // 6. Preferred Ingredients
    let preferredIngredients = [];
    if (rawRequest.preferredIngredients !== undefined && rawRequest.preferredIngredients !== null) {
      if (!Array.isArray(rawRequest.preferredIngredients)) {
        return { isValid: false, error: 'preferredIngredients must be an array of strings.' };
      }
      if (rawRequest.preferredIngredients.length > 50) {
        return { isValid: false, error: 'preferredIngredients array exceeds limit of 50 items.' };
      }
      for (const item of rawRequest.preferredIngredients) {
        if (typeof item !== 'string' || item.trim().length === 0) {
          return { isValid: false, error: 'Preferred ingredient items must be non-empty strings.' };
        }
        if (item.length > 60) {
          return { isValid: false, error: 'Preferred ingredient item exceeds length limit of 60 chars.' };
        }
        preferredIngredients.push(item.trim());
      }
    }

    // 7. Max Prep / Cook Time
    let maxPrepTimeMinutes = null;
    if (rawRequest.maxPrepTimeMinutes !== undefined && rawRequest.maxPrepTimeMinutes !== null) {
      const timeNum = Number(rawRequest.maxPrepTimeMinutes);
      if (!Number.isFinite(timeNum) || timeNum < 0 || timeNum > 720) {
        return { isValid: false, error: 'maxPrepTimeMinutes must be a number between 0 and 720.' };
      }
      maxPrepTimeMinutes = Math.round(timeNum);
    }

    // 8. Health Goal / Preference
    let healthGoal = null;
    if (rawRequest.healthGoal !== undefined && rawRequest.healthGoal !== null) {
      if (typeof rawRequest.healthGoal !== 'string') {
        return { isValid: false, error: 'healthGoal must be a string.' };
      }
      healthGoal = rawRequest.healthGoal.trim().slice(0, 50);
    }

    return {
      isValid: true,
      sanitized: {
        mealType,
        servings,
        cuisine,
        dietaryConstraints,
        excludedIngredients,
        preferredIngredients,
        maxPrepTimeMinutes,
        healthGoal,
      },
    };
  }

  /**
   * Validates and sanitizes AI provider structured output before entering business layer
   * @param {Object} rawOutput - Output received from AI provider
   * @param {Object} [constraints={}] - Requested dietaryConstraints and excludedIngredients
   * @returns {{ isValid: boolean, error?: string, sanitized?: Object }}
   */
  validateAiRecipeOutput(rawOutput, constraints = {}) {
    if (!rawOutput || typeof rawOutput !== 'object' || Array.isArray(rawOutput)) {
      return { isValid: false, error: 'AI output must be a valid JSON object.' };
    }

    // Prototype pollution defense
    if (
      Object.prototype.hasOwnProperty.call(rawOutput, '__proto__') ||
      Object.keys(rawOutput).some((k) => FORBIDDEN_KEYS.has(k))
    ) {
      return { isValid: false, error: 'Forbidden prototype key detected in AI output.' };
    }

    // 1. Title / Name
    const titleVal = rawOutput.title !== undefined ? rawOutput.title : rawOutput.name;
    if (typeof titleVal !== 'string') {
      return { isValid: false, error: 'Recipe title must be a string.' };
    }
    const cleanTitle = titleVal.trim();
    if (cleanTitle.length < 2) {
      return { isValid: false, error: 'Recipe title must be at least 2 characters.' };
    }
    if (cleanTitle.length > 120) {
      return { isValid: false, error: 'Recipe title cannot exceed 120 characters.' };
    }

    // 2. Description
    const description =
      typeof rawOutput.description === 'string' ? rawOutput.description.trim().slice(0, 1000) : '';

    // 3. Servings
    const servingsNum = Number(rawOutput.servings !== undefined ? rawOutput.servings : 2);
    if (!Number.isFinite(servingsNum) || servingsNum < 1 || servingsNum > 50) {
      return { isValid: false, error: 'Servings must be a number between 1 and 50.' };
    }
    const servings = Math.round(servingsNum);

    // 4. Timings
    const prepNum = Number(rawOutput.prepTimeMinutes !== undefined ? rawOutput.prepTimeMinutes : rawOutput.prepTime);
    const prepTimeMinutes = Number.isFinite(prepNum) && prepNum >= 0 ? Math.min(720, Math.round(prepNum)) : 10;

    const cookNum = Number(rawOutput.cookTimeMinutes !== undefined ? rawOutput.cookTimeMinutes : rawOutput.cookTime);
    const cookTimeMinutes = Number.isFinite(cookNum) && cookNum >= 0 ? Math.min(720, Math.round(cookNum)) : 20;

    // 5. Ingredients
    const rawIngredients = rawOutput.ingredients;
    if (!Array.isArray(rawIngredients) || rawIngredients.length === 0) {
      return { isValid: false, error: 'Recipe must contain at least one ingredient.' };
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

      if (typeof item === 'object') {
        const rawName = item.name || item.originalName || item.item;
        if (!rawName || typeof rawName !== 'string' || rawName.trim().length === 0) {
          return { isValid: false, error: `Ingredient at index ${i} has empty or invalid name.` };
        }
        if (item.quantity !== undefined && item.quantity !== null) {
          const qNum = Number(item.quantity);
          if (!Number.isFinite(qNum) || qNum <= 0 || qNum > 100000) {
            return { isValid: false, error: `Ingredient at index ${i} has invalid quantity (${item.quantity}).` };
          }
        }
      }

      const normalized = ingredientNormalizationService.normalizeIngredient(item);
      if (!normalized) {
        return { isValid: false, error: `Ingredient at index ${i} could not be parsed or has invalid quantity/unit.` };
      }
      if (normalized.quantity <= 0 || !Number.isFinite(normalized.quantity) || normalized.quantity > 100000) {
        return { isValid: false, error: `Ingredient at index ${i} quantity is invalid.` };
      }

      validatedIngredients.push(normalized);
    }

    // 6. Steps / Instructions
    const rawSteps = rawOutput.steps || rawOutput.instructions;
    if (!Array.isArray(rawSteps) || rawSteps.length === 0) {
      return { isValid: false, error: 'Recipe must include at least one step.' };
    }
    if (rawSteps.length > 50) {
      return { isValid: false, error: 'Recipe steps array exceeds safety limit of 50 steps.' };
    }

    const validatedSteps = [];
    for (let i = 0; i < rawSteps.length; i++) {
      const step = rawSteps[i];
      const text = typeof step === 'string' ? step.trim() : (step && typeof step === 'object' && step.text ? String(step.text).trim() : '');
      if (!text) {
        return { isValid: false, error: `Step at index ${i} cannot be empty.` };
      }
      if (text.length > 1000) {
        return { isValid: false, error: `Step at index ${i} exceeds maximum length of 1000 characters.` };
      }
      validatedSteps.push(text);
    }

    // 7. Dietary Tags
    const dietaryTags = Array.isArray(rawOutput.dietaryTags)
      ? rawOutput.dietaryTags
          .filter((t) => typeof t === 'string' && t.trim().length > 0)
          .map((t) => t.trim().toLowerCase())
      : [];

    // 8. Excluded Ingredients / Allergens Hard Check
    const excludedList = Array.isArray(constraints.excludedIngredients) ? constraints.excludedIngredients : [];
    if (excludedList.length > 0) {
      for (const ing of validatedIngredients) {
        const canonical = ing.canonicalName.toLowerCase();
        for (const excluded of excludedList) {
          const singularExcluded = excluded.endsWith('s') && excluded.length > 3 ? excluded.slice(0, -1) : excluded;
          if (canonical.includes(singularExcluded)) {
            return {
              isValid: false,
              error: `Generated recipe violates exclusion constraint: contains "${ing.canonicalName}" (matches excluded "${excluded}").`,
            };
          }
        }
      }
    }

    // 9. Dietary Constraints Compatibility Check
    const requestedConstraints = Array.isArray(constraints.dietaryConstraints) ? constraints.dietaryConstraints : [];
    if (requestedConstraints.length > 0) {
      const tempRecipe = {
        name: cleanTitle,
        ingredients: validatedIngredients,
        dietaryTags,
      };
      const compatibility = dietaryConstraintService.evaluateRecipeCompatibility(tempRecipe, requestedConstraints);
      if (!compatibility.compatible) {
        const violationSummary = compatibility.violations
          .map((v) => `"${v.ingredient}" (${v.reason})`)
          .join(', ');
        return {
          isValid: false,
          error: `Generated recipe violates dietary constraints (${requestedConstraints.join(', ')}): ${violationSummary}.`,
        };
      }
    }

    return {
      isValid: true,
      sanitized: {
        title: cleanTitle,
        name: cleanTitle,
        description,
        servings,
        prepTimeMinutes,
        cookTimeMinutes,
        prepTime: prepTimeMinutes,
        cookTime: cookTimeMinutes,
        dietaryTags,
        ingredients: validatedIngredients,
        steps: validatedSteps,
        instructions: validatedSteps,
        nutrition: rawOutput.nutrition || null,
        source: 'ai',
      },
    };
  }

  /**
   * Main recipe generation orchestration
   * @param {Object} rawRequest - User request parameters
   * @param {Object} [options={}] - { userId, persist, providerName, timeoutMs, includeGroceryItems }
   * @returns {Promise<Object>}
   */
  async generateRecipe(rawRequest, options = {}) {
    // 1. Validate request contract
    const reqValidation = this.validateRecipeRequest(rawRequest);
    if (!reqValidation.isValid) {
      throw badRequest(reqValidation.error);
    }
    const sanitizedRequest = reqValidation.sanitized;

    // 2. Resolve AI Provider
    const provider = options.providerName
      ? getAiRecipeProvider(options.providerName)
      : getDefaultAiRecipeProvider();

    if (!provider || !provider.isConfigured()) {
      if (options.safeUnconfigured) {
        return {
          available: false,
          reason: 'AI recipe generation is not configured',
        };
      }
      throw new ApiError(503, 'AI recipe generation is not configured');
    }

    // 3. Execute generation with bounded timeout
    const timeoutMs = options.timeoutMs || this.defaultTimeoutMs;
    let rawOutput = null;

    let timeoutId = null;
    try {
      const genPromise = provider.generateRecipe(sanitizedRequest, options.context || {});
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new ApiError(504, `AI recipe generation timed out after ${timeoutMs}ms.`)),
          timeoutMs
        );
      });

      rawOutput = await Promise.race([genPromise, timeoutPromise]);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(502, `AI Provider error: ${err.message || 'Failed to generate recipe'}`);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }

    // 4. Validate AI Output (defense-in-depth)
    const outValidation = this.validateAiRecipeOutput(rawOutput, {
      dietaryConstraints: sanitizedRequest.dietaryConstraints,
      excludedIngredients: sanitizedRequest.excludedIngredients,
    });

    if (!outValidation.isValid) {
      throw badRequest(outValidation.error);
    }

    let recipe = outValidation.sanitized;

    // 5. Optional persistence via existing recipeService
    let persistedDoc = null;
    const shouldPersist = Boolean(options.persist || rawRequest.persist);
    if (shouldPersist && options.userId) {
      persistedDoc = await recipeService.createRecipe(
        {
          name: recipe.title,
          description: recipe.description,
          mealType: sanitizedRequest.mealType || 'dinner',
          servings: recipe.servings,
          prepTime: recipe.prepTimeMinutes,
          cookTime: recipe.cookTimeMinutes,
          dietaryTags: recipe.dietaryTags,
          ingredients: recipe.ingredients.map((ing) => ({
            name: ing.canonicalName || ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            category: ing.category,
          })),
          instructions: recipe.steps,
          nutrition: recipe.nutrition || { calories: 0, protein: 0, carbohydrates: 0, fats: 0 },
          source: 'ai',
        },
        { _id: options.userId }
      );
      recipe._id = persistedDoc._id;
    }

    // 6. Optional grocery items extraction via existing recipeGroceryService
    let groceryItems = null;
    if (options.includeGroceryItems) {
      groceryItems = recipeGroceryService.recipeToGroceryItems(recipe);
    }

    // 7. Non-medical framing notice
    const framingNotice =
      sanitizedRequest.dietaryConstraints.length > 0
        ? `Recipe formulated compatible with selected dietary constraints: ${sanitizedRequest.dietaryConstraints.join(', ')}.`
        : 'Recipe formulated compatible with selected culinary preferences.';

    return {
      available: true,
      recipe,
      groceryItems,
      persisted: shouldPersist && Boolean(persistedDoc),
      framingNotice,
      disclaimer: MEDICAL_SAFETY_DISCLAIMER,
      provider: rawOutput.provider || { name: provider.name, displayName: provider.displayName },
    };
  }
}

const aiRecipeService = new AiRecipeService();
export default aiRecipeService;

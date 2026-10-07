import { ZAI_ACTIONS, SUPPORTED_ACTIONS, isValidZaiAction } from './zaiActionContract.js';
import { VALID_DIETARY_PREFERENCES } from './preferenceValidation.js';

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Validates and sanitizes structured action output from Gemini or external resolvers
 * @param {any} raw - Parsed JSON object from Gemini
 * @returns {{ isValid: boolean, error?: string, sanitized?: { action: string, parameters: Object, response?: string } }}
 */
export const validateStructuredAction = (raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      isValid: false,
      error: 'Gemini output must be a valid JSON object.',
    };
  }

  // 1. Action validation
  const { action, parameters, response } = raw;
  if (!action || typeof action !== 'string' || !isValidZaiAction(action)) {
    return {
      isValid: false,
      error: `Unsupported or missing action type: "${action}". Must be one of: ${SUPPORTED_ACTIONS.join(', ')}`,
    };
  }

  // 2. Parameters object validation
  if (parameters !== undefined && (typeof parameters !== 'object' || Array.isArray(parameters) || parameters === null)) {
    return {
      isValid: false,
      error: 'Action parameters must be a valid JSON object.',
    };
  }

  const rawParams = parameters || {};
  const sanitizedParams = {};

  // Check for prototype pollution attempt
  if (
    Object.prototype.hasOwnProperty.call(rawParams, '__proto__') ||
    Object.prototype.hasOwnProperty.call(raw, '__proto__')
  ) {
    return {
      isValid: false,
      error: 'Forbidden parameter key detected: __proto__',
    };
  }

  for (const key of Object.getOwnPropertyNames(rawParams)) {
    if (FORBIDDEN_KEYS.has(key)) {
      return {
        isValid: false,
        error: `Forbidden parameter key detected: ${key}`,
      };
    }
  }

  // 3. Action-specific parameter sanitization
  switch (action) {
    case ZAI_ACTIONS.RECIPE_GENERATION: {
      if (rawParams.ingredients !== undefined) {
        if (!Array.isArray(rawParams.ingredients)) {
          return {
            isValid: false,
            error: 'Parameters "ingredients" must be an array of strings.',
          };
        }
        sanitizedParams.ingredients = rawParams.ingredients
          .filter((item) => typeof item === 'string' && item.trim().length > 0)
          .map((item) => item.trim().toLowerCase())
          .slice(0, 50);
      }

      if (rawParams.mealType !== undefined && rawParams.mealType !== null) {
        if (typeof rawParams.mealType !== 'string') {
          return { isValid: false, error: 'Parameter "mealType" must be a string.' };
        }
        sanitizedParams.mealType = rawParams.mealType.trim().toLowerCase();
      }

      if (rawParams.cookingTime !== undefined && rawParams.cookingTime !== null) {
        const timeNum = Number(rawParams.cookingTime);
        if (!Number.isFinite(timeNum) || timeNum <= 0 || timeNum > 1440) {
          return { isValid: false, error: 'Parameter "cookingTime" must be a positive number of minutes (<= 1440).' };
        }
        sanitizedParams.cookingTime = Math.round(timeNum);
      }

      if (rawParams.cuisine !== undefined && rawParams.cuisine !== null) {
        if (typeof rawParams.cuisine !== 'string') {
          return { isValid: false, error: 'Parameter "cuisine" must be a string.' };
        }
        sanitizedParams.cuisine = rawParams.cuisine.trim();
      }

      if (rawParams.healthGoal !== undefined && rawParams.healthGoal !== null) {
        if (typeof rawParams.healthGoal !== 'string') {
          return { isValid: false, error: 'Parameter "healthGoal" must be a string.' };
        }
        sanitizedParams.healthGoal = rawParams.healthGoal.trim();
      }

      if (rawParams.targetCalories !== undefined && rawParams.targetCalories !== null) {
        const calNum = Number(rawParams.targetCalories);
        if (Number.isFinite(calNum) && calNum > 0) {
          sanitizedParams.targetCalories = Math.round(calNum);
        }
      }

      if (rawParams.dietaryPreference !== undefined && rawParams.dietaryPreference !== null) {
        if (typeof rawParams.dietaryPreference === 'string') {
          sanitizedParams.dietaryPreference = rawParams.dietaryPreference.trim().toLowerCase();
        }
      }

      if (rawParams.persist !== undefined && rawParams.persist !== null) {
        sanitizedParams.persist = Boolean(rawParams.persist);
      }

      if (rawParams.useFoodDiaryContext !== undefined && rawParams.useFoodDiaryContext !== null) {
        sanitizedParams.useFoodDiaryContext = Boolean(rawParams.useFoodDiaryContext);
      }

      if (rawParams.generateRecipe !== undefined && rawParams.generateRecipe !== null) {
        sanitizedParams.generateRecipe = Boolean(rawParams.generateRecipe);
      }

      if (rawParams.includeGroceries !== undefined && rawParams.includeGroceries !== null) {
        sanitizedParams.includeGroceries = Boolean(rawParams.includeGroceries);
      }

      if (rawParams.includePricing !== undefined && rawParams.includePricing !== null) {
        sanitizedParams.includePricing = Boolean(rawParams.includePricing);
      }

      if (rawParams.servings !== undefined && rawParams.servings !== null) {
        const servNum = Number(rawParams.servings);
        if (Number.isFinite(servNum) && servNum >= 1 && servNum <= 50) {
          sanitizedParams.servings = Math.round(servNum);
        } else {
          sanitizedParams.servings = 2;
        }
      }

      if (rawParams.dietaryConstraints !== undefined && rawParams.dietaryConstraints !== null) {
        if (Array.isArray(rawParams.dietaryConstraints)) {
          sanitizedParams.dietaryConstraints = rawParams.dietaryConstraints
            .filter((c) => typeof c === 'string' && c.trim().length > 0 && !/[<>{}]/.test(c))
            .map((c) => c.trim().toLowerCase())
            .slice(0, 20);
        }
      }

      if (rawParams.preferredMarketplace !== undefined && rawParams.preferredMarketplace !== null) {
        if (typeof rawParams.preferredMarketplace === 'string') {
          sanitizedParams.preferredMarketplace = rawParams.preferredMarketplace.trim().toLowerCase();
        }
      }
      break;
    }

    case ZAI_ACTIONS.MEAL_PLANNING: {
      if (rawParams.duration !== undefined && rawParams.duration !== null) {
        const durNum = Number(rawParams.duration);
        if (!Number.isFinite(durNum) || durNum <= 0 || durNum > 31) {
          return { isValid: false, error: 'Parameter "duration" must be a positive integer between 1 and 31 days.' };
        }
        sanitizedParams.duration = Math.round(durNum);
      }
      if (rawParams.mealPreferences !== undefined && rawParams.mealPreferences !== null) {
        if (Array.isArray(rawParams.mealPreferences)) {
          sanitizedParams.mealPreferences = rawParams.mealPreferences
            .filter((p) => typeof p === 'string')
            .map((p) => p.trim());
        } else if (typeof rawParams.mealPreferences === 'string') {
          sanitizedParams.mealPreferences = [rawParams.mealPreferences.trim()];
        }
      }
      break;
    }

    case ZAI_ACTIONS.RECIPE_SEARCH: {
      if (rawParams.cuisine !== undefined && rawParams.cuisine !== null) {
        if (typeof rawParams.cuisine !== 'string') {
          return { isValid: false, error: 'Parameter "cuisine" must be a string.' };
        }
        sanitizedParams.cuisine = rawParams.cuisine.trim();
      }
      if (rawParams.mealType !== undefined && rawParams.mealType !== null) {
        if (typeof rawParams.mealType !== 'string') {
          return { isValid: false, error: 'Parameter "mealType" must be a string.' };
        }
        sanitizedParams.mealType = rawParams.mealType.trim().toLowerCase();
      }
      if (rawParams.search !== undefined && rawParams.search !== null) {
        if (typeof rawParams.search !== 'string') {
          return { isValid: false, error: 'Parameter "search" must be a string.' };
        }
        sanitizedParams.search = rawParams.search.trim();
      }
      const cookTimeRaw = rawParams.maxCookTime !== undefined ? rawParams.maxCookTime : rawParams.cookingTime;
      if (cookTimeRaw !== undefined && cookTimeRaw !== null) {
        const timeNum = Number(cookTimeRaw);
        if (Number.isFinite(timeNum) && timeNum > 0) {
          sanitizedParams.maxCookTime = Math.round(timeNum);
        }
      }
      break;
    }

    case ZAI_ACTIONS.DIETARY_PREFERENCE: {
      if (rawParams.dietaryPreference !== undefined && rawParams.dietaryPreference !== null) {
        if (typeof rawParams.dietaryPreference !== 'string') {
          return { isValid: false, error: 'Parameter "dietaryPreference" must be a string.' };
        }
        const pref = rawParams.dietaryPreference.trim().toLowerCase();
        if (!VALID_DIETARY_PREFERENCES.includes(pref)) {
          return {
            isValid: false,
            error: `Invalid dietary preference "${rawParams.dietaryPreference}". Allowed: ${VALID_DIETARY_PREFERENCES.join(', ')}`,
          };
        }
        sanitizedParams.dietaryPreference = pref;
      }
      break;
    }

    case ZAI_ACTIONS.FOOD_ANALYSIS: {
      sanitizedParams.photoRequired = true;
      break;
    }

    case ZAI_ACTIONS.FOOD_DIARY: {
      if (rawParams.queryType !== undefined && rawParams.queryType !== null) {
        if (typeof rawParams.queryType === 'string') {
          sanitizedParams.queryType = rawParams.queryType.trim().toLowerCase();
        }
      }
      if (rawParams.date !== undefined && rawParams.date !== null) {
        if (typeof rawParams.date === 'string') {
          sanitizedParams.date = rawParams.date.trim();
        }
      }
      if (rawParams.foodName !== undefined && rawParams.foodName !== null) {
        if (typeof rawParams.foodName === 'string') {
          sanitizedParams.foodName = rawParams.foodName.trim();
        }
      }
      if (rawParams.mealType !== undefined && rawParams.mealType !== null) {
        if (typeof rawParams.mealType === 'string') {
          sanitizedParams.mealType = rawParams.mealType.trim().toLowerCase();
        }
      }
      if (rawParams.confirmLog !== undefined && rawParams.confirmLog !== null) {
        sanitizedParams.confirmLog = Boolean(rawParams.confirmLog);
      }
      break;
    }

    case ZAI_ACTIONS.GROCERY_LIST: {
      if (rawParams.source !== undefined && rawParams.source !== null) {
        if (typeof rawParams.source === 'string') {
          sanitizedParams.source = rawParams.source.trim().toLowerCase();
        }
      }
      if (rawParams.queryType !== undefined && rawParams.queryType !== null) {
        if (typeof rawParams.queryType === 'string') {
          sanitizedParams.queryType = rawParams.queryType.trim().toLowerCase();
        }
      }
      if (rawParams.item !== undefined && rawParams.item !== null) {
        if (typeof rawParams.item === 'string') {
          sanitizedParams.item = rawParams.item.trim();
        }
      }
      if (rawParams.quantity !== undefined && rawParams.quantity !== null) {
        const qtyNum = Number(rawParams.quantity);
        if (Number.isFinite(qtyNum) && qtyNum > 0) {
          sanitizedParams.quantity = Math.round(qtyNum * 100) / 100;
        }
      }
      if (rawParams.unit !== undefined && rawParams.unit !== null) {
        if (typeof rawParams.unit === 'string') {
          sanitizedParams.unit = rawParams.unit.trim();
        }
      }
      if (rawParams.recipeId !== undefined && rawParams.recipeId !== null) {
        if (typeof rawParams.recipeId === 'string') {
          sanitizedParams.recipeId = rawParams.recipeId.trim();
        }
      }
      if (rawParams.mealPlanId !== undefined && rawParams.mealPlanId !== null) {
        if (typeof rawParams.mealPlanId === 'string') {
          sanitizedParams.mealPlanId = rawParams.mealPlanId.trim();
        }
      }
      if (rawParams.recipeIngredients !== undefined && rawParams.recipeIngredients !== null) {
        if (Array.isArray(rawParams.recipeIngredients)) {
          sanitizedParams.recipeIngredients = rawParams.recipeIngredients.slice(0, 50);
        }
      }
      if (rawParams.marketplace !== undefined && rawParams.marketplace !== null) {
        if (typeof rawParams.marketplace === 'string') {
          sanitizedParams.marketplace = rawParams.marketplace.trim().toLowerCase();
        }
      }
      if (rawParams.listId !== undefined && rawParams.listId !== null) {
        if (typeof rawParams.listId === 'string') {
          sanitizedParams.listId = rawParams.listId.trim();
        }
      }
      break;
    }

    case ZAI_ACTIONS.GENERAL_ZAIQO:
    default: {
      // Pass-through safe string/number/boolean parameters
      for (const [k, v] of Object.entries(rawParams)) {
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
          sanitizedParams[k] = v;
        }
      }
      break;
    }
  }

  // 4. Response text validation
  let sanitizedResponse = null;
  if (response !== undefined && response !== null) {
    if (typeof response === 'string') {
      sanitizedResponse = response.trim();
    }
  }

  return {
    isValid: true,
    sanitized: {
      action,
      parameters: sanitizedParams,
      response: sanitizedResponse || undefined,
    },
  };
};

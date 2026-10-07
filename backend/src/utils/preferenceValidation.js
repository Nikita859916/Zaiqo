export const VALID_DIETARY_PREFERENCES = [
  'vegetarian',
  'vegan',
  'eggetarian',
  'non-vegetarian',
  'jain',
  'no-preference',
];

export const VALID_WELLNESS_GOALS = [
  'healthy-eating',
  'weight-management',
  'muscle-gain',
  'better-nutrition',
  'general-wellness',
];

export const VALID_COOKING_TIMES = [
  'under-15',
  '15-30',
  '30-60',
  'no-preference',
];

export const VALID_SPICE_LEVELS = [
  'mild',
  'medium',
  'spicy',
  'no-preference',
];

export const STANDARD_CUISINES = [
  'indian',
  'italian',
  'mexican',
  'japanese',
  'chinese',
  'mediterranean',
  'continental',
  'other',
];

export const VALID_BUDGET_TIERS = [
  'budget-friendly',
  'balanced',
  'premium',
  'no-preference',
];

export const VALID_PREFERRED_MARKETPLACES = [
  'instamart',
  'blinkit',
  'zepto',
  'jiomart',
  'any',
];


/**
 * Normalizes and validates incoming preference payload
 * @param {Object} input - Raw input body
 * @param {boolean} isPartial - If true (PUT), missing fields are allowed
 * @returns {{ isValid: boolean, error?: string, sanitized?: Object }}
 */
export const validatePreferenceInput = (input, isPartial = false) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      isValid: false,
      error: 'Preference data must be a valid JSON object.',
    };
  }

  // Prototype pollution defense
  if (
    Object.prototype.hasOwnProperty.call(input, '__proto__') ||
    Object.prototype.hasOwnProperty.call(input, 'constructor') ||
    Object.prototype.hasOwnProperty.call(input, 'prototype')
  ) {
    return {
      isValid: false,
      error: 'Prototype pollution attempt detected.',
    };
  }

  const sanitized = {};

  // 1. Dietary Preference
  if (input.dietaryPreference !== undefined) {
    if (typeof input.dietaryPreference !== 'string') {
      return {
        isValid: false,
        error: 'Dietary preference must be a string.',
      };
    }
    const val = input.dietaryPreference.trim().toLowerCase();
    if (!VALID_DIETARY_PREFERENCES.includes(val)) {
      return {
        isValid: false,
        error: `Invalid dietary preference "${input.dietaryPreference}". Allowed: ${VALID_DIETARY_PREFERENCES.join(', ')}`,
      };
    }
    sanitized.dietaryPreference = val;
  } else if (!isPartial) {
    sanitized.dietaryPreference = 'no-preference';
  }

  // 2. Wellness Goals
  if (input.wellnessGoals !== undefined) {
    if (!Array.isArray(input.wellnessGoals)) {
      return {
        isValid: false,
        error: 'Wellness goals must be an array of strings.',
      };
    }
    const cleanedGoals = [];
    for (const goal of input.wellnessGoals) {
      if (typeof goal !== 'string') {
        return {
          isValid: false,
          error: 'Each wellness goal must be a string.',
        };
      }
      const val = goal.trim().toLowerCase();
      if (!VALID_WELLNESS_GOALS.includes(val)) {
        return {
          isValid: false,
          error: `Invalid wellness goal "${goal}". Allowed: ${VALID_WELLNESS_GOALS.join(', ')}`,
        };
      }
      if (!cleanedGoals.includes(val)) {
        cleanedGoals.push(val);
      }
    }
    sanitized.wellnessGoals = cleanedGoals;
  } else if (!isPartial) {
    sanitized.wellnessGoals = ['general-wellness'];
  }

  // 3. Allergies
  if (input.allergies !== undefined) {
    if (!Array.isArray(input.allergies)) {
      return {
        isValid: false,
        error: 'Allergies must be an array of strings.',
      };
    }
    const cleanedAllergies = [];
    for (const item of input.allergies) {
      if (typeof item !== 'string') {
        return {
          isValid: false,
          error: 'Each allergy must be a string.',
        };
      }
      const trimmed = item.trim().toLowerCase();
      if (trimmed && !cleanedAllergies.includes(trimmed)) {
        cleanedAllergies.push(trimmed);
      }
    }
    sanitized.allergies = cleanedAllergies;
  } else if (!isPartial) {
    sanitized.allergies = [];
  }

  // 4. Foods to Avoid
  if (input.foodsToAvoid !== undefined) {
    if (!Array.isArray(input.foodsToAvoid)) {
      return {
        isValid: false,
        error: 'Foods to avoid must be an array of strings.',
      };
    }
    const cleanedAvoid = [];
    for (const item of input.foodsToAvoid) {
      if (typeof item !== 'string') {
        return {
          isValid: false,
          error: 'Each food to avoid must be a string.',
        };
      }
      const trimmed = item.trim().toLowerCase();
      if (trimmed && !cleanedAvoid.includes(trimmed)) {
        cleanedAvoid.push(trimmed);
      }
    }
    sanitized.foodsToAvoid = cleanedAvoid;
  } else if (!isPartial) {
    sanitized.foodsToAvoid = [];
  }

  // 5. Preferred Cuisines
  if (input.preferredCuisines !== undefined) {
    if (!Array.isArray(input.preferredCuisines)) {
      return {
        isValid: false,
        error: 'Preferred cuisines must be an array of strings.',
      };
    }
    const cleanedCuisines = [];
    for (const item of input.preferredCuisines) {
      if (typeof item !== 'string') {
        return {
          isValid: false,
          error: 'Each cuisine must be a string.',
        };
      }
      const trimmed = item.trim().toLowerCase();
      if (trimmed && !cleanedCuisines.includes(trimmed)) {
        cleanedCuisines.push(trimmed);
      }
    }
    sanitized.preferredCuisines = cleanedCuisines;
  } else if (!isPartial) {
    sanitized.preferredCuisines = [];
  }

  // 6. Cooking Time
  if (input.cookingTime !== undefined) {
    if (typeof input.cookingTime !== 'string') {
      return {
        isValid: false,
        error: 'Cooking time must be a string.',
      };
    }
    const val = input.cookingTime.trim().toLowerCase();
    if (!VALID_COOKING_TIMES.includes(val)) {
      return {
        isValid: false,
        error: `Invalid cooking time "${input.cookingTime}". Allowed: ${VALID_COOKING_TIMES.join(', ')}`,
      };
    }
    sanitized.cookingTime = val;
  } else if (!isPartial) {
    sanitized.cookingTime = 'no-preference';
  }

  // 7. Spice Level
  if (input.spiceLevel !== undefined) {
    if (typeof input.spiceLevel !== 'string') {
      return {
        isValid: false,
        error: 'Spice level must be a string.',
      };
    }
    const val = input.spiceLevel.trim().toLowerCase();
    if (!VALID_SPICE_LEVELS.includes(val)) {
      return {
        isValid: false,
        error: `Invalid spice level "${input.spiceLevel}". Allowed: ${VALID_SPICE_LEVELS.join(', ')}`,
      };
    }
    sanitized.spiceLevel = val;
  } else if (!isPartial) {
    sanitized.spiceLevel = 'medium';
  }

  // 8. Daily Nutrition Targets (optional numeric goals)
  if (input.dailyNutritionTargets !== undefined) {
    if (input.dailyNutritionTargets === null) {
      sanitized.dailyNutritionTargets = {
        calories: null,
        proteinGrams: null,
        carbsGrams: null,
        fatsGrams: null,
      };
    } else if (
      typeof input.dailyNutritionTargets !== 'object' ||
      Array.isArray(input.dailyNutritionTargets)
    ) {
      return {
        isValid: false,
        error: 'dailyNutritionTargets must be a valid JSON object or null.',
      };
    } else {
      const targets = {};
      const { calories, proteinGrams, carbsGrams, fatsGrams } = input.dailyNutritionTargets;

      if (calories !== undefined) {
        if (calories === null) {
          targets.calories = null;
        } else {
          const num = Number(calories);
          if (!Number.isFinite(num) || num < 0 || num > 10000) {
            return {
              isValid: false,
              error: 'Calorie target must be a positive number between 0 and 10000.',
            };
          }
          targets.calories = Math.round(num);
        }
      }

      if (proteinGrams !== undefined) {
        if (proteinGrams === null) {
          targets.proteinGrams = null;
        } else {
          const num = Number(proteinGrams);
          if (!Number.isFinite(num) || num < 0 || num > 1000) {
            return {
              isValid: false,
              error: 'Protein target must be a positive number between 0 and 1000g.',
            };
          }
          targets.proteinGrams = Math.round(num);
        }
      }

      if (carbsGrams !== undefined) {
        if (carbsGrams === null) {
          targets.carbsGrams = null;
        } else {
          const num = Number(carbsGrams);
          if (!Number.isFinite(num) || num < 0 || num > 2000) {
            return {
              isValid: false,
              error: 'Carbohydrates target must be a positive number between 0 and 2000g.',
            };
          }
          targets.carbsGrams = Math.round(num);
        }
      }

      if (fatsGrams !== undefined) {
        if (fatsGrams === null) {
          targets.fatsGrams = null;
        } else {
          const num = Number(fatsGrams);
          if (!Number.isFinite(num) || num < 0 || num > 1000) {
            return {
              isValid: false,
              error: 'Fats target must be a positive number between 0 and 1000g.',
            };
          }
          targets.fatsGrams = Math.round(num);
        }
      }

      sanitized.dailyNutritionTargets = targets;
    }
  }

  // 9. Household Size (Integer between 1 and 20, default 1)
  if (input.householdSize !== undefined) {
    if (
      typeof input.householdSize !== 'number' ||
      !Number.isFinite(input.householdSize) ||
      !Number.isInteger(input.householdSize) ||
      input.householdSize < 1 ||
      input.householdSize > 20
    ) {
      return {
        isValid: false,
        error: 'Household size must be an integer between 1 and 20.',
      };
    }
    sanitized.householdSize = input.householdSize;
  } else if (!isPartial) {
    sanitized.householdSize = 1;
  }

  // 10. Default Servings (Integer between 1 and 20, default 2)
  if (input.defaultServings !== undefined) {
    if (
      typeof input.defaultServings !== 'number' ||
      !Number.isFinite(input.defaultServings) ||
      !Number.isInteger(input.defaultServings) ||
      input.defaultServings < 1 ||
      input.defaultServings > 20
    ) {
      return {
        isValid: false,
        error: 'Default servings must be an integer between 1 and 20.',
      };
    }
    sanitized.defaultServings = input.defaultServings;
  } else if (!isPartial) {
    sanitized.defaultServings = 2;
  }

  // 11. Budget Tier (Enum: budget-friendly, balanced, premium, no-preference, default balanced)
  if (input.budgetTier !== undefined) {
    if (typeof input.budgetTier !== 'string') {
      return {
        isValid: false,
        error: 'Budget tier must be a string.',
      };
    }
    const val = input.budgetTier.trim().toLowerCase();
    if (!VALID_BUDGET_TIERS.includes(val)) {
      return {
        isValid: false,
        error: `Invalid budget tier "${input.budgetTier}". Allowed: ${VALID_BUDGET_TIERS.join(', ')}`,
      };
    }
    sanitized.budgetTier = val;
  } else if (!isPartial) {
    sanitized.budgetTier = 'balanced';
  }

  // 12. Preferred Marketplace (Enum: instamart, blinkit, zepto, jiomart, any, default any)
  if (input.preferredMarketplace !== undefined) {
    if (typeof input.preferredMarketplace !== 'string') {
      return {
        isValid: false,
        error: 'Preferred marketplace must be a string.',
      };
    }
    const val = input.preferredMarketplace.trim().toLowerCase();
    if (!VALID_PREFERRED_MARKETPLACES.includes(val)) {
      return {
        isValid: false,
        error: `Invalid preferred marketplace "${input.preferredMarketplace}". Allowed: ${VALID_PREFERRED_MARKETPLACES.join(', ')}`,
      };
    }
    sanitized.preferredMarketplace = val;
  } else if (!isPartial) {
    sanitized.preferredMarketplace = 'any';
  }

  return {
    isValid: true,
    sanitized,
  };
};

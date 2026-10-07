import { VALID_MEAL_TYPES, VALID_DIFFICULTIES } from './recipeValidation.js';
import { categorizeIngredientName } from './groceryValidation.js';

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export const VALID_CATEGORIES = [
  'produce',
  'dairy',
  'meat',
  'bakery',
  'pantry',
  'canned',
  'beverages',
  'frozen',
  'other',
];

/**
 * Common non-vegetarian tokens for vegetarian/vegan enforcement
 */
const NON_VEG_TOKENS = [
  'chicken',
  'mutton',
  'lamb',
  'beef',
  'pork',
  'bacon',
  'ham',
  'fish',
  'salmon',
  'tuna',
  'shrimp',
  'prawn',
  'crab',
  'lobster',
  'anchovy',
  'anchovies',
  'poultry',
  'meat',
  'gelatin',
];

/**
 * Animal byproduct tokens for vegan enforcement
 */
const ANIMAL_BYPRODUCT_TOKENS = [
  'milk',
  'cheese',
  'butter',
  'ghee',
  'paneer',
  'yogurt',
  'curd',
  'cream',
  'honey',
  'egg',
  'eggs',
  'whey',
  'casein',
];

/**
 * Checks for allergen conflict in an ingredient list
 * @param {Array<{ name: string }>} ingredients
 * @param {Array<string>} allergies
 * @returns {{ hasConflict: boolean, matchedAllergens: Array<{ allergen: string, ingredient: string }> }}
 */
export const checkAllergenConflict = (ingredients, allergies = []) => {
  if (!Array.isArray(allergies) || allergies.length === 0) {
    return { hasConflict: false, matchedAllergens: [] };
  }

  const cleanAllergens = allergies
    .filter((a) => typeof a === 'string' && a.trim().length > 0)
    .map((a) => a.trim().toLowerCase());

  if (cleanAllergens.length === 0) {
    return { hasConflict: false, matchedAllergens: [] };
  }

  const matched = [];

  for (const ing of ingredients || []) {
    const ingName = String(ing.name || '').toLowerCase();
    for (const allergy of cleanAllergens) {
      // Normalize e.g. "peanuts" -> "peanut"
      const singularAllergy = allergy.endsWith('s') && allergy.length > 3 ? allergy.slice(0, -1) : allergy;
      const regex = new RegExp(`\\b${singularAllergy}`, 'i');

      if (ingName.includes(singularAllergy) || regex.test(ingName)) {
        matched.push({ allergen: allergy, ingredient: ing.name });
      }
    }
  }

  return {
    hasConflict: matched.length > 0,
    matchedAllergens: matched,
  };
};

/**
 * Checks for ingredients matching user's foods to avoid
 * @param {Array<{ name: string }>} ingredients
 * @param {Array<string>} foodsToAvoid
 * @returns {{ hasConflict: boolean, matchedFoods: Array<{ food: string, ingredient: string }> }}
 */
export const checkFoodsToAvoid = (ingredients, foodsToAvoid = []) => {
  if (!Array.isArray(foodsToAvoid) || foodsToAvoid.length === 0) {
    return { hasConflict: false, matchedFoods: [] };
  }

  const cleanFoods = foodsToAvoid
    .filter((f) => typeof f === 'string' && f.trim().length > 0)
    .map((f) => f.trim().toLowerCase());

  const matched = [];

  for (const ing of ingredients || []) {
    const ingName = String(ing.name || '').toLowerCase();
    for (const food of cleanFoods) {
      const singular = food.endsWith('s') && food.length > 3 ? food.slice(0, -1) : food;
      if (ingName.includes(singular)) {
        matched.push({ food, ingredient: ing.name });
      }
    }
  }

  return {
    hasConflict: matched.length > 0,
    matchedFoods: matched,
  };
};

/**
 * Checks if ingredients violate declared dietary preferences (vegetarian / vegan)
 * @param {Array<{ name: string }>} ingredients
 * @param {string} dietaryPreference
 * @returns {{ isViolation: boolean, reason?: string }}
 */
export const checkDietaryViolation = (ingredients, dietaryPreference = 'no-preference') => {
  const pref = String(dietaryPreference || '').trim().toLowerCase();

  if (pref === 'vegetarian' || pref === 'vegan') {
    for (const ing of ingredients || []) {
      const name = String(ing.name || '').toLowerCase();
      for (const token of NON_VEG_TOKENS) {
        const regex = new RegExp(`\\b${token}\\b`, 'i');
        if (regex.test(name)) {
          return {
            isViolation: true,
            reason: `Recipe contains non-vegetarian ingredient "${ing.name}" conflicting with ${pref} diet.`,
          };
        }
      }
    }
  }

  if (pref === 'vegan') {
    for (const ing of ingredients || []) {
      const name = String(ing.name || '').toLowerCase();
      for (const token of ANIMAL_BYPRODUCT_TOKENS) {
        const regex = new RegExp(`\\b${token}\\b`, 'i');
        if (regex.test(name)) {
          return {
            isViolation: true,
            reason: `Recipe contains animal byproduct "${ing.name}" conflicting with vegan diet.`,
          };
        }
      }
    }
  }

  return { isViolation: false };
};

/**
 * Calculate explicit remaining nutrition from daily targets and consumed totals.
 * Clamps negative remaining values to zero.
 * If targets do NOT exist, does NOT invent targets.
 * @param {Object|null} dailyTargets - { calories, proteinGrams, carbsGrams, fatsGrams }
 * @param {Object|null} dailyTotals - { calories, protein, carbohydrates, fats }
 * @returns {Object}
 */
export const calculateRemainingNutrition = (dailyTargets = null, dailyTotals = null) => {
  const totals = dailyTotals || { calories: 0, protein: 0, carbohydrates: 0, fats: 0 };
  const consumedCalories = totals.calories || 0;
  const consumedProtein = totals.protein || 0;
  const consumedCarbohydrates = totals.carbohydrates || 0;
  const consumedFats = totals.fats || 0;

  const hasCaloriesTarget = dailyTargets && typeof dailyTargets.calories === 'number' && dailyTargets.calories > 0;
  const hasProteinTarget = dailyTargets && typeof dailyTargets.proteinGrams === 'number' && dailyTargets.proteinGrams > 0;
  const hasCarbsTarget = dailyTargets && typeof dailyTargets.carbsGrams === 'number' && dailyTargets.carbsGrams > 0;
  const hasFatsTarget = dailyTargets && typeof dailyTargets.fatsGrams === 'number' && dailyTargets.fatsGrams > 0;

  const hasTargets = Boolean(hasCaloriesTarget || hasProteinTarget || hasCarbsTarget || hasFatsTarget);

  return {
    hasTargets,
    consumed: {
      calories: consumedCalories,
      protein: consumedProtein,
      carbohydrates: consumedCarbohydrates,
      fats: consumedFats,
    },
    targets: {
      calories: hasCaloriesTarget ? dailyTargets.calories : null,
      protein: hasProteinTarget ? dailyTargets.proteinGrams : null,
      carbohydrates: hasCarbsTarget ? dailyTargets.carbsGrams : null,
      fats: hasFatsTarget ? dailyTargets.fatsGrams : null,
    },
    remaining: {
      calories: hasCaloriesTarget ? Math.max(0, Math.round((dailyTargets.calories - consumedCalories) * 10) / 10) : null,
      protein: hasProteinTarget ? Math.max(0, Math.round((dailyTargets.proteinGrams - consumedProtein) * 10) / 10) : null,
      carbohydrates: hasCarbsTarget ? Math.max(0, Math.round((dailyTargets.carbsGrams - consumedCarbohydrates) * 10) / 10) : null,
      fats: hasFatsTarget ? Math.max(0, Math.round((dailyTargets.fatsGrams - consumedFats) * 10) / 10) : null,
    },
  };
};

/**
 * Validates and sanitizes structured recipe data generated by Gemini or external sources.
 * Enforces schema bounds, physical nutrition ranges, allergen hard exclusion,
 * and dietary preference constraints.
 * @param {any} raw - Parsed JSON object from Gemini
 * @param {Object} [userPreferences={}] - Optional user preferences for allergen & dietary enforcement
 * @returns {{ isValid: boolean, error?: string, sanitized?: Object, allergenConflict?: boolean, warnings?: Array<string> }}
 */
export const validateGeneratedRecipeData = (raw, userPreferences = {}) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { isValid: false, error: 'Generated recipe must be a valid JSON object.' };
  }

  // Prototype pollution safety
  if (
    Object.prototype.hasOwnProperty.call(raw, '__proto__') ||
    Object.keys(raw).some((k) => FORBIDDEN_KEYS.has(k))
  ) {
    return { isValid: false, error: 'Forbidden prototype property detected.' };
  }

  const warnings = [];

  // 1. Name
  if (typeof raw.name !== 'string' || raw.name.trim().length < 2) {
    return { isValid: false, error: 'Generated recipe requires a name with at least 2 characters.' };
  }
  const name = raw.name.trim().slice(0, 120);

  // 2. Meal Type
  const rawMeal = typeof raw.mealType === 'string' ? raw.mealType.trim().toLowerCase() : '';
  const mealType = VALID_MEAL_TYPES.includes(rawMeal) ? rawMeal : 'dinner';

  // 3. Description
  const description =
    typeof raw.description === 'string' ? raw.description.trim().slice(0, 1000) : '';

  // 4. Cuisine & Difficulty
  const cuisine =
    typeof raw.cuisine === 'string' && raw.cuisine.trim().length > 0
      ? raw.cuisine.trim().toLowerCase()
      : 'other';

  const rawDiff = typeof raw.difficulty === 'string' ? raw.difficulty.trim().toLowerCase() : '';
  const difficulty = VALID_DIFFICULTIES.includes(rawDiff) ? rawDiff : 'medium';

  // 5. Servings
  const rawServings = Number(raw.servings);
  if (!Number.isFinite(rawServings) || rawServings < 1 || rawServings > 50) {
    return { isValid: false, error: 'Servings must be a valid number between 1 and 50.' };
  }
  const servings = Math.round(rawServings);

  // 6. Timings
  const prepTimeNum = Number(raw.prepTime);
  const prepTime = Number.isFinite(prepTimeNum) && prepTimeNum >= 0 ? Math.min(720, Math.round(prepTimeNum)) : 10;

  const cookTimeNum = Number(raw.cookTime);
  const cookTime = Number.isFinite(cookTimeNum) && cookTimeNum >= 0 ? Math.min(720, Math.round(cookTimeNum)) : 20;

  const totalTimeNum = Number(raw.totalTime);
  const totalTime = Number.isFinite(totalTimeNum) && totalTimeNum > 0 ? Math.round(totalTimeNum) : prepTime + cookTime;

  // 7. Ingredients
  if (!Array.isArray(raw.ingredients) || raw.ingredients.length === 0) {
    return { isValid: false, error: 'Recipe must contain at least one ingredient.' };
  }

  const cleanedIngredients = [];
  for (let i = 0; i < raw.ingredients.length; i++) {
    const item = raw.ingredients[i];
    if (!item || typeof item !== 'object') {
      return { isValid: false, error: `Ingredient at index ${i} is invalid.` };
    }
    const ingName = String(item.name || item.item || '').trim();
    if (!ingName) {
      return { isValid: false, error: `Ingredient at index ${i} must have a name.` };
    }

    const qtyNum = Number(item.quantity);
    const quantity = Number.isFinite(qtyNum) && qtyNum >= 0 ? Math.round(qtyNum * 100) / 100 : 1;
    const unit = typeof item.unit === 'string' ? item.unit.trim().slice(0, 30) : '';

    let category = 'other';
    if (typeof item.category === 'string' && VALID_CATEGORIES.includes(item.category.trim().toLowerCase())) {
      category = item.category.trim().toLowerCase();
    } else {
      category = categorizeIngredientName(ingName);
    }

    cleanedIngredients.push({
      name: ingName,
      quantity,
      unit,
      category,
    });
  }

  // 8. Instructions
  if (!Array.isArray(raw.instructions) || raw.instructions.length === 0) {
    return { isValid: false, error: 'Recipe must include at least one instruction step.' };
  }

  const cleanedInstructions = [];
  for (let i = 0; i < raw.instructions.length; i++) {
    const step = raw.instructions[i];
    const stepText = typeof step === 'string' ? step.trim() : (step && typeof step === 'object' && step.text ? String(step.text).trim() : '');
    if (!stepText) {
      return { isValid: false, error: `Instruction step at index ${i} cannot be empty.` };
    }
    cleanedInstructions.push(stepText);
  }

  // 9. Nutrition validation (Physical sanity bounds)
  const nut = raw.nutrition || {};
  const calNum = Number(nut.calories);
  const protNum = Number(nut.protein);
  const carbNum = Number(nut.carbohydrates);
  const fatNum = Number(nut.fats);

  if (
    !Number.isFinite(calNum) || calNum < 0 || calNum > 3000 ||
    !Number.isFinite(protNum) || protNum < 0 || protNum > 250 ||
    !Number.isFinite(carbNum) || carbNum < 0 || carbNum > 500 ||
    !Number.isFinite(fatNum) || fatNum < 0 || fatNum > 200
  ) {
    return {
      isValid: false,
      error: 'Recipe nutrition values are out of physical realistic bounds (0-3000 kcal, 0-250g protein, 0-500g carbs, 0-200g fats).',
    };
  }

  const nutrition = {
    calories: Math.round(calNum * 10) / 10,
    protein: Math.round(protNum * 10) / 10,
    carbohydrates: Math.round(carbNum * 10) / 10,
    fats: Math.round(fatNum * 10) / 10,
  };

  // 10. Dietary tags
  const dietaryTags = Array.isArray(raw.dietaryTags)
    ? raw.dietaryTags
        .filter((t) => typeof t === 'string' && t.trim().length > 0)
        .map((t) => t.trim().toLowerCase())
    : [];

  // 11. Allergen Hard Exclusion Check
  if (userPreferences.allergies && userPreferences.allergies.length > 0) {
    const allergenResult = checkAllergenConflict(cleanedIngredients, userPreferences.allergies);
    if (allergenResult.hasConflict) {
      const conflictList = allergenResult.matchedAllergens
        .map((m) => `"${m.ingredient}" (contains allergen: ${m.allergen})`)
        .join(', ');
      return {
        isValid: false,
        allergenConflict: true,
        error: `Generated recipe violates allergen safety: ${conflictList}`,
      };
    }
  }

  // 12. Dietary Preference Constraint Check
  if (userPreferences.dietaryPreference) {
    const dietaryCheck = checkDietaryViolation(cleanedIngredients, userPreferences.dietaryPreference);
    if (dietaryCheck.isViolation) {
      return {
        isValid: false,
        error: dietaryCheck.reason,
      };
    }
  }

  // 13. Foods To Avoid (Warning)
  if (userPreferences.foodsToAvoid && userPreferences.foodsToAvoid.length > 0) {
    const avoidCheck = checkFoodsToAvoid(cleanedIngredients, userPreferences.foodsToAvoid);
    if (avoidCheck.hasConflict) {
      for (const m of avoidCheck.matchedFoods) {
        warnings.push(`Recipe contains food user preferred to avoid: ${m.ingredient}`);
      }
    }
  }

  return {
    isValid: true,
    warnings,
    sanitized: {
      name,
      description,
      mealType,
      cuisine,
      difficulty,
      servings,
      prepTime,
      cookTime,
      totalTime,
      ingredients: cleanedIngredients,
      instructions: cleanedInstructions,
      nutrition,
      dietaryTags,
      source: 'ai',
    },
  };
};

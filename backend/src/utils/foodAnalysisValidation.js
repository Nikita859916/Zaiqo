const DANGEROUS_KEYS = ['__proto__', 'constructor', 'prototype'];

const hasDangerousKeys = (obj) => {
  if (!obj || typeof obj !== 'object') return false;
  for (const key of Object.keys(obj)) {
    if (DANGEROUS_KEYS.includes(key)) return true;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      if (hasDangerousKeys(obj[key])) return true;
    }
  }
  return false;
};

const clamp = (val, min, max, defaultVal) => {
  const num = Number(val);
  if (isNaN(num)) return defaultVal;
  return Math.min(Math.max(num, min), max);
};

const sanitizeString = (val, maxLen = 500) => {
  if (typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, maxLen);
};

const sanitizeStringArray = (arr, maxItems = 20, maxLen = 300) => {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((item) => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim().slice(0, maxLen))
    .slice(0, maxItems);
};

/**
 * Validates and normalizes raw food intelligence output from AI vision providers.
 * Enforces strict domain contracts, approximate nutrition bounding, non-food detection,
 * and visual uncertainty warnings.
 *
 * @param {any} rawOutput
 * @returns {{ isValid: boolean, sanitized: Object|null, error?: string }}
 */
export const validateFoodIntelligence = (rawOutput) => {
  if (!rawOutput || typeof rawOutput !== 'object' || Array.isArray(rawOutput)) {
    return {
      isValid: false,
      sanitized: null,
      error: 'Vision provider output must be a non-null JSON object.',
    };
  }

  // Reject prototype pollution attempts
  if (hasDangerousKeys(rawOutput)) {
    return {
      isValid: false,
      sanitized: null,
      error: 'Vision provider output contains prohibited object keys.',
    };
  }

  // Determine isFood status
  const isFood = typeof rawOutput.isFood === 'boolean' ? rawOutput.isFood : true;

  // Case 1: Non-food image handling
  if (!isFood) {
    const overallConf = clamp(rawOutput.confidence?.overall, 0, 1, 0.05);
    const rawWarnings = sanitizeStringArray(rawOutput.warnings);
    const warnings =
      rawWarnings.length > 0 ? rawWarnings : ['Image does not appear to contain food items.'];

    return {
      isValid: true,
      sanitized: {
        isFood: false,
        dish: null,
        detectedFoods: [],
        ingredients: [],
        portion: {
          servingSize: null,
          estimatedWeightGrams: null,
          visualScale: null,
        },
        nutrition: null,
        mealAnalysis: {
          summary:
            sanitizeString(rawOutput.mealAnalysis?.summary) ||
            'No edible food items were detected in the uploaded image.',
          observations: [],
          suggestions: sanitizeStringArray(rawOutput.mealAnalysis?.suggestions, 5) || [
            'Please upload a clear, well-lit photo of a meal or ingredient.',
          ],
        },
        confidence: {
          overall: overallConf,
          level: 'none',
          isReliable: false,
        },
        warnings,
        uncertaintyNotes: 'No food items were identified.',
      },
    };
  }

  // Case 2: Food image handling
  // 1. Dish details
  let dish = null;
  if (rawOutput.dish && typeof rawOutput.dish === 'object' && !Array.isArray(rawOutput.dish)) {
    dish = {
      name: sanitizeString(rawOutput.dish.name, 120),
      mealType: sanitizeString(rawOutput.dish.mealType, 50)?.toLowerCase() || null,
      cuisine: sanitizeString(rawOutput.dish.cuisine, 50)?.toLowerCase() || null,
      isPlantBased:
        typeof rawOutput.dish.isPlantBased === 'boolean' ? rawOutput.dish.isPlantBased : null,
    };
  }

  // 2. Detected foods array
  let detectedFoods = [];
  if (Array.isArray(rawOutput.detectedFoods)) {
    detectedFoods = rawOutput.detectedFoods
      .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
      .map((item) => {
        const name = sanitizeString(item.name, 100);
        if (!name) return null;
        return {
          name,
          category: sanitizeString(item.category, 50)?.toLowerCase() || 'general',
          estimatedQuantity: Math.max(0, Number(item.estimatedQuantity) || 1),
          unit: sanitizeString(item.unit, 50) || 'serving',
          confidence: clamp(item.confidence, 0, 1, 0.7),
        };
      })
      .filter(Boolean)
      .slice(0, 15);
  }

  // If dish.name is null but detectedFoods has items, default dish.name to the primary item
  if (!dish && detectedFoods.length > 0) {
    dish = {
      name: detectedFoods[0].name,
      mealType: null,
      cuisine: null,
      isPlantBased: null,
    };
  } else if (dish && !dish.name && detectedFoods.length > 0) {
    dish.name = detectedFoods[0].name;
  }

  // 3. Ingredients array
  const ingredients = sanitizeStringArray(rawOutput.ingredients, 30, 80);

  // 4. Portion details
  let portion = {
    servingSize: '1 serving',
    estimatedWeightGrams: null,
    visualScale: null,
  };
  if (rawOutput.portion && typeof rawOutput.portion === 'object') {
    portion = {
      servingSize: sanitizeString(rawOutput.portion.servingSize, 100) || '1 serving',
      estimatedWeightGrams:
        rawOutput.portion.estimatedWeightGrams !== null &&
        rawOutput.portion.estimatedWeightGrams !== undefined
          ? Math.max(0, Number(rawOutput.portion.estimatedWeightGrams) || 0)
          : null,
      visualScale: sanitizeString(rawOutput.portion.visualScale, 100),
    };
  }

  // 5. Nutrition estimation (always approximate)
  let nutrition = null;
  if (rawOutput.nutrition && typeof rawOutput.nutrition === 'object') {
    nutrition = {
      calories:
        rawOutput.nutrition.calories !== null && rawOutput.nutrition.calories !== undefined
          ? Math.max(0, Math.round(Number(rawOutput.nutrition.calories) || 0))
          : null,
      protein:
        rawOutput.nutrition.protein !== null && rawOutput.nutrition.protein !== undefined
          ? Math.max(0, Math.round(Number(rawOutput.nutrition.protein) || 0))
          : null,
      carbohydrates:
        rawOutput.nutrition.carbohydrates !== null &&
        rawOutput.nutrition.carbohydrates !== undefined
          ? Math.max(0, Math.round(Number(rawOutput.nutrition.carbohydrates) || 0))
          : null,
      fats:
        rawOutput.nutrition.fats !== null && rawOutput.nutrition.fats !== undefined
          ? Math.max(0, Math.round(Number(rawOutput.nutrition.fats) || 0))
          : null,
      isEstimated: true, // Strictly enforced: visual nutrition is always an estimate
    };
  }

  // 6. Confidence scoring
  const overallConfidence = clamp(rawOutput.confidence?.overall, 0, 1, 0.7);
  let confidenceLevel = rawOutput.confidence?.level;
  if (!['none', 'low', 'medium', 'high'].includes(confidenceLevel)) {
    if (overallConfidence >= 0.8) confidenceLevel = 'high';
    else if (overallConfidence >= 0.5) confidenceLevel = 'medium';
    else if (overallConfidence >= 0.2) confidenceLevel = 'low';
    else confidenceLevel = 'none';
  }
  // isReliable must be false if overall confidence is below 0.6
  const isReliable = overallConfidence >= 0.6 && Boolean(rawOutput.confidence?.isReliable !== false);

  // 7. Warnings & Uncertainty notes
  const warnings = sanitizeStringArray(rawOutput.warnings, 10, 300);
  if (overallConfidence < 0.6 && warnings.length === 0) {
    warnings.push('Visual confidence is low; hidden ingredients and portion depth cannot be verified.');
  }

  const uncertaintyNotes =
    sanitizeString(rawOutput.uncertaintyNotes, 300) ||
    'Portions and nutritional values are approximate visual estimates.';

  // 8. Meal analysis
  let mealAnalysis = {
    summary: '',
    observations: [],
    suggestions: [],
  };
  if (rawOutput.mealAnalysis && typeof rawOutput.mealAnalysis === 'object') {
    mealAnalysis = {
      summary: sanitizeString(rawOutput.mealAnalysis.summary, 600) || '',
      observations: sanitizeStringArray(rawOutput.mealAnalysis.observations, 10, 300),
      suggestions: sanitizeStringArray(rawOutput.mealAnalysis.suggestions, 10, 300),
    };
  }

  return {
    isValid: true,
    sanitized: {
      isFood: true,
      dish,
      detectedFoods,
      ingredients,
      portion,
      nutrition,
      mealAnalysis,
      confidence: {
        overall: overallConfidence,
        level: confidenceLevel,
        isReliable,
      },
      warnings,
      uncertaintyNotes,
    },
  };
};

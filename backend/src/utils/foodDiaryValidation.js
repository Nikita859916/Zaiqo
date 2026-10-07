import { VALID_MEAL_TYPES, VALID_DIARY_SOURCES } from '../models/foodDiary.model.js';

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const IMMUTABLE_UPDATE_KEYS = new Set([
  '_id',
  'id',
  'user',
  'userId',
  'source',
  'analysisRef',
  'recipeRef',
  'createdAt',
]);

const ALLOWED_UPDATE_KEYS = new Set([
  'foodName',
  'mealType',
  'portion',
  'nutrition',
  'ingredients',
  'consumedAt',
  'notes',
]);

/**
 * Validates whether a given string is a valid IANA timezone identifier
 * @param {string} tz
 * @returns {boolean}
 */
export const isValidIanaTimezone = (tz) => {
  if (typeof tz !== 'string' || !tz.trim()) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz.trim() });
    return true;
  } catch {
    return false;
  }
};

/**
 * Calculates startOfDay and endOfDay UTC Date boundaries for a date string in an IANA timezone
 * @param {string|null} dateStr - 'YYYY-MM-DD' or null/undefined for today
 * @param {string} [timezone='Asia/Kolkata']
 * @returns {{ startOfDay: Date, endOfDay: Date, formattedDate: string }}
 */
export const getTimezoneDateRange = (dateStr, timezone = 'Asia/Kolkata') => {
  let targetYear, targetMonth, targetDay;
  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-').map(Number);
    targetYear = y;
    targetMonth = m;
    targetDay = d;
  } else {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(new Date());
    targetYear = Number(parts.find((p) => p.type === 'year').value);
    targetMonth = Number(parts.find((p) => p.type === 'month').value);
    targetDay = Number(parts.find((p) => p.type === 'day').value);
  }

  const naiveUtc = new Date(Date.UTC(targetYear, targetMonth - 1, targetDay, 0, 0, 0, 0));
  const tzParts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(naiveUtc);

  const tzYear = Number(tzParts.find((p) => p.type === 'year').value);
  const tzMonth = Number(tzParts.find((p) => p.type === 'month').value);
  const tzDay = Number(tzParts.find((p) => p.type === 'day').value);
  const tzHour = Number(tzParts.find((p) => p.type === 'hour').value);
  const tzMinute = Number(tzParts.find((p) => p.type === 'minute').value);
  const tzSecond = Number(tzParts.find((p) => p.type === 'second').value);

  const tzAsUtc = Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMinute, tzSecond);
  const offsetMs = tzAsUtc - naiveUtc.getTime();

  const startOfDayMs = naiveUtc.getTime() - offsetMs;
  const startOfDay = new Date(startOfDayMs);
  const endOfDay = new Date(startOfDayMs + 24 * 60 * 60 * 1000 - 1);

  const formattedDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
  return { startOfDay, endOfDay, formattedDate };
};

/**
 * Checks for prototype pollution attack attempts in an object
 * @param {Object} obj
 * @returns {string|null} Error string if detected, or null
 */
const checkPrototypePollution = (obj) => {
  if (!obj || typeof obj !== 'object') return null;
  if (
    Object.prototype.hasOwnProperty.call(obj, '__proto__') ||
    Object.prototype.hasOwnProperty.call(obj, 'constructor') ||
    Object.prototype.hasOwnProperty.call(obj, 'prototype')
  ) {
    return 'Forbidden key detected.';
  }
  for (const key of Object.getOwnPropertyNames(obj)) {
    if (FORBIDDEN_KEYS.has(key)) {
      return `Forbidden key detected: ${key}`;
    }
  }
  return null;
};

/**
 * Validates and normalizes incoming FoodDiary creation input
 * @param {Object} raw
 * @returns {{ isValid: boolean, error?: string, sanitized?: Object }}
 */
export const validateDiaryEntryInput = (raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { isValid: false, error: 'Request body must be a valid JSON object.' };
  }

  const protoError = checkPrototypePollution(raw);
  if (protoError) {
    return { isValid: false, error: protoError };
  }

  const sanitized = {};

  // 1. foodName
  if (raw.foodName === undefined || raw.foodName === null) {
    return { isValid: false, error: 'Food name is required.' };
  }
  if (typeof raw.foodName !== 'string' || raw.foodName.trim().length === 0) {
    return { isValid: false, error: 'Food name must be a non-empty string.' };
  }
  if (raw.foodName.trim().length > 150) {
    return { isValid: false, error: 'Food name cannot exceed 150 characters.' };
  }
  sanitized.foodName = raw.foodName.trim();

  // 2. mealType
  if (raw.mealType === undefined || raw.mealType === null) {
    return { isValid: false, error: 'Meal type is required.' };
  }
  if (typeof raw.mealType !== 'string') {
    return { isValid: false, error: 'Meal type must be a string.' };
  }
  const cleanMealType = raw.mealType.trim().toLowerCase();
  if (!VALID_MEAL_TYPES.includes(cleanMealType)) {
    return {
      isValid: false,
      error: `Invalid meal type "${raw.mealType}". Allowed: ${VALID_MEAL_TYPES.join(', ')}`,
    };
  }
  sanitized.mealType = cleanMealType;

  // 3. consumedAt
  if (raw.consumedAt !== undefined && raw.consumedAt !== null) {
    const d = new Date(raw.consumedAt);
    if (Number.isNaN(d.getTime())) {
      return { isValid: false, error: 'Invalid consumedAt date format.' };
    }
    // Reject timestamps over 24 hours in the future
    if (d.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
      return { isValid: false, error: 'Consumed date cannot be more than 24 hours in the future.' };
    }
    sanitized.consumedAt = d;
  } else {
    sanitized.consumedAt = new Date();
  }

  // 4. portion
  sanitized.portion = {
    servingSize: '1 serving',
    estimatedWeightGrams: null,
  };
  if (raw.portion !== undefined && raw.portion !== null) {
    if (typeof raw.portion !== 'object' || Array.isArray(raw.portion)) {
      return { isValid: false, error: 'Portion must be an object.' };
    }
    const portionProtoErr = checkPrototypePollution(raw.portion);
    if (portionProtoErr) return { isValid: false, error: portionProtoErr };

    if (raw.portion.servingSize !== undefined && raw.portion.servingSize !== null) {
      if (typeof raw.portion.servingSize !== 'string') {
        return { isValid: false, error: 'Serving size must be a string.' };
      }
      sanitized.portion.servingSize = raw.portion.servingSize.trim() || '1 serving';
    }

    if (raw.portion.estimatedWeightGrams !== undefined && raw.portion.estimatedWeightGrams !== null) {
      const weight = Number(raw.portion.estimatedWeightGrams);
      if (!Number.isFinite(weight) || weight < 0) {
        return { isValid: false, error: 'Estimated weight cannot be negative.' };
      }
      if (weight > 5000) {
        return { isValid: false, error: 'Estimated weight cannot exceed 5000g.' };
      }
      sanitized.portion.estimatedWeightGrams = Math.round(weight * 10) / 10;
    }
  }

  // 5. nutrition
  sanitized.nutrition = {
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fats: 0,
    isEstimated: true,
  };
  if (raw.nutrition !== undefined && raw.nutrition !== null) {
    if (typeof raw.nutrition !== 'object' || Array.isArray(raw.nutrition)) {
      return { isValid: false, error: 'Nutrition must be an object.' };
    }
    const nutProtoErr = checkPrototypePollution(raw.nutrition);
    if (nutProtoErr) return { isValid: false, error: nutProtoErr };

    // Calories: 0 - 10000
    if (raw.nutrition.calories !== undefined && raw.nutrition.calories !== null) {
      const cal = Number(raw.nutrition.calories);
      if (!Number.isFinite(cal) || cal < 0) {
        return { isValid: false, error: 'Calories cannot be negative.' };
      }
      if (cal > 10000) {
        return { isValid: false, error: 'Calories cannot exceed 10000.' };
      }
      sanitized.nutrition.calories = Math.round(cal * 10) / 10;
    }

    // Protein: 0 - 1000
    if (raw.nutrition.protein !== undefined && raw.nutrition.protein !== null) {
      const p = Number(raw.nutrition.protein);
      if (!Number.isFinite(p) || p < 0) {
        return { isValid: false, error: 'Protein cannot be negative.' };
      }
      if (p > 1000) {
        return { isValid: false, error: 'Protein cannot exceed 1000g.' };
      }
      sanitized.nutrition.protein = Math.round(p * 10) / 10;
    }

    // Carbohydrates: 0 - 2000
    if (raw.nutrition.carbohydrates !== undefined && raw.nutrition.carbohydrates !== null) {
      const c = Number(raw.nutrition.carbohydrates);
      if (!Number.isFinite(c) || c < 0) {
        return { isValid: false, error: 'Carbohydrates cannot be negative.' };
      }
      if (c > 2000) {
        return { isValid: false, error: 'Carbohydrates cannot exceed 2000g.' };
      }
      sanitized.nutrition.carbohydrates = Math.round(c * 10) / 10;
    }

    // Fats: 0 - 1000
    if (raw.nutrition.fats !== undefined && raw.nutrition.fats !== null) {
      const f = Number(raw.nutrition.fats);
      if (!Number.isFinite(f) || f < 0) {
        return { isValid: false, error: 'Fats cannot be negative.' };
      }
      if (f > 1000) {
        return { isValid: false, error: 'Fats cannot exceed 1000g.' };
      }
      sanitized.nutrition.fats = Math.round(f * 10) / 10;
    }

    // Enforce isEstimated: true
    sanitized.nutrition.isEstimated = true;
  }

  // 6. ingredients
  sanitized.ingredients = [];
  if (raw.ingredients !== undefined && raw.ingredients !== null) {
    if (!Array.isArray(raw.ingredients)) {
      return { isValid: false, error: 'Ingredients must be an array of strings.' };
    }
    sanitized.ingredients = raw.ingredients
      .filter((i) => typeof i === 'string')
      .map((i) => i.trim().toLowerCase())
      .filter((i) => i.length > 0)
      .slice(0, 50);
  }

  // 7. notes
  sanitized.notes = '';
  if (raw.notes !== undefined && raw.notes !== null) {
    if (typeof raw.notes !== 'string') {
      return { isValid: false, error: 'Notes must be a string.' };
    }
    if (raw.notes.trim().length > 500) {
      return { isValid: false, error: 'Notes cannot exceed 500 characters.' };
    }
    sanitized.notes = raw.notes.trim();
  }

  // 8. source (defaults to MANUAL if not specified or FOOD_ANALYSIS from service)
  if (raw.source !== undefined && raw.source !== null) {
    if (!VALID_DIARY_SOURCES.includes(raw.source)) {
      return { isValid: false, error: `Invalid source "${raw.source}".` };
    }
    sanitized.source = raw.source;
  } else {
    sanitized.source = 'MANUAL';
  }

  // 9. analysisRef & recipeRef
  sanitized.analysisRef = raw.analysisRef || null;
  sanitized.recipeRef = raw.recipeRef || null;

  return { isValid: true, sanitized };
};

/**
 * Validates and normalizes incoming FoodDiary update (PATCH) input
 * @param {Object} raw
 * @returns {{ isValid: boolean, error?: string, sanitized?: Object }}
 */
export const validateDiaryUpdateInput = (raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { isValid: false, error: 'Update payload must be a valid JSON object.' };
  }

  const protoError = checkPrototypePollution(raw);
  if (protoError) {
    return { isValid: false, error: protoError };
  }

  // Check for attempts to modify immutable fields
  for (const key of Object.keys(raw)) {
    if (IMMUTABLE_UPDATE_KEYS.has(key)) {
      return { isValid: false, error: `Field "${key}" is immutable and cannot be modified.` };
    }
    if (!ALLOWED_UPDATE_KEYS.has(key)) {
      return { isValid: false, error: `Field "${key}" is not an editable field.` };
    }
  }

  const sanitized = {};

  // foodName
  if (raw.foodName !== undefined) {
    if (typeof raw.foodName !== 'string' || raw.foodName.trim().length === 0) {
      return { isValid: false, error: 'Food name must be a non-empty string.' };
    }
    if (raw.foodName.trim().length > 150) {
      return { isValid: false, error: 'Food name cannot exceed 150 characters.' };
    }
    sanitized.foodName = raw.foodName.trim();
  }

  // mealType
  if (raw.mealType !== undefined) {
    if (typeof raw.mealType !== 'string') {
      return { isValid: false, error: 'Meal type must be a string.' };
    }
    const cleanMealType = raw.mealType.trim().toLowerCase();
    if (!VALID_MEAL_TYPES.includes(cleanMealType)) {
      return {
        isValid: false,
        error: `Invalid meal type "${raw.mealType}". Allowed: ${VALID_MEAL_TYPES.join(', ')}`,
      };
    }
    sanitized.mealType = cleanMealType;
  }

  // consumedAt
  if (raw.consumedAt !== undefined) {
    const d = new Date(raw.consumedAt);
    if (Number.isNaN(d.getTime())) {
      return { isValid: false, error: 'Invalid consumedAt date format.' };
    }
    if (d.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
      return { isValid: false, error: 'Consumed date cannot be more than 24 hours in the future.' };
    }
    sanitized.consumedAt = d;
  }

  // portion
  if (raw.portion !== undefined) {
    if (typeof raw.portion !== 'object' || Array.isArray(raw.portion) || raw.portion === null) {
      return { isValid: false, error: 'Portion must be an object.' };
    }
    const portionProtoErr = checkPrototypePollution(raw.portion);
    if (portionProtoErr) return { isValid: false, error: portionProtoErr };

    sanitized.portion = {};
    if (raw.portion.servingSize !== undefined) {
      if (typeof raw.portion.servingSize !== 'string') {
        return { isValid: false, error: 'Serving size must be a string.' };
      }
      sanitized.portion.servingSize = raw.portion.servingSize.trim() || '1 serving';
    }
    if (raw.portion.estimatedWeightGrams !== undefined) {
      if (raw.portion.estimatedWeightGrams === null) {
        sanitized.portion.estimatedWeightGrams = null;
      } else {
        const weight = Number(raw.portion.estimatedWeightGrams);
        if (!Number.isFinite(weight) || weight < 0) {
          return { isValid: false, error: 'Estimated weight cannot be negative.' };
        }
        if (weight > 5000) {
          return { isValid: false, error: 'Estimated weight cannot exceed 5000g.' };
        }
        sanitized.portion.estimatedWeightGrams = Math.round(weight * 10) / 10;
      }
    }
  }

  // nutrition
  if (raw.nutrition !== undefined) {
    if (typeof raw.nutrition !== 'object' || Array.isArray(raw.nutrition) || raw.nutrition === null) {
      return { isValid: false, error: 'Nutrition must be an object.' };
    }
    const nutProtoErr = checkPrototypePollution(raw.nutrition);
    if (nutProtoErr) return { isValid: false, error: nutProtoErr };

    sanitized.nutrition = { isEstimated: true };
    if (raw.nutrition.calories !== undefined) {
      const cal = Number(raw.nutrition.calories);
      if (!Number.isFinite(cal) || cal < 0) return { isValid: false, error: 'Calories cannot be negative.' };
      if (cal > 10000) return { isValid: false, error: 'Calories cannot exceed 10000.' };
      sanitized.nutrition.calories = Math.round(cal * 10) / 10;
    }
    if (raw.nutrition.protein !== undefined) {
      const p = Number(raw.nutrition.protein);
      if (!Number.isFinite(p) || p < 0) return { isValid: false, error: 'Protein cannot be negative.' };
      if (p > 1000) return { isValid: false, error: 'Protein cannot exceed 1000g.' };
      sanitized.nutrition.protein = Math.round(p * 10) / 10;
    }
    if (raw.nutrition.carbohydrates !== undefined) {
      const c = Number(raw.nutrition.carbohydrates);
      if (!Number.isFinite(c) || c < 0) return { isValid: false, error: 'Carbohydrates cannot be negative.' };
      if (c > 2000) return { isValid: false, error: 'Carbohydrates cannot exceed 2000g.' };
      sanitized.nutrition.carbohydrates = Math.round(c * 10) / 10;
    }
    if (raw.nutrition.fats !== undefined) {
      const f = Number(raw.nutrition.fats);
      if (!Number.isFinite(f) || f < 0) return { isValid: false, error: 'Fats cannot be negative.' };
      if (f > 1000) return { isValid: false, error: 'Fats cannot exceed 1000g.' };
      sanitized.nutrition.fats = Math.round(f * 10) / 10;
    }
  }

  // ingredients
  if (raw.ingredients !== undefined) {
    if (!Array.isArray(raw.ingredients)) {
      return { isValid: false, error: 'Ingredients must be an array of strings.' };
    }
    sanitized.ingredients = raw.ingredients
      .filter((i) => typeof i === 'string')
      .map((i) => i.trim().toLowerCase())
      .filter((i) => i.length > 0)
      .slice(0, 50);
  }

  // notes
  if (raw.notes !== undefined) {
    if (typeof raw.notes !== 'string') {
      return { isValid: false, error: 'Notes must be a string.' };
    }
    if (raw.notes.trim().length > 500) {
      return { isValid: false, error: 'Notes cannot exceed 500 characters.' };
    }
    sanitized.notes = raw.notes.trim();
  }

  return { isValid: true, sanitized };
};

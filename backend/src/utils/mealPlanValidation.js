import mongoose from 'mongoose';

export const VALID_MEAL_SLOT_TYPES = ['breakfast', 'lunch', 'dinner', 'snacks'];

/**
 * Normalizes input date to Date object
 * @param {string|Date} val
 * @param {string} fieldName
 * @returns {Date}
 */
const parseDate = (val, fieldName) => {
  if (!val) {
    throw new Error(`${fieldName} is required.`);
  }
  const date = new Date(val);
  if (isNaN(date.getTime())) {
    throw new Error(`${fieldName} must be a valid date.`);
  }
  return date;
};

/**
 * Validate and sanitize MealPlan creation or full/partial update payload
 * @param {Object} input - Raw request body
 * @param {boolean} isPartial - True for partial updates
 * @returns {{ isValid: boolean, error?: string, sanitized?: Object }}
 */
export const validateMealPlanInput = (input, isPartial = false) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      isValid: false,
      error: 'Meal plan data must be a valid JSON object.',
    };
  }

  const sanitized = {};

  try {
    // 1. Name
    if (input.name !== undefined) {
      if (typeof input.name !== 'string' || input.name.trim().length < 2) {
        return {
          isValid: false,
          error: 'Meal plan name must be at least 2 characters long.',
        };
      }
      if (input.name.trim().length > 100) {
        return {
          isValid: false,
          error: 'Meal plan name cannot exceed 100 characters.',
        };
      }
      sanitized.name = input.name.trim();
    } else if (!isPartial) {
      sanitized.name = 'My Meal Plan';
    }

    // 2. Start Date
    if (input.startDate !== undefined) {
      sanitized.startDate = parseDate(input.startDate, 'Start date');
    } else if (!isPartial) {
      return {
        isValid: false,
        error: 'Start date is required.',
      };
    }

    // 3. End Date
    if (input.endDate !== undefined) {
      sanitized.endDate = parseDate(input.endDate, 'End date');
    } else if (!isPartial) {
      return {
        isValid: false,
        error: 'End date is required.',
      };
    }

    // 4. Date Range Comparison
    if (sanitized.startDate && sanitized.endDate) {
      if (new Date(sanitized.endDate) < new Date(sanitized.startDate)) {
        return {
          isValid: false,
          error: 'End date cannot be before start date.',
        };
      }
    }

    // 5. Meals Array
    if (input.meals !== undefined) {
      if (!Array.isArray(input.meals)) {
        return {
          isValid: false,
          error: 'Meals must be an array of daily meal objects.',
        };
      }

      const sanitizedMeals = [];
      for (let i = 0; i < input.meals.length; i++) {
        const meal = input.meals[i];
        if (!meal || typeof meal !== 'object') {
          return {
            isValid: false,
            error: `Meal entry at index ${i} must be an object.`,
          };
        }

        const mealDate = parseDate(meal.date, `Meal date at index ${i}`);

        const sanitizedEntry = {
          date: mealDate,
          breakfast: null,
          lunch: null,
          dinner: null,
          snacks: [],
        };

        // Validate individual slot references
        for (const slot of ['breakfast', 'lunch', 'dinner']) {
          if (meal[slot] !== undefined && meal[slot] !== null && meal[slot] !== '') {
            const idStr = String(meal[slot]).trim();
            if (!mongoose.Types.ObjectId.isValid(idStr)) {
              return {
                isValid: false,
                error: `Invalid recipe ID format for ${slot} at index ${i}.`,
              };
            }
            sanitizedEntry[slot] = new mongoose.Types.ObjectId(idStr);
          }
        }

        if (meal.snacks !== undefined && meal.snacks !== null) {
          if (!Array.isArray(meal.snacks)) {
            return {
              isValid: false,
              error: `Snacks at index ${i} must be an array of recipe IDs.`,
            };
          }
          const validSnacks = [];
          for (let s = 0; s < meal.snacks.length; s++) {
            const snackIdStr = String(meal.snacks[s]).trim();
            if (!mongoose.Types.ObjectId.isValid(snackIdStr)) {
              return {
                isValid: false,
                error: `Invalid snack recipe ID format at index ${i}, snack ${s}.`,
              };
            }
            validSnacks.push(new mongoose.Types.ObjectId(snackIdStr));
          }
          sanitizedEntry.snacks = validSnacks;
        }

        sanitizedMeals.push(sanitizedEntry);
      }
      sanitized.meals = sanitizedMeals;
    } else if (!isPartial) {
      sanitized.meals = [];
    }

    return {
      isValid: true,
      sanitized,
    };
  } catch (err) {
    return {
      isValid: false,
      error: err.message,
    };
  }
};

/**
 * Validate and sanitize individual meal slot update payload
 * PUT /api/meal-plans/:id/meals
 * @param {Object} input
 * @returns {{ isValid: boolean, error?: string, sanitized?: Object }}
 */
export const validateMealSlotUpdate = (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      isValid: false,
      error: 'Meal update data must be a valid JSON object.',
    };
  }

  try {
    if (!input.date) {
      return {
        isValid: false,
        error: 'Date is required for meal slot update.',
      };
    }
    const date = parseDate(input.date, 'Date');

    if (!input.mealType || typeof input.mealType !== 'string') {
      return {
        isValid: false,
        error: `Meal type is required. Allowed values: ${VALID_MEAL_SLOT_TYPES.join(', ')}`,
      };
    }

    const mealType = input.mealType.trim().toLowerCase();
    if (!VALID_MEAL_SLOT_TYPES.includes(mealType)) {
      return {
        isValid: false,
        error: `Invalid meal type "${input.mealType}". Allowed values: ${VALID_MEAL_SLOT_TYPES.join(', ')}`,
      };
    }

    let recipeId = null;
    let recipeIds = null;

    if (mealType === 'snacks') {
      // Snacks can accept array or single recipeId
      if (input.recipeIds !== undefined) {
        if (!Array.isArray(input.recipeIds)) {
          return {
            isValid: false,
            error: 'recipeIds for snacks must be an array of recipe IDs.',
          };
        }
        for (const id of input.recipeIds) {
          if (!mongoose.Types.ObjectId.isValid(String(id).trim())) {
            return {
              isValid: false,
              error: `Invalid recipe ID format in snacks array: ${id}`,
            };
          }
        }
        recipeIds = input.recipeIds.map((id) => new mongoose.Types.ObjectId(String(id).trim()));
      } else if (input.recipeId !== undefined && input.recipeId !== null && input.recipeId !== '') {
        const idStr = String(input.recipeId).trim();
        if (!mongoose.Types.ObjectId.isValid(idStr)) {
          return {
            isValid: false,
            error: 'Invalid recipe ID format for snack.',
          };
        }
        recipeIds = [new mongoose.Types.ObjectId(idStr)];
      } else {
        recipeIds = [];
      }
    } else {
      if (input.recipeId !== undefined && input.recipeId !== null && input.recipeId !== '') {
        const idStr = String(input.recipeId).trim();
        if (!mongoose.Types.ObjectId.isValid(idStr)) {
          return {
            isValid: false,
            error: `Invalid recipe ID format for ${mealType}.`,
          };
        }
        recipeId = new mongoose.Types.ObjectId(idStr);
      }
    }

    return {
      isValid: true,
      sanitized: {
        date,
        mealType,
        recipeId,
        recipeIds,
      },
    };
  } catch (err) {
    return {
      isValid: false,
      error: err.message,
    };
  }
};

export const VALID_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
export const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];
export const VALID_SOURCES = ['ai', 'user', 'system'];

/**
 * Normalizes numeric inputs (e.g. "200g" -> 200, "15 mins" -> 15)
 */
const parsePositiveNumber = (val, fieldName, defaultValue = 0) => {
  if (val === undefined || val === null || val === '') return defaultValue;
  if (typeof val === 'number') {
    if (isNaN(val) || val < 0) {
      throw new Error(`${fieldName} must be a valid positive number.`);
    }
    return val;
  }
  if (typeof val === 'string') {
    const match = val.trim().match(/^([0-9]+(?:\.[0-9]+)?)/);
    if (!match) {
      throw new Error(`${fieldName} must be a valid positive number.`);
    }
    const num = parseFloat(match[1]);
    if (isNaN(num) || num < 0) {
      throw new Error(`${fieldName} must be a valid positive number.`);
    }
    return num;
  }
  throw new Error(`${fieldName} must be a valid number.`);
};

/**
 * Validate and sanitize recipe payload
 * @param {Object} input - Raw request body
 * @param {boolean} isPartial - If true (PUT), missing required fields are permitted
 * @returns {{ isValid: boolean, error?: string, sanitized?: Object }}
 */
export const validateRecipeInput = (input, isPartial = false) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      isValid: false,
      error: 'Recipe data must be a valid JSON object.',
    };
  }

  const sanitized = {};

  try {
    // 1. Name
    if (input.name !== undefined) {
      if (typeof input.name !== 'string' || input.name.trim().length < 2) {
        return {
          isValid: false,
          error: 'Recipe name is required and must be at least 2 characters.',
        };
      }
      sanitized.name = input.name.trim();
    } else if (!isPartial) {
      return {
        isValid: false,
        error: 'Recipe name is required.',
      };
    }

    // 2. Description
    if (input.description !== undefined) {
      sanitized.description = typeof input.description === 'string' ? input.description.trim() : '';
    } else if (!isPartial) {
      sanitized.description = '';
    }

    // 3. Image
    if (input.image !== undefined) {
      sanitized.image = typeof input.image === 'string' ? input.image.trim() : '';
    } else if (!isPartial) {
      sanitized.image = '';
    }

    // 4. Meal Type
    if (input.mealType !== undefined) {
      if (typeof input.mealType !== 'string') {
        return {
          isValid: false,
          error: 'Meal type must be a string.',
        };
      }
      const meal = input.mealType.trim().toLowerCase();
      if (!VALID_MEAL_TYPES.includes(meal)) {
        return {
          isValid: false,
          error: `Invalid meal type "${input.mealType}". Allowed: ${VALID_MEAL_TYPES.join(', ')}`,
        };
      }
      sanitized.mealType = meal;
    } else if (!isPartial) {
      return {
        isValid: false,
        error: `Meal type is required. Allowed: ${VALID_MEAL_TYPES.join(', ')}`,
      };
    }

    // 5. Dietary Tags
    if (input.dietaryTags !== undefined) {
      if (!Array.isArray(input.dietaryTags)) {
        return {
          isValid: false,
          error: 'Dietary tags must be an array of strings.',
        };
      }
      sanitized.dietaryTags = input.dietaryTags
        .filter((t) => typeof t === 'string' && t.trim().length > 0)
        .map((t) => t.trim().toLowerCase());
    } else if (!isPartial) {
      sanitized.dietaryTags = [];
    }

    // 6. Ingredients
    if (input.ingredients !== undefined) {
      if (!Array.isArray(input.ingredients) || input.ingredients.length === 0) {
        return {
          isValid: false,
          error: 'Recipe must have at least one ingredient.',
        };
      }
      const cleanedIngredients = [];
      for (let i = 0; i < input.ingredients.length; i++) {
        const ing = input.ingredients[i];
        if (!ing || typeof ing !== 'object') {
          return {
            isValid: false,
            error: `Ingredient at index ${i} must be an object with name and quantity.`,
          };
        }
        const ingName = (ing.name || ing.item || '').trim();
        if (!ingName) {
          return {
            isValid: false,
            error: `Ingredient at index ${i} must have a valid name.`,
          };
        }
        const qty = parsePositiveNumber(ing.quantity, `Ingredient "${ingName}" quantity`, 1);
        const unit = typeof ing.unit === 'string' ? ing.unit.trim() : '';
        const category =
          typeof ing.category === 'string' && ing.category.trim().length > 0
            ? ing.category.trim().toLowerCase()
            : 'other';

        cleanedIngredients.push({
          name: ingName,
          quantity: qty,
          unit,
          category,
        });
      }
      sanitized.ingredients = cleanedIngredients;
    } else if (!isPartial) {
      return {
        isValid: false,
        error: 'Recipe must include at least one ingredient.',
      };
    }

    // 7. Instructions
    if (input.instructions !== undefined) {
      if (!Array.isArray(input.instructions) || input.instructions.length === 0) {
        return {
          isValid: false,
          error: 'Recipe must include at least one instruction step.',
        };
      }
      const cleanedInstructions = [];
      for (let i = 0; i < input.instructions.length; i++) {
        const step = input.instructions[i];
        let text = '';
        if (typeof step === 'string') {
          text = step.trim();
        } else if (step && typeof step === 'object' && step.text) {
          text = String(step.text).trim();
        }
        if (!text) {
          return {
            isValid: false,
            error: `Instruction step at index ${i} cannot be empty.`,
          };
        }
        cleanedInstructions.push(text);
      }
      sanitized.instructions = cleanedInstructions;
    } else if (!isPartial) {
      return {
        isValid: false,
        error: 'Recipe must include at least one instruction step.',
      };
    }

    // 8. Timings & Servings
    if (input.prepTime !== undefined) {
      sanitized.prepTime = parsePositiveNumber(input.prepTime, 'prepTime', 0);
    } else if (!isPartial) {
      sanitized.prepTime = 0;
    }

    if (input.cookTime !== undefined) {
      sanitized.cookTime = parsePositiveNumber(input.cookTime, 'cookTime', 0);
    } else if (!isPartial) {
      sanitized.cookTime = 0;
    }

    if (input.totalTime !== undefined) {
      sanitized.totalTime = parsePositiveNumber(input.totalTime, 'totalTime', 0);
    } else if (!isPartial) {
      sanitized.totalTime = (sanitized.prepTime || 0) + (sanitized.cookTime || 0);
    }

    if (input.servings !== undefined) {
      const s = parsePositiveNumber(input.servings, 'servings', 1);
      if (s < 1) {
        return { isValid: false, error: 'Servings must be at least 1.' };
      }
      sanitized.servings = Math.round(s);
    } else if (!isPartial) {
      sanitized.servings = 1;
    }

    // 9. Nutrition
    if (input.nutrition !== undefined) {
      if (typeof input.nutrition !== 'object' || input.nutrition === null || Array.isArray(input.nutrition)) {
        return {
          isValid: false,
          error: 'Nutrition must be a valid object.',
        };
      }
      if (isPartial) {
        const nut = {};
        if (input.nutrition.calories !== undefined) nut.calories = parsePositiveNumber(input.nutrition.calories, 'calories', 0);
        if (input.nutrition.protein !== undefined) nut.protein = parsePositiveNumber(input.nutrition.protein, 'protein', 0);
        if (input.nutrition.carbohydrates !== undefined) nut.carbohydrates = parsePositiveNumber(input.nutrition.carbohydrates, 'carbohydrates', 0);
        if (input.nutrition.fats !== undefined) nut.fats = parsePositiveNumber(input.nutrition.fats, 'fats', 0);
        sanitized.nutrition = nut;
      } else {
        sanitized.nutrition = {
          calories: parsePositiveNumber(input.nutrition.calories, 'calories', 0),
          protein: parsePositiveNumber(input.nutrition.protein, 'protein', 0),
          carbohydrates: parsePositiveNumber(input.nutrition.carbohydrates, 'carbohydrates', 0),
          fats: parsePositiveNumber(input.nutrition.fats, 'fats', 0),
        };
      }
    } else if (!isPartial) {
      sanitized.nutrition = { calories: 0, protein: 0, carbohydrates: 0, fats: 0 };
    }

    // 10. Cuisine
    if (input.cuisine !== undefined) {
      sanitized.cuisine = typeof input.cuisine === 'string' ? input.cuisine.trim().toLowerCase() : 'other';
    } else if (!isPartial) {
      sanitized.cuisine = 'other';
    }

    // 11. Difficulty
    if (input.difficulty !== undefined) {
      if (typeof input.difficulty !== 'string') {
        return {
          isValid: false,
          error: 'Difficulty must be a string.',
        };
      }
      const diff = input.difficulty.trim().toLowerCase();
      if (!VALID_DIFFICULTIES.includes(diff)) {
        return {
          isValid: false,
          error: `Invalid difficulty "${input.difficulty}". Allowed: ${VALID_DIFFICULTIES.join(', ')}`,
        };
      }
      sanitized.difficulty = diff;
    } else if (!isPartial) {
      sanitized.difficulty = 'medium';
    }

    // 12. Source
    if (input.source !== undefined) {
      if (typeof input.source !== 'string') {
        return {
          isValid: false,
          error: 'Source must be a string.',
        };
      }
      const src = input.source.trim().toLowerCase();
      if (!VALID_SOURCES.includes(src)) {
        return {
          isValid: false,
          error: `Invalid source "${input.source}". Allowed: ${VALID_SOURCES.join(', ')}`,
        };
      }
      sanitized.source = src;
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

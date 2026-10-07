import {
  VALID_GROCERY_CATEGORIES,
  VALID_GROCERY_SOURCES,
} from '../models/groceryList.model.js';

export { VALID_GROCERY_CATEGORIES, VALID_GROCERY_SOURCES };

/**
 * Keyword-based category classification for recipe ingredients
 */
const CATEGORY_KEYWORDS = {
  beverages: [
    'water', 'tea', 'coffee', 'juice', 'smoothie', 'soda', 'kombucha'
  ],
  snacks: [
    'chips', 'cracker', 'popcorn', 'cluster', 'granola'
  ],
  dairy: [
    'milk', 'paneer', 'cheese', 'butter', 'yogurt', 'curd', 'cream', 'ghee',
    'feta', 'ricotta', 'mozzarella', 'parmesan'
  ],
  protein: [
    'chicken', 'salmon', 'egg', 'eggs', 'turkey', 'beef', 'tuna', 'fish', 'prawn',
    'shrimp', 'tofu', 'tempeh', 'chickpea', 'chickpeas', 'lentil', 'lentils',
    'almond', 'walnut', 'chia', 'peanut', 'edamame'
  ],
  grains: [
    'rice', 'quinoa', 'oat', 'oats', 'oatmeal', 'flour', 'pasta', 'noodle',
    'bread', 'wheat', 'barley', 'tortilla', 'wrap', 'couscous'
  ],
  vegetables: [
    'spinach', 'kale', 'lettuce', 'arugula', 'cabbage', 'broccoli', 'cauliflower',
    'carrot', 'cucumber', 'tomato', 'onion', 'garlic', 'ginger', 'bell pepper',
    'capsicum', 'potato', 'mushroom', 'zucchini', 'eggplant', 'celery', 'peas',
    'cilantro', 'parsley', 'coriander', 'mint', 'scallion', 'radish', 'beet',
    'corn', 'beans', 'avocado'
  ],
  fruits: [
    'apple', 'banana', 'berry', 'berries', 'blueberry', 'strawberry', 'raspberry',
    'lemon', 'lime', 'orange', 'citrus', 'mango', 'pineapple', 'grape', 'pear',
    'peach', 'plum', 'coconut'
  ],
  spices: [
    'salt', 'pepper', 'black pepper', 'cumin', 'turmeric', 'paprika', 'oregano',
    'cinnamon', 'chili', 'chilli', 'olive oil', 'oil', 'vinegar', 'tahini',
    'vanilla', 'mustard', 'sauce', 'honey'
  ],
};

/**
 * Automatically determine the best category for an ingredient name
 * @param {string} ingredientName
 * @returns {string}
 */
export const categorizeIngredientName = (ingredientName = '') => {
  const lower = String(ingredientName).toLowerCase().trim();
  if (!lower) return 'other';

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        return category;
      }
    }
  }

  return 'other';
};

/**
 * Normalizes numeric quantity inputs
 */
const parsePositiveQuantity = (val, fieldName, defaultValue = 1) => {
  if (val === undefined || val === null || val === '') return defaultValue;
  if (typeof val === 'number') {
    if (isNaN(val) || val < 0) {
      throw new Error(`${fieldName} cannot be negative.`);
    }
    return val;
  }
  if (typeof val === 'string') {
    const match = val.trim().match(/^([0-9]+(?:\.[0-9]+)?)/);
    if (!match) {
      throw new Error(`${fieldName} must be a valid number.`);
    }
    const num = parseFloat(match[1]);
    if (isNaN(num) || num < 0) {
      throw new Error(`${fieldName} cannot be negative.`);
    }
    return num;
  }
  throw new Error(`${fieldName} must be a valid number.`);
};

/**
 * Validate and sanitize single grocery item
 * @param {Object} input
 * @param {boolean} isPartial
 * @returns {{ isValid: boolean, error?: string, sanitized?: Object }}
 */
export const validateGroceryItemInput = (input, isPartial = false) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      isValid: false,
      error: 'Item data must be a valid JSON object.',
    };
  }

  const sanitized = {};

  try {
    // 1. Name
    if (input.name !== undefined) {
      if (typeof input.name !== 'string' || input.name.trim().length === 0) {
        return {
          isValid: false,
          error: 'Item name is required and cannot be empty.',
        };
      }
      sanitized.name = input.name.trim();
    } else if (!isPartial) {
      return {
        isValid: false,
        error: 'Item name is required.',
      };
    }

    // 2. Quantity
    if (input.quantity !== undefined) {
      sanitized.quantity = parsePositiveQuantity(input.quantity, 'Item quantity', 1);
    } else if (!isPartial) {
      sanitized.quantity = 1;
    }

    // 3. Unit
    if (input.unit !== undefined) {
      sanitized.unit = typeof input.unit === 'string' ? input.unit.trim() : '';
    } else if (!isPartial) {
      sanitized.unit = '';
    }

    // 4. Category
    if (input.category !== undefined) {
      const cat = String(input.category).trim().toLowerCase();
      if (VALID_GROCERY_CATEGORIES.includes(cat)) {
        sanitized.category = cat;
      } else {
        sanitized.category = 'other';
      }
    } else if (!isPartial) {
      sanitized.category = sanitized.name
        ? categorizeIngredientName(sanitized.name)
        : 'other';
    }

    // 5. Checked
    if (input.checked !== undefined) {
      sanitized.checked = Boolean(input.checked);
    } else if (!isPartial) {
      sanitized.checked = false;
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
 * Validate and sanitize full GroceryList creation or update payload
 * @param {Object} input
 * @param {boolean} isPartial
 * @returns {{ isValid: boolean, error?: string, sanitized?: Object }}
 */
export const validateGroceryListInput = (input, isPartial = false) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      isValid: false,
      error: 'Grocery list data must be a valid JSON object.',
    };
  }

  const sanitized = {};

  try {
    // 1. Name
    if (input.name !== undefined) {
      if (typeof input.name !== 'string' || input.name.trim().length < 2) {
        return {
          isValid: false,
          error: 'Grocery list name must be at least 2 characters long.',
        };
      }
      if (input.name.trim().length > 100) {
        return {
          isValid: false,
          error: 'Grocery list name cannot exceed 100 characters.',
        };
      }
      sanitized.name = input.name.trim();
    } else if (!isPartial) {
      sanitized.name = 'My Grocery List';
    }

    // 2. Source
    if (input.source !== undefined) {
      const src = String(input.source).trim().toLowerCase();
      if (!VALID_GROCERY_SOURCES.includes(src)) {
        return {
          isValid: false,
          error: `Invalid source "${input.source}". Allowed: ${VALID_GROCERY_SOURCES.join(', ')}`,
        };
      }
      sanitized.source = src;
    } else if (!isPartial) {
      sanitized.source = 'manual';
    }

    // 3. Items array
    if (input.items !== undefined) {
      if (!Array.isArray(input.items)) {
        return {
          isValid: false,
          error: 'Items must be an array of grocery items.',
        };
      }
      const sanitizedItems = [];
      for (let i = 0; i < input.items.length; i++) {
        const itemRes = validateGroceryItemInput(input.items[i], false);
        if (!itemRes.isValid) {
          return {
            isValid: false,
            error: `Item at index ${i}: ${itemRes.error}`,
          };
        }
        sanitizedItems.push(itemRes.sanitized);
      }
      sanitized.items = sanitizedItems;
    } else if (!isPartial) {
      sanitized.items = [];
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

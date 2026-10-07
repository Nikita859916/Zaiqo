/**
 * Zaiqo Grocery List Service
 * 
 * Handles extraction of ingredients from recipes, automatic grocery categorization,
 * smart duplicate combining, source tracking, and localStorage persistence.
 */

export const GROCERY_CATEGORIES = [
  'Vegetables',
  'Fruits',
  'Dairy',
  'Grains',
  'Protein',
  'Spices & Condiments',
  'Other',
];

const STORAGE_KEY = 'zaiqo_grocery_list';

const CATEGORY_MAP = {
  Vegetables: [
    'spinach', 'kale', 'lettuce', 'arugula', 'cabbage', 'broccoli', 'cauliflower',
    'carrot', 'carrots', 'cucumber', 'cucumbers', 'tomato', 'tomatoes', 'onion', 'onions',
    'garlic', 'ginger', 'bell pepper', 'peppers', 'capsicum', 'potato', 'potatoes',
    'sweet potato', 'mushroom', 'mushrooms', 'zucchini', 'eggplant', 'celery',
    'asparagus', 'peas', 'cilantro', 'parsley', 'coriander', 'mint', 'greens',
    'scallion', 'scallions', 'leek', 'radish', 'beet', 'beetroot', 'corn', 'beans'
  ],
  Fruits: [
    'apple', 'apples', 'banana', 'bananas', 'berry', 'berries', 'blueberry', 'blueberries',
    'strawberry', 'strawberries', 'raspberry', 'raspberries', 'lemon', 'lemons',
    'lime', 'limes', 'orange', 'oranges', 'avocado', 'avocados', 'citrus', 'mango',
    'pineapple', 'grape', 'grapes', 'pear', 'watermelon', 'peach', 'plum', 'coconut'
  ],
  Dairy: [
    'milk', 'paneer', 'cheese', 'butter', 'yogurt', 'curd', 'cream', 'ghee',
    'cheddar', 'mozzarella', 'parmesan', 'cottage cheese', 'ricotta', 'feta'
  ],
  Grains: [
    'rice', 'quinoa', 'oat', 'oats', 'oatmeal', 'flour', 'pasta', 'noodle', 'noodles',
    'bread', 'wheat', 'barley', 'millet', 'tortilla', 'wrap', 'couscous'
  ],
  Protein: [
    'chicken', 'salmon', 'egg', 'eggs', 'turkey', 'beef', 'tuna', 'fish', 'prawn', 'shrimp',
    'tofu', 'tempeh', 'chickpea', 'chickpeas', 'lentil', 'lentils', 'black bean',
    'almond', 'almonds', 'walnut', 'walnuts', 'chia', 'chia seeds', 'nut', 'nuts',
    'peanut', 'peanuts', 'hemp', 'edamame'
  ],
  'Spices & Condiments': [
    'salt', 'pepper', 'black pepper', 'cumin', 'turmeric', 'paprika', 'oregano',
    'cinnamon', 'chili', 'chilli', 'olive oil', 'oil', 'vinegar', 'tahini', 'vanilla',
    'mustard', 'soy sauce', 'sauce', 'honey', 'maple syrup', 'dressing', 'mayo',
    'sesame oil', 'garlic powder', 'curry powder'
  ],
};

/**
 * Automatically determine the category for a given ingredient
 */
export function categorizeIngredient(ingredientName = '') {
  const lower = ingredientName.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
    for (const keyword of keywords) {
      // Check full word or sub-match
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(lower) || lower.includes(keyword)) {
        return category;
      }
    }
  }

  return 'Other';
}

/**
 * Parse quantity and unit from quantity string
 * e.g., "200g" -> { quantity: 200, unit: "g" }
 * e.g., "3 pieces" -> { quantity: 3, unit: "pieces" }
 * e.g., "1/2 cup" -> { quantity: 0.5, unit: "cup" }
 */
export function parseQuantityAndUnit(quantityStr = '') {
  if (!quantityStr || typeof quantityStr !== 'string') {
    return { quantity: 1, unit: '' };
  }

  const str = quantityStr.trim();

  // Fraction format e.g. "1/2 cup"
  const fractionMatch = str.match(/^(\d+)\/(\d+)\s*(.*)$/);
  if (fractionMatch) {
    const val = parseFloat(fractionMatch[1]) / parseFloat(fractionMatch[2]);
    return {
      quantity: Math.round(val * 100) / 100,
      unit: fractionMatch[3].trim(),
    };
  }

  // Combined whole and fraction e.g. "1 1/2 cups"
  const mixedMatch = str.match(/^(\d+)\s+(\d+)\/(\d+)\s*(.*)$/);
  if (mixedMatch) {
    const val = parseFloat(mixedMatch[1]) + (parseFloat(mixedMatch[2]) / parseFloat(mixedMatch[3]));
    return {
      quantity: Math.round(val * 100) / 100,
      unit: mixedMatch[4].trim(),
    };
  }

  // Standard numeric with optional unit e.g. "250g", "2.5 cups", "3 cloves"
  const numericMatch = str.match(/^([\d.]+)\s*(.*)$/);
  if (numericMatch) {
    return {
      quantity: parseFloat(numericMatch[1]),
      unit: numericMatch[2].trim(),
    };
  }

  // Fallback for non-numeric (e.g. "To taste", "A pinch")
  return {
    quantity: 1,
    unit: str,
  };
}

/**
 * Normalize ingredient name for duplicate detection
 * e.g. "Paneer (cubed)" -> "paneer"
 * e.g. "Cherry tomatoes (halved)" -> "tomato"
 */
export function normalizeIngredientName(name = '') {
  return name
    .toLowerCase()
    .replace(/\s*\([^)]*\)/g, '') // remove parenthetical notes
    .replace(/^(fresh|organic|ripe|raw|cooked|warm|cold-pressed|baby|wild|tri-color)\s+/gi, '') // remove common adjectives
    .replace(/es$/i, '') // basic plural reduction
    .replace(/s$/i, '')
    .trim();
}

/**
 * Clean display name for presentation
 */
export function cleanDisplayName(name = '') {
  return name
    .replace(/\s*\([^)]*\)/g, '')
    .trim();
}

/**
 * Normalize units for comparison (e.g. "piece" vs "pieces")
 */
function normalizeUnit(unit = '') {
  const u = (unit || '').toLowerCase().trim();
  if (u === 'piece' || u === 'pieces' || u === 'pc' || u === 'pcs') return 'pieces';
  if (u === 'cup' || u === 'cups') return 'cup';
  if (u === 'clove' || u === 'cloves') return 'cloves';
  if (u === 'tbsp' || u === 'tablespoon' || u === 'tablespoons') return 'tbsp';
  if (u === 'tsp' || u === 'teaspoon' || u === 'teaspoons') return 'tsp';
  if (u === 'g' || u === 'grams' || u === 'gram') return 'g';
  if (u === 'kg' || u === 'kilogram' || u === 'kilograms') return 'kg';
  if (u === 'ml' || u === 'milliliters') return 'ml';
  return u;
}

/**
 * Smart combination of ingredients into existing list
 * Combines quantities of matching items and tracks multiple sources
 */
export function mergeIngredientsIntoList(existingList = [], newIngredients = [], recipeName = '') {
  const updatedList = existingList.map((item) => ({ ...item, sources: [...(item.sources || [])] }));

  for (const rawIng of newIngredients) {
    const rawName = typeof rawIng === 'string' ? rawIng : rawIng.item || '';
    const rawQtyStr = typeof rawIng === 'object' && rawIng.quantity ? String(rawIng.quantity) : '1';

    if (!rawName.trim()) continue;

    const parsed = parseQuantityAndUnit(rawQtyStr);
    const cleanedName = cleanDisplayName(rawName);
    const normalizedKey = normalizeIngredientName(rawName);
    const normalizedNewUnit = normalizeUnit(parsed.unit);

    // Look for duplicate in existing list
    const existingIndex = updatedList.findIndex(
      (item) => normalizeIngredientName(item.name) === normalizedKey
    );

    if (existingIndex >= 0) {
      const existingItem = updatedList[existingIndex];
      const normalizedExistingUnit = normalizeUnit(existingItem.unit);

      // Same or compatible unit: add numeric quantities
      if (normalizedExistingUnit === normalizedNewUnit) {
        const combinedQty = Math.round((Number(existingItem.quantity) + Number(parsed.quantity)) * 100) / 100;
        existingItem.quantity = combinedQty;
      } else if (!existingItem.unit && normalizedNewUnit) {
        existingItem.unit = parsed.unit;
        existingItem.quantity = parsed.quantity;
      } else {
        // Different units: format combined descriptor
        existingItem.quantity = `${existingItem.quantity} ${existingItem.unit || ''} + ${parsed.quantity} ${parsed.unit || ''}`.trim();
        existingItem.unit = '';
      }

      // Add source if not already tracked
      if (recipeName && !existingItem.sources.includes(recipeName)) {
        existingItem.sources.push(recipeName);
      }
    } else {
      // Create new item
      const category = (typeof rawIng === 'object' && rawIng.category) || categorizeIngredient(cleanedName);
      const newItem = {
        id: `groc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: cleanedName,
        quantity: parsed.quantity,
        unit: parsed.unit || (parsed.quantity > 1 ? 'pieces' : ''),
        category,
        completed: false,
        sources: recipeName ? [recipeName] : [],
        createdAt: Date.now(),
      };
      updatedList.push(newItem);
    }
  }

  return updatedList;
}

/**
 * Load grocery list from localStorage
 */
export function loadGroceryList() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save grocery list to localStorage
 */
export function saveGroceryList(list) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to save grocery list to localStorage', err);
  }
}

/**
 * Add all ingredients from a structured Recipe object
 */
export function addIngredientsFromRecipe(recipe) {
  if (!recipe || !Array.isArray(recipe.ingredients)) return [];

  const currentList = loadGroceryList();
  const updatedList = mergeIngredientsIntoList(currentList, recipe.ingredients, recipe.name);
  saveGroceryList(updatedList);
  return updatedList;
}

/**
 * Add a single manually entered item
 */
export function addManualItem({ name, quantity = 1, unit = '', category = '' }) {
  if (!name || !name.trim()) return loadGroceryList();

  const currentList = loadGroceryList();
  const cleanedName = cleanDisplayName(name);
  const detectedCategory = category || categorizeIngredient(cleanedName);

  const parsed = typeof quantity === 'string' ? parseQuantityAndUnit(quantity) : { quantity: Number(quantity) || 1, unit };

  const newItem = {
    id: `groc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    name: cleanedName,
    quantity: parsed.quantity,
    unit: unit || parsed.unit || '',
    category: detectedCategory,
    completed: false,
    sources: ['Manual Entry'],
    createdAt: Date.now(),
  };

  const updatedList = [newItem, ...currentList];
  saveGroceryList(updatedList);
  return updatedList;
}

/**
 * Update an existing grocery item
 */
export function updateGroceryItem(id, updates) {
  const currentList = loadGroceryList();
  const updatedList = currentList.map((item) => {
    if (item.id === id) {
      const merged = { ...item, ...updates };
      // If name changed, recalculate category if not explicitly provided
      if (updates.name && !updates.category) {
        merged.category = categorizeIngredient(updates.name);
      }
      return merged;
    }
    return item;
  });
  saveGroceryList(updatedList);
  return updatedList;
}

/**
 * Toggle completed state for an item
 */
export function toggleGroceryItem(id) {
  const currentList = loadGroceryList();
  const updatedList = currentList.map((item) =>
    item.id === id ? { ...item, completed: !item.completed } : item
  );
  saveGroceryList(updatedList);
  return updatedList;
}

/**
 * Delete a grocery item by ID
 */
export function deleteGroceryItem(id) {
  const currentList = loadGroceryList();
  const updatedList = currentList.filter((item) => item.id !== id);
  saveGroceryList(updatedList);
  return updatedList;
}

/**
 * Clear all completed items from list
 */
export function clearCompletedItems() {
  const currentList = loadGroceryList();
  const updatedList = currentList.filter((item) => !item.completed);
  saveGroceryList(updatedList);
  return updatedList;
}

/**
 * Clear all items from list
 */
export function clearAllItems() {
  saveGroceryList([]);
  return [];
}

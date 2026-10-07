import {
  canonicalizeIngredientName,
  normalizeUnit,
  getUnitDimension,
  resolveIngredientCategory,
} from '../utils/groceryIntelligenceValidation.js';

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Common culinary preparation phrases and modifiers to remove from ingredient identity.
 * Ordered from multi-word phrases to single words to prevent partial matching.
 */
const PREPARATION_WORDS = [
  'finely chopped',
  'coarsely chopped',
  'roughly chopped',
  'thinly sliced',
  'thickly sliced',
  'finely diced',
  'freshly ground',
  'room temperature',
  'to taste',
  'as needed',
  'as required',
  'for garnish',
  'for serving',
  'plus more',
  'washed and dried',
  'cleaned and chopped',
  'peeled and diced',
  'chopped',
  'diced',
  'sliced',
  'minced',
  'grated',
  'shredded',
  'peeled',
  'unpeeled',
  'crushed',
  'smashed',
  'ground',
  'powdered',
  'boiled',
  'roasted',
  'toasted',
  'fried',
  'sauteed',
  'mashed',
  'pureed',
  'whipped',
  'melted',
  'softened',
  'soaked',
  'drained',
  'rinsed',
  'thawed',
  'trimmed',
  'seeded',
  'deseeded',
  'pitted',
  'cored',
  'cubed',
  'shaved',
  'warm',
  'chilled',
  'optional',
  'divided',
  'garnish',
];

/**
 * Common size descriptors that modify count items (e.g., "2 medium onions" -> "onion")
 */
const SIZE_DESCRIPTORS = ['medium', 'large', 'small', 'extra large', 'big'];

/**
 * Compound ingredient terms whose adjectives are ESSENTIAL to identity
 * and must NEVER be stripped as preparation words or size descriptors.
 */
const PROTECTED_COMPOUND_NAMES = new Set([
  'olive oil',
  'extra virgin olive oil',
  'coconut oil',
  'mustard oil',
  'sesame oil',
  'sunflower oil',
  'canola oil',
  'vegetable oil',
  'peanut oil',
  'low-fat paneer',
  'malai paneer',
  'cottage cheese',
  'red onion',
  'spring onion',
  'green onion',
  'white onion',
  'yellow onion',
  'shallot',
  'shallots',
  'brown rice',
  'basmati rice',
  'white rice',
  'jasmine rice',
  'whole wheat flour',
  'all-purpose flour',
  'almond flour',
  'gram flour',
  'besan',
  'rice flour',
  'wheat roti',
  'whole wheat bread',
  'white bread',
  'green chilli',
  'red chilli',
  'kashmiri chilli',
  'bell pepper',
  'black pepper',
  'greek yogurt',
  'coconut milk',
  'almond milk',
  'soy milk',
  'oat milk',
  'condensed milk',
  'black beans',
  'kidney beans',
  'green beans',
  'dark chocolate',
  'milk chocolate',
]);

/**
 * Standard culinary unit mapping regular expressions
 */
const UNIT_REGEX =
  /\b(kg|kgs|kilo|kilos|kilogram|kilograms|g|gm|gms|gram|grams|mg|mgs|milligram|milligrams|l|ltr|ltrs|liter|liters|litre|litres|ml|mls|milliliter|milliliters|millilitre|millilitres|tbsp|tbs|tablespoon|tablespoons|tsp|teaspoon|teaspoons|cup|cups|pinch|pinches|clove|cloves|piece|pieces|pc|pcs|item|items|can|cans|packet|packets|pack|packs|bottle|bottles|slice|slices|bunch|bunches|box|boxes)\b/i;

/**
 * Ingredient Normalization Service
 * Deterministically parses, sanitizes, normalizes, and classifies ingredient strings or objects.
 */
class IngredientNormalizationService {
  /**
   * Safely checks for prototype pollution attempts in an object
   * @param {Object} obj
   * @returns {boolean}
   */
  hasPrototypePollution(obj) {
    if (!obj || typeof obj !== 'object') return false;
    if (
      Object.prototype.hasOwnProperty.call(obj, '__proto__') ||
      Object.prototype.hasOwnProperty.call(obj, 'constructor') ||
      Object.prototype.hasOwnProperty.call(obj, 'prototype')
    ) {
      return true;
    }
    for (const key of Object.getOwnPropertyNames(obj)) {
      if (FORBIDDEN_KEYS.has(key)) return true;
    }
    return false;
  }

  /**
   * Parses fraction or decimal string into a positive float
   * Handles: "2", "2.5", "1/2", "1 1/2", "3/4"
   * @param {string} str
   * @returns {number|null}
   */
  parseQuantity(str) {
    if (typeof str === 'number') {
      return Number.isFinite(str) && str > 0 ? Math.round(str * 100) / 100 : null;
    }
    if (!str || typeof str !== 'string') return null;

    const trimmed = str.trim();

    // Mixed fraction: "1 1/2"
    const mixedMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (mixedMatch) {
      const whole = parseInt(mixedMatch[1], 10);
      const num = parseInt(mixedMatch[2], 10);
      const den = parseInt(mixedMatch[3], 10);
      if (den > 0) return Math.round((whole + num / den) * 100) / 100;
    }

    // Simple fraction: "1/2" or "3/4"
    const fracMatch = trimmed.match(/^(\d+)\/(\d+)$/);
    if (fracMatch) {
      const num = parseInt(fracMatch[1], 10);
      const den = parseInt(fracMatch[2], 10);
      if (den > 0) return Math.round((num / den) * 100) / 100;
    }

    // Decimal or integer: "2" or "2.5"
    const decMatch = trimmed.match(/^(\d+(?:\.\d+)?)/);
    if (decMatch) {
      const val = parseFloat(decMatch[1]);
      return Number.isFinite(val) && val > 0 ? Math.round(val * 100) / 100 : null;
    }

    return null;
  }

  /**
   * Normalizes an individual ingredient (string or object) into a deterministic internal representation.
   * @param {string|Object} rawInput
   * @returns {{
   *   originalName: string,
   *   canonicalName: string,
   *   name: string,
   *   quantity: number,
   *   unit: string,
   *   category: string,
   *   preparation: string
   * }|null}
   */
  normalizeIngredient(rawInput) {
    if (!rawInput) return null;

    if (this.hasPrototypePollution(rawInput)) {
      throw new Error('Forbidden prototype property detected in ingredient input.');
    }

    let originalName = '';
    let explicitQty = null;
    let explicitUnit = '';
    let explicitCategory = '';

    if (typeof rawInput === 'object' && !Array.isArray(rawInput)) {
      originalName = String(rawInput.originalName || rawInput.name || rawInput.item || '').trim();
      if (rawInput.quantity !== undefined && rawInput.quantity !== null) {
        explicitQty = this.parseQuantity(rawInput.quantity);
      }
      if (typeof rawInput.unit === 'string') {
        explicitUnit = rawInput.unit.trim();
      }
      if (typeof rawInput.category === 'string') {
        explicitCategory = rawInput.category.trim();
      }
    } else if (typeof rawInput === 'string') {
      originalName = rawInput.trim();
    } else {
      return null;
    }

    if (!originalName || originalName.length === 0 || originalName.length > 200) {
      return null;
    }

    let workingText = originalName;

    // 1. Separate preparation phrases that follow a comma (e.g. "2 onions, finely chopped")
    let extractedPrep = '';
    if (workingText.includes(',')) {
      const commaParts = workingText.split(',');
      workingText = commaParts[0].trim();
      extractedPrep = commaParts.slice(1).join(', ').trim();
    }

    // 2. Extract leading quantity if not explicitly provided
    let quantity = explicitQty;
    const leadingQtyMatch = workingText.match(/^((?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?))\s*(.*)$/);
    if (leadingQtyMatch) {
      if (quantity === null) {
        quantity = this.parseQuantity(leadingQtyMatch[1]);
      }
      workingText = leadingQtyMatch[2].trim();
    }

    // 3. Extract unit if not explicitly provided
    let unit = explicitUnit;
    const unitMatch = workingText.match(UNIT_REGEX);
    if (unitMatch && workingText.startsWith(unitMatch[0])) {
      if (!unit) {
        unit = unitMatch[0];
      }
      workingText = workingText.slice(unitMatch[0].length).trim();
    }

    // Default quantity to 1 if not deterministically found
    if (quantity === null || !Number.isFinite(quantity) || quantity <= 0) {
      quantity = 1;
    }

    // Clamp extreme quantities for safety
    if (quantity > 100000) {
      quantity = 100000;
    }

    // 4. Normalize extracted unit
    const canonicalUnit = normalizeUnit(unit);

    // 5. Clean ingredient name: remove punctuation, preparation words, and size descriptors
    let cleanedName = workingText
      .replace(/[()]/g, ' ')
      .replace(/[^\w\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    // Check if the cleaned name is an essential compound before stripping preparation words
    if (!PROTECTED_COMPOUND_NAMES.has(cleanedName)) {
      // Strip size descriptors (e.g., "medium onion" -> "onion")
      for (const size of SIZE_DESCRIPTORS) {
        const sizeRegex = new RegExp(`^${size}\\s+`, 'i');
        if (sizeRegex.test(cleanedName)) {
          cleanedName = cleanedName.replace(sizeRegex, '').trim();
          break;
        }
      }

      // Strip preparation words from the name
      for (const prep of PREPARATION_WORDS) {
        const prepRegex = new RegExp(`\\b${prep}\\b`, 'gi');
        if (prepRegex.test(cleanedName)) {
          cleanedName = cleanedName.replace(prepRegex, '').trim();
          if (!extractedPrep) extractedPrep = prep;
        }
      }
    }

    cleanedName = cleanedName.replace(/\s+/g, ' ').trim();

    // If cleaned name became empty, fallback to workingText
    if (!cleanedName) {
      cleanedName = workingText.toLowerCase().trim();
    }

    // 6. Canonicalize singular and base name (preserve if already canonicalized)
    let canonicalName = '';
    if (typeof rawInput === 'object' && rawInput.canonicalName) {
      canonicalName = String(rawInput.canonicalName).trim().toLowerCase();
    } else {
      canonicalName = canonicalizeIngredientName(cleanedName) || cleanedName;
    }

    // 7. Resolve category
    const category = resolveIngredientCategory(explicitCategory, canonicalName);

    // Default unit to 'pc' if count dimension is implied and unit was empty
    const finalUnit = canonicalUnit || 'pc';

    return {
      originalName,
      canonicalName,
      name: canonicalName,
      quantity: Math.round(quantity * 100) / 100,
      unit: finalUnit,
      category,
      preparation: extractedPrep.toLowerCase().trim(),
    };
  }

  /**
   * Normalizes an array of ingredients (strings or objects)
   * Discards invalid entries cleanly.
   * @param {Array<string|Object>} rawList
   * @returns {Array<Object>}
   */
  normalizeIngredients(rawList = []) {
    if (!Array.isArray(rawList)) return [];

    const results = [];
    for (const item of rawList) {
      const normalized = this.normalizeIngredient(item);
      if (normalized) {
        results.push(normalized);
      }
    }
    return results;
  }

  /**
   * Tests if two ingredients are deterministically mergeable
   * Requirements for merging:
   * 1. Identical canonical name
   * 2. Compatible unit dimensions (mass to mass, volume to volume, count to count)
   * @param {Object} ing1
   * @param {Object} ing2
   * @returns {boolean}
   */
  isMergeable(ing1, ing2) {
    if (!ing1 || !ing2) return false;
    if (ing1.canonicalName !== ing2.canonicalName) return false;

    const dim1 = getUnitDimension(ing1.unit);
    const dim2 = getUnitDimension(ing2.unit);

    if (dim1.dimension === 'unitless' || dim2.dimension === 'unitless') {
      return dim1.dimension === dim2.dimension;
    }

    return dim1.dimension === dim2.dimension;
  }
}

const ingredientNormalizationService = new IngredientNormalizationService();
export default ingredientNormalizationService;

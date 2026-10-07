const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Supported deterministic dietary and health constraint catalog.
 * Categorized cleanly into dietary preferences, allergen exclusions, and health-oriented preferences.
 */
export const CONSTRAINT_CATALOG = {
  // 1. Dietary Preferences
  vegetarian: {
    id: 'vegetarian',
    category: 'dietary_preference',
    displayName: 'Vegetarian',
    restrictedTokens: [
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
      'poultry',
      'meat',
      'gelatin',
    ],
  },
  vegan: {
    id: 'vegan',
    category: 'dietary_preference',
    displayName: 'Vegan',
    restrictedTokens: [
      'chicken',
      'mutton',
      'lamb',
      'beef',
      'pork',
      'fish',
      'seafood',
      'meat',
      'gelatin',
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
    ],
  },
  eggetarian: {
    id: 'eggetarian',
    category: 'dietary_preference',
    displayName: 'Eggetarian',
    restrictedTokens: [
      'chicken',
      'mutton',
      'lamb',
      'beef',
      'pork',
      'fish',
      'seafood',
      'meat',
      'gelatin',
    ],
  },
  'non-vegetarian': {
    id: 'non-vegetarian',
    category: 'dietary_preference',
    displayName: 'Non-Vegetarian',
    restrictedTokens: [],
  },
  jain: {
    id: 'jain',
    category: 'dietary_preference',
    displayName: 'Jain',
    restrictedTokens: [
      'chicken',
      'mutton',
      'beef',
      'fish',
      'meat',
      'onion',
      'garlic',
      'potato',
      'carrot',
      'radish',
      'beetroot',
      'ginger',
      'root vegetable',
    ],
  },

  // 2. Allergen Exclusions
  'gluten-free': {
    id: 'gluten-free',
    category: 'allergen_exclusion',
    displayName: 'Gluten-Free',
    restrictedTokens: [
      'wheat',
      'flour',
      'maida',
      'barley',
      'rye',
      'bread',
      'pasta',
      'semolina',
      'sooji',
      'suji',
      'atta',
      'couscous',
      'soy sauce',
    ],
  },
  'dairy-free': {
    id: 'dairy-free',
    category: 'allergen_exclusion',
    displayName: 'Dairy-Free',
    restrictedTokens: [
      'milk',
      'butter',
      'ghee',
      'cheese',
      'paneer',
      'yogurt',
      'curd',
      'cream',
      'whey',
      'casein',
      'condensed milk',
    ],
  },
  'nut-free': {
    id: 'nut-free',
    category: 'allergen_exclusion',
    displayName: 'Nut-Free',
    restrictedTokens: [
      'peanut',
      'peanuts',
      'walnut',
      'walnuts',
      'almond',
      'almonds',
      'cashew',
      'cashews',
      'pistachio',
      'pistachios',
      'hazelnut',
      'hazelnuts',
      'pecan',
      'pecans',
      'peanut butter',
    ],
  },
  'egg-free': {
    id: 'egg-free',
    category: 'allergen_exclusion',
    displayName: 'Egg-Free',
    restrictedTokens: [
      'egg',
      'eggs',
      'egg yolk',
      'egg white',
      'mayonnaise',
    ],
  },
  'soy-free': {
    id: 'soy-free',
    category: 'allergen_exclusion',
    displayName: 'Soy-Free',
    restrictedTokens: [
      'soy',
      'soya',
      'soy sauce',
      'tofu',
      'edamame',
      'soy milk',
    ],
  },
  'shellfish-free': {
    id: 'shellfish-free',
    category: 'allergen_exclusion',
    displayName: 'Shellfish-Free',
    restrictedTokens: [
      'shrimp',
      'prawn',
      'prawns',
      'crab',
      'lobster',
      'oyster',
      'clam',
      'mussel',
    ],
  },

  // 3. Health-Oriented Preferences (Framed strictly as dietary preferences, NEVER medical claims)
  'low-sugar': {
    id: 'low-sugar',
    category: 'health_preference',
    displayName: 'Low-Sugar',
    restrictedTokens: [
      'sugar',
      'white sugar',
      'brown sugar',
      'honey',
      'jaggery',
      'corn syrup',
      'molasses',
      'candy',
      'sweetener',
    ],
  },
  'low-sodium': {
    id: 'low-sodium',
    category: 'health_preference',
    displayName: 'Low-Sodium',
    restrictedTokens: [
      'table salt',
      'soy sauce',
      'pickle',
      'pickles',
      'baking soda',
      'monosodium glutamate',
      'cured meat',
    ],
  },
  'high-protein': {
    id: 'high-protein',
    category: 'health_preference',
    displayName: 'High-Protein',
    restrictedTokens: [],
  },
  'low-carb': {
    id: 'low-carb',
    category: 'health_preference',
    displayName: 'Low-Carb',
    restrictedTokens: [
      'sugar',
      'refined flour',
      'maida',
      'candy',
    ],
  },
  'heart-friendly': {
    id: 'heart-friendly',
    category: 'health_preference',
    displayName: 'Heart-Friendly',
    restrictedTokens: [
      'deep fried',
      'palm oil',
      'lard',
    ],
  },
};

/**
 * Natural language intent to safe dietary constraint mapping
 */
const QUERY_INTENT_MAP = [
  { regex: /\b(diabet(?:es|ic)|diabetes-friendly|sugar-free|low\s+sugar|avoiding\s+sugar)\b/i, constraint: 'low-sugar' },
  { regex: /\b(hypertension|high\s+bp|blood\s+pressure|low\s+sodium|low\s+salt|low-sodium)\b/i, constraint: 'low-sodium' },
  { regex: /\b(c[oe]liac|avoiding\s+gluten|without\s+gluten|no\s+gluten|gluten-free|gluten\s+free)\b/i, constraint: 'gluten-free' },
  { regex: /\b(lactose|dairy-free|no\s+dairy|avoiding\s+dairy)\b/i, constraint: 'dairy-free' },
  { regex: /\b(nut\s+allergy|peanut\s+allergy|nut-free|no\s+nuts)\b/i, constraint: 'nut-free' },
  { regex: /\b(egg-free|no\s+eggs?|avoiding\s+eggs?)\b/i, constraint: 'egg-free' },
  { regex: /\b(vegetarian|veg\b|pure\s+veg)\b/i, constraint: 'vegetarian' },
  { regex: /\b(vegan|plant-based)\b/i, constraint: 'vegan' },
  { regex: /\b(high\s+protein|protein-rich|muscle)\b/i, constraint: 'high-protein' },
];

/**
 * Standard disclaimer reinforcing non-medical status
 */
export const MEDICAL_SAFETY_DISCLAIMER =
  'Zaiqo is a recipe and grocery planning assistant. Dietary filters are matched for culinary preference and allergen exclusion, not medical diagnosis or treatment.';

/**
 * Dietary Constraint Service
 * Provides deterministic validation and recipe compatibility evaluation for dietary and health preferences.
 */
class DietaryConstraintService {
  /**
   * Validate a single constraint ID safely
   * @param {any} rawConstraint
   * @returns {{ isValid: boolean, sanitized?: string, category?: string, error?: string }}
   */
  validateConstraint(rawConstraint) {
    if (!rawConstraint || typeof rawConstraint !== 'string') {
      return {
        isValid: false,
        error: 'Constraint must be a non-empty string.',
      };
    }

    if (rawConstraint.length > 50) {
      return {
        isValid: false,
        error: 'Constraint name exceeds length limit.',
      };
    }

    const normalized = rawConstraint.trim().toLowerCase();

    if (FORBIDDEN_KEYS.has(normalized)) {
      return {
        isValid: false,
        error: 'Forbidden property key in constraint.',
      };
    }

    const entry = CONSTRAINT_CATALOG[normalized];
    if (!entry) {
      return {
        isValid: false,
        error: `Unknown dietary constraint: "${rawConstraint}".`,
      };
    }

    return {
      isValid: true,
      sanitized: entry.id,
      category: entry.category,
    };
  }

  /**
   * Validate an array of constraints deterministically
   * @param {Array<any>} rawConstraints
   * @returns {{ isValid: boolean, sanitized: Array<string>, errors: Array<string> }}
   */
  validateConstraints(rawConstraints = []) {
    if (!Array.isArray(rawConstraints)) {
      return {
        isValid: false,
        sanitized: [],
        errors: ['Constraints must be provided as an array.'],
      };
    }

    // Prototype pollution check on array object
    if (
      Object.prototype.hasOwnProperty.call(rawConstraints, '__proto__') ||
      Object.prototype.hasOwnProperty.call(rawConstraints, 'constructor') ||
      Object.prototype.hasOwnProperty.call(rawConstraints, 'prototype')
    ) {
      return {
        isValid: false,
        sanitized: [],
        errors: ['Prohibited object keys in constraints.'],
      };
    }

    const uniqueSet = new Set();
    const errors = [];

    for (const item of rawConstraints) {
      const res = this.validateConstraint(item);
      if (res.isValid) {
        uniqueSet.add(res.sanitized);
      } else {
        errors.push(res.error);
      }
    }

    return {
      isValid: errors.length === 0,
      sanitized: [...uniqueSet],
      errors,
    };
  }

  /**
   * Extract recognized dietary and health constraints from natural language text
   * @param {string} text
   * @returns {Array<string>}
   */
  extractConstraintsFromText(text = '') {
    if (!text || typeof text !== 'string') return [];

    const found = new Set();
    for (const mapping of QUERY_INTENT_MAP) {
      if (mapping.regex.test(text)) {
        found.add(mapping.constraint);
      }
    }
    return [...found];
  }

  /**
   * Evaluate a recipe against one or more dietary constraints
   * @param {Object} recipe - Recipe object with ingredients and dietaryTags
   * @param {Array<string>} constraints - Array of normalized constraint IDs
   * @returns {{
   *   compatible: boolean,
   *   evaluatedConstraints: Array<string>,
   *   violations: Array<{ constraint: string, ingredient: string, token: string }>,
   *   framingNotice: string,
   *   disclaimer: string
   * }}
   */
  evaluateRecipeCompatibility(recipe, constraints = []) {
    if (!recipe || typeof recipe !== 'object') {
      return {
        compatible: false,
        evaluatedConstraints: [],
        violations: [],
        framingNotice: 'Invalid recipe provided for compatibility evaluation.',
        disclaimer: MEDICAL_SAFETY_DISCLAIMER,
      };
    }

    const validConstraints = this.validateConstraints(constraints).sanitized;
    if (validConstraints.length === 0) {
      return {
        compatible: true,
        evaluatedConstraints: [],
        violations: [],
        framingNotice: 'No constraints specified. Recipe evaluated with default settings.',
        disclaimer: MEDICAL_SAFETY_DISCLAIMER,
      };
    }

    const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
    const recipeTags = (Array.isArray(recipe.dietaryTags) ? recipe.dietaryTags : [])
      .map((t) => String(t).toLowerCase().trim());

    const violations = [];

    for (const constraintId of validConstraints) {
      const config = CONSTRAINT_CATALOG[constraintId];
      if (!config) continue;

      // Check if recipe explicitly declares compliance via dietaryTags
      const explicitlyTagged = recipeTags.includes(constraintId);

      // Check individual ingredients against restricted tokens
      for (const ing of ingredients) {
        const rawName = String(ing.name || ing.canonicalName || ing.item || '').toLowerCase();

        for (const token of config.restrictedTokens) {
          const regex = new RegExp(`\\b${token}\\b`, 'i');
          if (regex.test(rawName)) {
            violations.push({
              constraint: constraintId,
              ingredient: ing.name || rawName,
              token,
            });
            break;
          }
        }
      }
    }

    const isCompatible = violations.length === 0;

    let framingNotice = '';
    if (isCompatible) {
      const names = validConstraints.map((c) => CONSTRAINT_CATALOG[c]?.displayName || c).join(', ');
      framingNotice = `Recipe is compatible with the selected dietary constraints: ${names}.`;
    } else {
      const violatedNames = [...new Set(violations.map((v) => CONSTRAINT_CATALOG[v.constraint]?.displayName || v.constraint))].join(', ');
      framingNotice = `Recipe contains ingredient(s) incompatible with: ${violatedNames}.`;
    }

    return {
      compatible: isCompatible,
      evaluatedConstraints: validConstraints,
      violations,
      framingNotice,
      disclaimer: MEDICAL_SAFETY_DISCLAIMER,
    };
  }
}

const dietaryConstraintService = new DietaryConstraintService();
export default dietaryConstraintService;

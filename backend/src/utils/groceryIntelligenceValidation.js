import { categorizeIngredientName } from './groceryValidation.js';

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Common culinary irregular and regular singularization mapping
 */
const KNOWN_SINGULARS = {
  tomatoes: 'tomato',
  potatoes: 'potato',
  onions: 'onion',
  carrots: 'carrot',
  cucumbers: 'cucumber',
  chillies: 'chilli',
  chilies: 'chilli',
  chilis: 'chilli',
  capsicums: 'capsicum',
  zucchinis: 'zucchini',
  eggplants: 'eggplant',
  mushrooms: 'mushroom',
  radishes: 'radish',
  beets: 'beet',
  beetroots: 'beetroot',
  beans: 'beans', // culinary collective
  peas: 'peas',   // culinary collective
  eggs: 'egg',
  apples: 'apple',
  bananas: 'banana',
  lemons: 'lemon',
  limes: 'lime',
  oranges: 'orange',
  mangos: 'mango',
  mangoes: 'mango',
  berries: 'berry',
  strawberries: 'strawberry',
  blueberries: 'blueberry',
  raspberries: 'raspberry',
  blackberries: 'blackberry',
  grapes: 'grape',
  peaches: 'peach',
  avocados: 'avocado',
  cloves: 'clove',
  leaves: 'leaf',
  stalks: 'stalk',
  bunches: 'bunch',
  slices: 'slice',
  fillets: 'fillet',
  breasts: 'breast',
  thighs: 'thigh',
  tortillas: 'tortilla',
  rotis: 'roti',
  bhaturas: 'bhatura',
  dosas: 'dosa',
  parathas: 'paratha',
  naans: 'naan',
  noodles: 'noodles',
  walnuts: 'walnut',
  almonds: 'almond',
  peanuts: 'peanut',
  cashews: 'cashew',
};

/**
 * Words ending in 's' that are intrinsically singular or uncountable culinary terms
 */
const NON_PLURAL_WORDS = new Set([
  'hummus',
  'asparagus',
  'couscous',
  'oats',
  'oatmeal',
  'molasses',
  'citrus',
  'beans',
  'peas',
  'grass',
  'lemongrass',
  'watercress',
  'swiss chard',
  'rice',
  'paneer',
  'tofu',
  'spinach',
  'kale',
  'lettuce',
  'flour',
  'sugar',
  'salt',
  'butter',
  'ghee',
  'cheese',
  'milk',
  'cream',
  'yogurt',
  'curd',
  'fish',
  'beef',
  'chicken',
  'mutton',
  'pork',
  'pasta',
  'bread',
]);

/**
 * Standard unit alias dictionary
 */
const UNIT_ALIASES = {
  // Mass
  kg: 'kg',
  kgs: 'kg',
  kilo: 'kg',
  kilos: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  g: 'g',
  gm: 'g',
  gms: 'g',
  gram: 'g',
  grams: 'g',
  mg: 'mg',
  mgs: 'mg',
  milligram: 'mg',
  milligrams: 'mg',

  // Volume
  l: 'l',
  ltr: 'l',
  ltrs: 'l',
  liter: 'l',
  liters: 'l',
  litre: 'l',
  litres: 'l',
  ml: 'ml',
  mls: 'ml',
  milliliter: 'ml',
  milliliters: 'ml',
  millilitre: 'ml',
  millilitres: 'ml',

  // Spoons
  tbsp: 'tbsp',
  tbs: 'tbsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  tsp: 'tsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',

  // Count
  piece: 'piece',
  pieces: 'piece',
  pc: 'piece',
  pcs: 'piece',
  item: 'piece',
  items: 'piece',
  count: 'piece',

  // Common discrete culinary containers
  cup: 'cup',
  cups: 'cup',
  bunch: 'bunch',
  bunches: 'bunch',
  pinch: 'pinch',
  pinches: 'pinch',
  clove: 'clove',
  cloves: 'clove',
  can: 'can',
  cans: 'can',
  packet: 'packet',
  packets: 'packet',
  pack: 'packet',
  packs: 'packet',
  bottle: 'bottle',
  bottles: 'bottle',
  slice: 'slice',
  slices: 'slice',
  box: 'box',
  boxes: 'box',
};

/**
 * Unit dimension classification and base unit conversion factors
 */
const DIMENSION_CONFIG = {
  mass: {
    baseUnit: 'g',
    factors: {
      mg: 0.001,
      g: 1,
      kg: 1000,
    },
  },
  volume: {
    baseUnit: 'ml',
    factors: {
      ml: 1,
      l: 1000,
    },
  },
  spoons: {
    baseUnit: 'tsp',
    factors: {
      tsp: 1,
      tbsp: 3,
    },
  },
  count: {
    baseUnit: 'piece',
    factors: {
      piece: 1,
    },
  },
};

/**
 * Deterministically normalize a unit string to its canonical alias
 * @param {string} rawUnit
 * @returns {string}
 */
export const normalizeUnit = (rawUnit = '') => {
  if (!rawUnit || typeof rawUnit !== 'string') return '';
  const lower = rawUnit.trim().toLowerCase();
  return UNIT_ALIASES[lower] || lower;
};

/**
 * Retrieve dimension information for a normalized unit
 * @param {string} normUnit
 * @returns {{ dimension: string, baseUnit: string, factorToBase: number }}
 */
export const getUnitDimension = (normUnit) => {
  const u = normalizeUnit(normUnit);

  if (DIMENSION_CONFIG.mass.factors[u] !== undefined) {
    return {
      dimension: 'mass',
      baseUnit: DIMENSION_CONFIG.mass.baseUnit,
      factorToBase: DIMENSION_CONFIG.mass.factors[u],
    };
  }

  if (DIMENSION_CONFIG.volume.factors[u] !== undefined) {
    return {
      dimension: 'volume',
      baseUnit: DIMENSION_CONFIG.volume.baseUnit,
      factorToBase: DIMENSION_CONFIG.volume.factors[u],
    };
  }

  if (DIMENSION_CONFIG.spoons.factors[u] !== undefined) {
    return {
      dimension: 'spoons',
      baseUnit: DIMENSION_CONFIG.spoons.baseUnit,
      factorToBase: DIMENSION_CONFIG.spoons.factors[u],
    };
  }

  if (DIMENSION_CONFIG.count.factors[u] !== undefined) {
    return {
      dimension: 'count',
      baseUnit: DIMENSION_CONFIG.count.baseUnit,
      factorToBase: DIMENSION_CONFIG.count.factors[u],
    };
  }

  // Discrete, unconvertible or unknown unit
  return {
    dimension: u ? `discrete_${u}` : 'unitless',
    baseUnit: u,
    factorToBase: 1,
  };
};

/**
 * Clean and canonicalize an ingredient name deterministically
 * @param {string} rawName
 * @returns {string}
 */
export const canonicalizeIngredientName = (rawName = '') => {
  if (!rawName || typeof rawName !== 'string') return '';

  let name = rawName
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ') // Strip special punctuation
    .replace(/\s+/g, ' ')       // Collapse multiple whitespace
    .trim();

  if (!name) return '';

  // Check known singulars dictionary
  if (KNOWN_SINGULARS[name]) {
    return KNOWN_SINGULARS[name];
  }

  // Non-plural words
  if (NON_PLURAL_WORDS.has(name)) {
    return name;
  }

  // Handle multi-word names where the last word may be plural (e.g. "red onions" -> "red onion")
  const parts = name.split(' ');
  const last = parts[parts.length - 1];

  if (KNOWN_SINGULARS[last]) {
    parts[parts.length - 1] = KNOWN_SINGULARS[last];
    return parts.join(' ');
  }

  // Conservative rule-based singularization for common suffixes
  if (!NON_PLURAL_WORDS.has(last)) {
    if (last.endsWith('ies') && last.length > 4) {
      parts[parts.length - 1] = last.slice(0, -3) + 'y';
      return parts.join(' ');
    }
    if (last.endsWith('es') && (last.endsWith('shes') || last.endsWith('ches') || last.endsWith('sses') || last.endsWith('xes'))) {
      parts[parts.length - 1] = last.slice(0, -2);
      return parts.join(' ');
    }
    if (last.endsWith('s') && !last.endsWith('ss') && last.length > 3) {
      parts[parts.length - 1] = last.slice(0, -1);
      return parts.join(' ');
    }
  }

  return name;
};

/**
 * Convert base quantity and dimension to optimal human-readable quantity and unit
 * @param {number} baseQty
 * @param {string} dimension
 * @param {string} fallbackUnit
 * @returns {{ quantity: number, unit: string }}
 */
export const formatOptimalQuantityAndUnit = (baseQty, dimension, fallbackUnit = '') => {
  const roundedBase = Math.round(baseQty * 100) / 100;

  if (dimension === 'mass') {
    if (roundedBase >= 1000) {
      return {
        quantity: Math.round((roundedBase / 1000) * 100) / 100,
        unit: 'kg',
      };
    }
    return { quantity: roundedBase, unit: 'g' };
  }

  if (dimension === 'volume') {
    if (roundedBase >= 1000) {
      return {
        quantity: Math.round((roundedBase / 1000) * 100) / 100,
        unit: 'l',
      };
    }
    return { quantity: roundedBase, unit: 'ml' };
  }

  if (dimension === 'spoons') {
    if (roundedBase >= 3 && roundedBase % 3 === 0) {
      return {
        quantity: Math.round((roundedBase / 3) * 100) / 100,
        unit: 'tbsp',
      };
    }
    return { quantity: roundedBase, unit: 'tsp' };
  }

  if (dimension === 'count') {
    return {
      quantity: roundedBase,
      unit: roundedBase === 1 ? 'piece' : 'pieces',
    };
  }

  return {
    quantity: roundedBase,
    unit: fallbackUnit,
  };
};

/**
 * Resolve ingredient category prioritizing explicit structured categories over heuristics
 * @param {string} explicitCategory
 * @param {string} rawName
 * @returns {string}
 */
export const resolveIngredientCategory = (explicitCategory = '', rawName = '') => {
  const explicit = String(explicitCategory || '').trim().toLowerCase();
  if (explicit && explicit !== 'other') {
    return explicit;
  }

  const heuristic = categorizeIngredientName(rawName);
  return heuristic || 'other';
};

/**
 * Validate and sanitize single ingredient data
 * @param {any} input
 * @returns {{ isValid: boolean, error?: string, sanitized?: { name: string, canonicalName: string, quantity: number, unit: string, category: string } }}
 */
export const validateIngredientData = (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      isValid: false,
      error: 'Ingredient must be a valid JSON object.',
    };
  }

  // Prototype pollution protection
  if (
    Object.prototype.hasOwnProperty.call(input, '__proto__') ||
    Object.prototype.hasOwnProperty.call(input, 'constructor') ||
    Object.prototype.hasOwnProperty.call(input, 'prototype')
  ) {
    return {
      isValid: false,
      error: 'Prohibited object keys detected in ingredient payload.',
    };
  }

  for (const key of Object.getOwnPropertyNames(input)) {
    if (FORBIDDEN_KEYS.has(key)) {
      return {
        isValid: false,
        error: `Forbidden parameter key detected: ${key}`,
      };
    }
  }

  // Name
  const rawName = String(input.name || input.item || '').trim();
  if (!rawName || rawName.length === 0) {
    return {
      isValid: false,
      error: 'Ingredient name is required and cannot be empty.',
    };
  }
  if (rawName.length > 120) {
    return {
      isValid: false,
      error: 'Ingredient name cannot exceed 120 characters.',
    };
  }

  // Quantity
  let qty = input.quantity !== undefined ? input.quantity : 1;
  if (typeof qty === 'string') {
    const parsed = parseFloat(qty);
    if (!isNaN(parsed)) qty = parsed;
  }
  if (!Number.isFinite(qty) || isNaN(qty) || qty <= 0) {
    return {
      isValid: false,
      error: `Ingredient "${rawName}" quantity must be a positive finite number.`,
    };
  }
  if (qty > 100000) {
    return {
      isValid: false,
      error: `Ingredient "${rawName}" quantity exceeds the safety threshold of 100,000.`,
    };
  }

  // Unit
  const rawUnit = input.unit !== undefined && input.unit !== null ? String(input.unit).trim() : '';
  if (rawUnit.length > 50) {
    return {
      isValid: false,
      error: 'Ingredient unit cannot exceed 50 characters.',
    };
  }

  // Category
  const category = resolveIngredientCategory(input.category, rawName);

  return {
    isValid: true,
    sanitized: {
      name: rawName,
      canonicalName: canonicalizeIngredientName(rawName),
      quantity: Math.round(qty * 100) / 100,
      unit: normalizeUnit(rawUnit),
      category,
    },
  };
};

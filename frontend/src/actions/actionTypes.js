/**
 * Zaiqo Action Types
 * 
 * Defines the core action intents that Zai understands and maps to platform features.
 * Later, Gemini will output structured JSON containing one of these intents.
 */

export const ZAIQO_ACTIONS = {
  RECIPE_GENERATION: 'RECIPE_GENERATION',
  MEAL_PLANNING: 'MEAL_PLANNING',
  GROCERY_LIST: 'GROCERY_LIST',
  DIETARY_PREFERENCE: 'DIETARY_PREFERENCE',
  RECIPE_SEARCH: 'RECIPE_SEARCH',
  GENERAL_ZAIQO: 'GENERAL_ZAIQO',
};

export const ACTION_METADATA = {
  [ZAIQO_ACTIONS.RECIPE_GENERATION]: {
    label: 'Recipe Generation',
    description: 'Generates tailored recipes based on pantry ingredients and meal goals.',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  [ZAIQO_ACTIONS.MEAL_PLANNING]: {
    label: 'Meal Planning',
    description: 'Plans multi-day nutritional schedules calibrated to routine and macros.',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
  },
  [ZAIQO_ACTIONS.GROCERY_LIST]: {
    label: 'Grocery List',
    description: 'Compiles aisle-organized shopping lists from recipes or pantry gaps.',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  [ZAIQO_ACTIONS.DIETARY_PREFERENCE]: {
    label: 'Dietary Preference',
    description: 'Calibrates user dietary restrictions, allergies, and lifestyle habits.',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  [ZAIQO_ACTIONS.RECIPE_SEARCH]: {
    label: 'Recipe Search',
    description: 'Searches dietitian-verified culinary catalog by criteria and timing.',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  [ZAIQO_ACTIONS.GENERAL_ZAIQO]: {
    label: 'General Assistance',
    description: 'Explains Zaiqo platform capabilities, wellness logic, and guidance.',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
  },
};

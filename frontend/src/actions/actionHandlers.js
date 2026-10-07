/**
 * Zaiqo Action Handlers
 * 
 * Modular handler registry that processes structured intent/action JSON
 * and connects it to the appropriate Zaiqo feature or component.
 */

import { ZAIQO_ACTIONS, ACTION_METADATA } from './actionTypes.js';

export const actionHandlers = {
  [ZAIQO_ACTIONS.RECIPE_GENERATION]: (action) => ({
    intent: ZAIQO_ACTIONS.RECIPE_GENERATION,
    meta: ACTION_METADATA[ZAIQO_ACTIONS.RECIPE_GENERATION],
    targetFeature: 'RecipeStudio',
    ctaLabel: 'Generate Recipe',
    summary: action.parameters.ingredients?.length
      ? `Using ${action.parameters.ingredients.join(', ')}`
      : 'Personalized recipe ready to curate',
    parameters: action.parameters,
  }),

  [ZAIQO_ACTIONS.MEAL_PLANNING]: (action) => ({
    intent: ZAIQO_ACTIONS.MEAL_PLANNING,
    meta: ACTION_METADATA[ZAIQO_ACTIONS.MEAL_PLANNING],
    targetFeature: 'MealPlanner',
    ctaLabel: 'Review Meal Plan',
    summary: `Calibrating ${action.parameters.durationDays || 5}-day calendar`,
    parameters: action.parameters,
  }),

  [ZAIQO_ACTIONS.GROCERY_LIST]: (action) => ({
    intent: ZAIQO_ACTIONS.GROCERY_LIST,
    meta: ACTION_METADATA[ZAIQO_ACTIONS.GROCERY_LIST],
    targetFeature: 'SmartGrocery',
    ctaLabel: 'Open Grocery List',
    summary: 'Aisle-organized shopping checklist',
    parameters: action.parameters,
  }),

  [ZAIQO_ACTIONS.DIETARY_PREFERENCE]: (action) => ({
    intent: ZAIQO_ACTIONS.DIETARY_PREFERENCE,
    meta: ACTION_METADATA[ZAIQO_ACTIONS.DIETARY_PREFERENCE],
    targetFeature: 'DietarySettings',
    ctaLabel: 'Preference Applied',
    summary: `Calibrated for ${action.parameters.dietaryPreference || 'custom'} diet`,
    parameters: action.parameters,
  }),

  [ZAIQO_ACTIONS.RECIPE_SEARCH]: (action) => ({
    intent: ZAIQO_ACTIONS.RECIPE_SEARCH,
    meta: ACTION_METADATA[ZAIQO_ACTIONS.RECIPE_SEARCH],
    targetFeature: 'RecipeCatalog',
    ctaLabel: 'View Matching Recipes',
    summary: `Query: ${action.parameters.query || 'curated recipes'}`,
    parameters: action.parameters,
  }),

  [ZAIQO_ACTIONS.GENERAL_ZAIQO]: (action) => ({
    intent: ZAIQO_ACTIONS.GENERAL_ZAIQO,
    meta: ACTION_METADATA[ZAIQO_ACTIONS.GENERAL_ZAIQO],
    targetFeature: 'PlatformGuide',
    ctaLabel: 'Explore Capabilities',
    summary: 'Pantry intelligence, meal planning, and recipes',
    parameters: action.parameters,
  }),
};

/**
 * Executes or maps the action through its registered handler
 */
export function handleZaiqoAction(actionResult) {
  if (!actionResult || !actionResult.intent) {
    return null;
  }

  const handler = actionHandlers[actionResult.intent] || actionHandlers[ZAIQO_ACTIONS.GENERAL_ZAIQO];
  return handler(actionResult);
}

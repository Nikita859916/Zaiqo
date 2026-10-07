/**
 * Centralized Zai Action Contract
 * Defines supported action types and structure for the Zai orchestration layer.
 */

export const ZAI_ACTIONS = Object.freeze({
  RECIPE_GENERATION: 'RECIPE_GENERATION',
  MEAL_PLANNING: 'MEAL_PLANNING',
  GROCERY_LIST: 'GROCERY_LIST',
  DIETARY_PREFERENCE: 'DIETARY_PREFERENCE',
  RECIPE_SEARCH: 'RECIPE_SEARCH',
  FOOD_ANALYSIS: 'FOOD_ANALYSIS',
  FOOD_DIARY: 'FOOD_DIARY',
  GENERAL_ZAIQO: 'GENERAL_ZAIQO',
});

export const SUPPORTED_ACTIONS = Object.freeze(Object.values(ZAI_ACTIONS));

/**
 * Validate whether a given string is a supported Zai action
 * @param {string} action
 * @returns {boolean}
 */
export const isValidZaiAction = (action) => {
  return typeof action === 'string' && SUPPORTED_ACTIONS.includes(action);
};

/**
 * Creates a standardized internal action contract payload
 * @param {string} action - One of SUPPORTED_ACTIONS
 * @param {Object} [parameters={}] - Structured parameters extracted from user intent
 * @param {string} [message=''] - Original or resolved user message
 * @returns {{ action: string, parameters: Object, message: string }}
 */
export const createActionContract = (action, parameters = {}, message = '') => {
  if (!isValidZaiAction(action)) {
    throw new Error(`Unsupported Zai action type: "${action}"`);
  }

  return {
    action,
    parameters: parameters && typeof parameters === 'object' ? parameters : {},
    message: typeof message === 'string' ? message : String(message || ''),
  };
};

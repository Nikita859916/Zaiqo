/**
 * Zaiqo Action Resolver (Temporary / Simulation Layer)
 * 
 * Simulates structured intent classification and parameter extraction
 * that will subsequently be produced directly by Gemini API structured JSON.
 * 
 * Target Schema:
 * {
 *   intent: "RECIPE_GENERATION" | "MEAL_PLANNING" | "GROCERY_LIST" | "DIETARY_PREFERENCE" | "RECIPE_SEARCH" | "GENERAL_ZAIQO",
 *   message: string,
 *   parameters: {
 *     dietaryPreference: string | null,
 *     ingredients: string[],
 *     mealType: string | null,
 *     cookingTime: string | null,
 *     durationDays: number | string | null,
 *     query: string | null
 *   }
 * }
 */

import { ZAIQO_ACTIONS } from './actionTypes.js';

export function resolveActionFromMessage(userMessage) {
  const text = (userMessage || '').trim();
  const lower = text.toLowerCase();

  // 1. Check for Dietary Preferences
  if (
    lower.includes('vegetarian') ||
    lower.includes('vegan') ||
    lower.includes('dairy') ||
    lower.includes('gluten') ||
    lower.includes('keto') ||
    lower.includes('allergy') ||
    lower.includes('allergic') ||
    lower.includes("don't eat")
  ) {
    let preference = 'custom';
    if (lower.includes('vegetarian')) preference = 'vegetarian';
    else if (lower.includes('vegan')) preference = 'vegan';
    else if (lower.includes('dairy')) preference = 'dairy-free';
    else if (lower.includes('gluten')) preference = 'gluten-free';

    return {
      intent: ZAIQO_ACTIONS.DIETARY_PREFERENCE,
      message: `I have noted your preference for ${preference} nourishment. All upcoming recipes and meal plans will respect this criteria.`,
      parameters: {
        dietaryPreference: preference,
        ingredients: [],
        mealType: null,
        cookingTime: null,
        durationDays: null,
        query: null,
      },
    };
  }

  // 2. Check for Meal Planning
  if (
    lower.includes('meal plan') ||
    lower.includes('plan my meal') ||
    lower.includes('plan meals') ||
    lower.includes('weekly plan') ||
    lower.includes('days') ||
    lower.includes('calendar')
  ) {
    let days = 7;
    if (lower.includes('five') || lower.includes('5')) days = 5;
    else if (lower.includes('three') || lower.includes('3')) days = 3;
    else if (lower.includes('seven') || lower.includes('7') || lower.includes('weekly')) days = 7;

    return {
      intent: ZAIQO_ACTIONS.MEAL_PLANNING,
      message: `I can structure an adaptive ${days}-day meal plan tailored to your nutritional targets and schedule.`,
      parameters: {
        dietaryPreference: null,
        ingredients: [],
        mealType: null,
        cookingTime: null,
        durationDays: days,
        query: null,
      },
    };
  }

  // 3. Check for Grocery List
  if (
    lower.includes('grocery') ||
    lower.includes('groceries') ||
    lower.includes('shopping list') ||
    lower.includes('buy')
  ) {
    return {
      intent: ZAIQO_ACTIONS.GROCERY_LIST,
      message: "I can generate an organized grocery list categorized by supermarket aisles to save you time.",
      parameters: {
        dietaryPreference: null,
        ingredients: [],
        mealType: null,
        cookingTime: null,
        durationDays: null,
        query: null,
      },
    };
  }

  // 4. Check for Recipe Search (searching existing database / catalog)
  if (
    lower.startsWith('show me') ||
    lower.startsWith('find') ||
    lower.startsWith('search') ||
    lower.includes('quick breakfast') ||
    lower.includes('find recipe')
  ) {
    const mealType = lower.includes('breakfast')
      ? 'breakfast'
      : lower.includes('dinner')
      ? 'dinner'
      : lower.includes('lunch')
      ? 'lunch'
      : null;

    const cookingTime = lower.includes('quick') ? 'under 20 mins' : null;

    return {
      intent: ZAIQO_ACTIONS.RECIPE_SEARCH,
      message: `Searching our dietitian-verified catalog for ${mealType ? `${mealType} ` : ''}recipes matched to your criteria.`,
      parameters: {
        dietaryPreference: null,
        ingredients: [],
        mealType,
        cookingTime,
        durationDays: null,
        query: text,
      },
    };
  }

  // 5. Check for Recipe Generation (from ingredients or meal requests)
  if (
    lower.includes('paneer') ||
    lower.includes('spinach') ||
    lower.includes('dinner') ||
    lower.includes('lunch') ||
    lower.includes('breakfast') ||
    lower.includes('cook') ||
    lower.includes('recipe') ||
    lower.includes('ingredient') ||
    lower.includes('pantry') ||
    lower.includes('leftover') ||
    lower.includes('healthy dinner')
  ) {
    const extractedIngredients = [];
    if (lower.includes('paneer')) extractedIngredients.push('paneer');
    if (lower.includes('spinach')) extractedIngredients.push('spinach');
    if (lower.includes('chickpea')) extractedIngredients.push('chickpeas');
    if (lower.includes('avocado')) extractedIngredients.push('avocado');
    if (lower.includes('salmon')) extractedIngredients.push('salmon');

    const mealType = lower.includes('breakfast')
      ? 'Breakfast'
      : lower.includes('dinner')
      ? 'Dinner'
      : lower.includes('lunch')
      ? 'Lunch'
      : lower.includes('snack')
      ? 'Snack'
      : null;

    let dietaryPref = null;
    if (lower.includes('high protein') || lower.includes('protein')) dietaryPref = 'High Protein';
    else if (lower.includes('low carb') || lower.includes('keto')) dietaryPref = 'Low Carb';
    else if (lower.includes('vegetarian')) dietaryPref = 'Vegetarian';
    else if (lower.includes('vegan')) dietaryPref = 'Vegan';
    else if (lower.includes('gluten free') || lower.includes('gluten-free')) dietaryPref = 'Gluten Free';

    const ingredientsDesc =
      extractedIngredients.length > 0
        ? ` using ${extractedIngredients.join(' and ')}`
        : '';

    return {
      intent: ZAIQO_ACTIONS.RECIPE_GENERATION,
      message: `I can create a delicious, balanced ${mealType || 'recipe'}${ingredientsDesc} calibrated for your wellness goals.`,
      parameters: {
        dietaryPreference: dietaryPref,
        ingredients: extractedIngredients,
        mealType,
        cookingTime: lower.includes('quick') ? '15 mins' : lower.includes('25') ? '25 mins' : null,
        durationDays: null,
        query: null,
      },
    };
  }

  // 6. Default / General Zaiqo Guidance
  return {
    intent: ZAIQO_ACTIONS.GENERAL_ZAIQO,
    message: "Zaiqo is your intelligent food and wellness companion. I can generate personalized recipes from your pantry, build adaptive meal plans, curate grocery lists, and calibrate your daily nutrition.",
    parameters: {
      dietaryPreference: null,
      ingredients: [],
      mealType: null,
      cookingTime: null,
      durationDays: null,
      query: null,
    },
  };
}

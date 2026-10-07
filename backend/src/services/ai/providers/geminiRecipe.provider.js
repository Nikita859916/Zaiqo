import { BaseAiRecipeProvider } from '../aiProvider.interface.js';
import geminiService from '../../gemini.service.js';
import { ApiError } from '../../../utils/apiError.js';

/**
 * Concrete AI Recipe Provider implementation for Google Gemini.
 * Bridges the AI provider abstraction with geminiService.
 */
export class GeminiRecipeProvider extends BaseAiRecipeProvider {
  constructor(customGeminiService = null) {
    super('gemini', 'Google Gemini');
    this.geminiService = customGeminiService || geminiService;
  }

  /**
   * Check whether Gemini is configured with a valid API key or mock client
   * @returns {boolean}
   */
  isConfigured() {
    return this.geminiService.isConfigured();
  }

  /**
   * Generate structured recipe from validated request parameters
   * @param {Object} sanitizedRequest
   * @param {Object} [context={}]
   * @returns {Promise<Object>}
   */
  async generateRecipe(sanitizedRequest, context = {}) {
    if (!this.isConfigured()) {
      throw new ApiError(503, 'AI recipe generation is not configured');
    }

    // Assemble safe structured context for Gemini
    const recipeContext = {
      mealType: sanitizedRequest.mealType || 'dinner',
      cuisine: sanitizedRequest.cuisine || null,
      cookingTime: sanitizedRequest.maxPrepTimeMinutes || null,
      servings: sanitizedRequest.servings || 2,
      requestedIngredients: sanitizedRequest.preferredIngredients || [],
      constraints: {
        dietaryPreference: sanitizedRequest.dietaryConstraints?.[0] || 'no-preference',
        allergies: sanitizedRequest.excludedIngredients || [],
        foodsToAvoid: sanitizedRequest.excludedIngredients || [],
      },
      healthGoal: sanitizedRequest.healthGoal || null,
      userPreferences: context.userPreferences || {},
      nutritionContext: context.nutritionContext || {},
      recentMeals: context.recentMeals || [],
    };

    const rawOutput = await this.geminiService.generateRecipe(recipeContext);

    if (!rawOutput || typeof rawOutput !== 'object') {
      throw new ApiError(502, 'AI provider returned an invalid recipe payload.');
    }

    // Normalize output into standardized provider contract
    const title = String(rawOutput.name || rawOutput.title || '').trim();
    const description = typeof rawOutput.description === 'string' ? rawOutput.description.trim() : '';
    const servings = Number(rawOutput.servings) || sanitizedRequest.servings || 2;
    const prepTimeMinutes =
      Number(rawOutput.prepTime !== undefined ? rawOutput.prepTime : rawOutput.prepTimeMinutes) || 10;
    const cookTimeMinutes =
      Number(rawOutput.cookTime !== undefined ? rawOutput.cookTime : rawOutput.cookTimeMinutes) || 20;

    const dietaryTags = Array.isArray(rawOutput.dietaryTags)
      ? rawOutput.dietaryTags.map((t) => String(t).trim().toLowerCase()).filter(Boolean)
      : [];

    const ingredients = Array.isArray(rawOutput.ingredients)
      ? rawOutput.ingredients.map((ing) => ({
          name: String(ing.name || ing.item || '').trim(),
          quantity: Number(ing.quantity) > 0 ? Number(ing.quantity) : 1,
          unit: typeof ing.unit === 'string' ? ing.unit.trim() : '',
          category: typeof ing.category === 'string' ? ing.category.trim().toLowerCase() : 'other',
        }))
      : [];

    const steps = Array.isArray(rawOutput.instructions)
      ? rawOutput.instructions.map((s) => (typeof s === 'string' ? s.trim() : String(s?.text || '').trim())).filter(Boolean)
      : Array.isArray(rawOutput.steps)
      ? rawOutput.steps.map((s) => (typeof s === 'string' ? s.trim() : String(s?.text || '').trim())).filter(Boolean)
      : [];

    return {
      title,
      description,
      servings,
      prepTimeMinutes,
      cookTimeMinutes,
      dietaryTags,
      ingredients,
      steps,
      nutrition: rawOutput.nutrition || null,
      provider: {
        name: this.name,
        displayName: this.displayName,
      },
    };
  }
}

const geminiRecipeProvider = new GeminiRecipeProvider();
export default geminiRecipeProvider;

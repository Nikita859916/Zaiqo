import { GoogleGenAI } from '@google/genai';
import { ApiError } from '../utils/apiError.js';
import { SUPPORTED_ACTIONS } from '../utils/zaiActionContract.js';

/**
 * Sanitizes user preference object to ensure no sensitive fields or internal database IDs
 * are passed to external AI services.
 * @param {Object|null} rawPreferences
 * @returns {Object}
 */
const VALID_BUDGET_TIERS_SET = new Set(['budget-friendly', 'balanced', 'premium', 'no-preference']);
const VALID_MARKETPLACES_SET = new Set(['instamart', 'blinkit', 'zepto', 'jiomart', 'any']);

/**
 * Sanitizes user preference object to ensure no sensitive fields or internal database IDs
 * are passed to external AI services.
 * @param {Object|null} rawPreferences
 * @returns {Object}
 */
export const sanitizeUserContext = (rawPreferences) => {
  if (!rawPreferences || typeof rawPreferences !== 'object') {
    return {
      dietaryPreference: 'no-preference',
      wellnessGoals: ['general-wellness'],
      allergies: [],
      foodsToAvoid: [],
      preferredCuisines: [],
      cookingTime: 'no-preference',
      spiceLevel: 'medium',
      dailyNutritionTargets: null,
      householdSize: 1,
      defaultServings: 2,
      budgetTier: 'balanced',
      preferredMarketplace: 'any',
    };
  }

  // 1. Dietary preference
  const dietaryPreference =
    typeof rawPreferences.dietaryPreference === 'string'
      ? rawPreferences.dietaryPreference
      : 'no-preference';

  // 2. Wellness goals
  const wellnessGoals = Array.isArray(rawPreferences.wellnessGoals)
    ? rawPreferences.wellnessGoals.filter((g) => typeof g === 'string')
    : ['general-wellness'];

  // 3. Allergies
  const allergies = Array.isArray(rawPreferences.allergies)
    ? rawPreferences.allergies.filter((a) => typeof a === 'string')
    : [];

  // 4. Foods to avoid
  const foodsToAvoid = Array.isArray(rawPreferences.foodsToAvoid)
    ? rawPreferences.foodsToAvoid.filter((f) => typeof f === 'string')
    : [];

  // 5. Preferred cuisines
  const preferredCuisines = Array.isArray(rawPreferences.preferredCuisines)
    ? rawPreferences.preferredCuisines.filter((c) => typeof c === 'string')
    : [];

  // 6. Cooking time
  const cookingTime =
    typeof rawPreferences.cookingTime === 'string'
      ? rawPreferences.cookingTime
      : 'no-preference';

  // 7. Spice level
  const spiceLevel =
    typeof rawPreferences.spiceLevel === 'string'
      ? rawPreferences.spiceLevel
      : 'medium';

  // 8. Daily nutrition targets (numeric target bounds, strictly stripped of IDs/internals)
  let dailyNutritionTargets = null;
  const rawTargets = rawPreferences.dailyNutritionTargets;
  if (rawTargets && typeof rawTargets === 'object' && !Array.isArray(rawTargets)) {
    const cleanTargets = {};
    let hasTarget = false;
    for (const key of ['calories', 'proteinGrams', 'carbsGrams', 'fatsGrams']) {
      if (typeof rawTargets[key] === 'number' && Number.isFinite(rawTargets[key]) && rawTargets[key] >= 0) {
        cleanTargets[key] = Math.round(rawTargets[key]);
        hasTarget = true;
      } else {
        cleanTargets[key] = null;
      }
    }
    dailyNutritionTargets = hasTarget ? cleanTargets : null;
  }

  // 9. Household size (1 to 20, integer, default 1)
  let householdSize = 1;
  if (
    typeof rawPreferences.householdSize === 'number' &&
    Number.isFinite(rawPreferences.householdSize) &&
    Number.isInteger(rawPreferences.householdSize) &&
    rawPreferences.householdSize >= 1 &&
    rawPreferences.householdSize <= 20
  ) {
    householdSize = rawPreferences.householdSize;
  }

  // 10. Default servings (1 to 20, integer, default 2)
  let defaultServings = 2;
  if (
    typeof rawPreferences.defaultServings === 'number' &&
    Number.isFinite(rawPreferences.defaultServings) &&
    Number.isInteger(rawPreferences.defaultServings) &&
    rawPreferences.defaultServings >= 1 &&
    rawPreferences.defaultServings <= 20
  ) {
    defaultServings = rawPreferences.defaultServings;
  }

  // 11. Budget tier (enum, default 'balanced')
  let budgetTier = 'balanced';
  if (typeof rawPreferences.budgetTier === 'string') {
    const normalizedBt = rawPreferences.budgetTier.trim().toLowerCase();
    if (VALID_BUDGET_TIERS_SET.has(normalizedBt)) {
      budgetTier = normalizedBt;
    }
  }

  // 12. Preferred marketplace (enum, default 'any')
  let preferredMarketplace = 'any';
  if (typeof rawPreferences.preferredMarketplace === 'string') {
    const normalizedPm = rawPreferences.preferredMarketplace.trim().toLowerCase();
    if (VALID_MARKETPLACES_SET.has(normalizedPm)) {
      preferredMarketplace = normalizedPm;
    }
  }

  return {
    dietaryPreference,
    wellnessGoals,
    allergies,
    foodsToAvoid,
    preferredCuisines,
    cookingTime,
    spiceLevel,
    dailyNutritionTargets,
    householdSize,
    defaultServings,
    budgetTier,
    preferredMarketplace,
  };
};

const SENSITIVE_CONVERSATION_KEYS = new Set([
  '_id',
  'id',
  'user',
  'userId',
  'password',
  'token',
  'jwt',
  'apiKey',
  'secret',
  'email',
]);

/**
 * Sanitizes parameters within conversation turns to ensure no sensitive internal data
 * or database identifiers are forwarded to the AI provider.
 * @param {Object} params
 * @returns {Object}
 */
const sanitizeTurnParameters = (params) => {
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    return {};
  }
  const clean = {};
  for (const [key, val] of Object.entries(params)) {
    if (!SENSITIVE_CONVERSATION_KEYS.has(key) && !key.startsWith('__')) {
      clean[key] = val;
    }
  }
  return clean;
};

/**
 * Sanitizes conversation history turns to ensure only safe dialogue context
 * is passed to Gemini. Strictly bounded to the latest 6 messages.
 * @param {Array<Object>|null} history
 * @returns {Array<{ role: string, content: string, action: string|null, parameters: Object }>}
 */
export const sanitizeConversationHistory = (history) => {
  if (!Array.isArray(history)) return [];

  return history
    .slice(-6)
    .filter((turn) => turn && typeof turn === 'object')
    .map((turn) => ({
      role: turn.role === 'assistant' ? 'assistant' : 'user',
      content: typeof turn.content === 'string' ? turn.content.trim() : '',
      action: typeof turn.action === 'string' ? turn.action : null,
      parameters: sanitizeTurnParameters(turn.parameters),
    }));
};

const ZAI_SYSTEM_INSTRUCTION = `You are Zai, an intelligent, empathetic culinary and wellness AI companion inside Zaiqo.
Your mission is to understand user requests regarding recipes, meal planning, groceries, dietary preferences, and food analysis.

STRICT DOMAIN & SAFETY RULES:
1. You are a cooking and culinary wellness guide, NOT a medical doctor or clinical nutritionist.
2. NEVER provide medical diagnosis, clinical treatment advice, or claim medical certainty.
3. Use estimated and approximate language for nutritional guidance. Never invent medical measurements.
4. User allergies and foods to avoid MUST be treated as strict constraints. Never recommend foods with declared allergens.
5. You DO NOT have direct access to MongoDB, SQL, files, execution environments, or internal APIs.
6. You only interpret the user's intent and return a structured JSON action plan.
7. MULTI-TURN CONTEXT: When conversation history is provided, use it to understand follow-up requests, reference prior ingredients, meal types, or preferences from previous turns (e.g. if the user previously asked for a recipe with paneer and spinach and now says "make it spicier", retain the prior ingredients and adjust the spice level).

SUPPORTED ACTIONS:
- RECIPE_GENERATION: Suggesting, composing, or generating recipes from available ingredients or meal types. For compound requests asking to also make a grocery list and/or compare prices, set generateRecipe: true, includeGroceries: true, and/or includePricing: true.
- MEAL_PLANNING: Multi-day meal plans (extract duration as number of days).
- GROCERY_LIST: Viewing or managing grocery shopping lists.
- DIETARY_PREFERENCE: Explicit preference updates or questions (extract dietaryPreference).
- RECIPE_SEARCH: Searching recipes by cuisine, ingredients, cook time, or keywords.
- FOOD_ANALYSIS: Analyzing food images (photo is required; note that photos must be uploaded).
- FOOD_DIARY: Inquiries about consumed foods, today's meals, calorie totals, protein intake, daily diary summary, or logging foods to diary (extract queryType: 'daily_summary' | 'calories' | 'protein' | 'meals' | 'log_recent_scan' | 'log_meal', mealType, foodName, confirmLog). Read-only questions MUST NEVER create diary entries. Explicit user confirmation or request is required to log a meal.
- GENERAL_ZAIQO: General questions, greetings, or questions about how Zaiqo works.

You must respond with ONLY a valid JSON object matching this schema:
{
  "action": "<one of: ${SUPPORTED_ACTIONS.join(', ')}>",
  "parameters": {
    "ingredients": ["string"],
    "mealType": "string or null",
    "cookingTime": number or null,
    "cuisine": "string or null",
    "healthGoal": "string or null",
    "duration": number or null,
    "dietaryPreference": "string or null",
    "dietaryConstraints": ["string"],
    "servings": number or null,
    "householdSize": number or null,
    "budgetTier": "string or null",
    "preferredMarketplace": "string or null",
    "generateRecipe": boolean or null,
    "includeGroceries": boolean or null,
    "includePricing": boolean or null,
    "search": "string or null",
    "photoRequired": boolean or null,
    "queryType": "string or null",
    "foodName": "string or null",
    "confirmLog": boolean or null
  },
  "response": "<clear, helpful, friendly explanation in natural language without emojis>"
}`;

export const RECIPE_GENERATION_SYSTEM_INSTRUCTION = `You are an expert culinary chef and nutrition-aware recipe developer for Zaiqo.
Your mission is to generate a personalized, safe, delicious recipe tailored strictly to the user's culinary preferences and nutritional context.

STRICT DOMAIN & SAFETY RULES:
1. ALLERGEN HARD EXCLUSION: NEVER include any ingredient matching the user's declared allergies or derivatives.
2. FOODS TO AVOID: Do not include ingredients the user explicitly avoids.
3. DIETARY CONSTRAINTS: Strictly adhere to dietary preferences (vegetarian: no meat/poultry/fish/gelatin; vegan: no meat/fish/dairy/eggs/honey).
4. RECENT MEAL AWARENESS: Do not repeat or duplicate dishes recently consumed by the user.
5. NUTRITION GUIDANCE: Nutritional values (calories, protein, carbohydrates, fats) are single-serving culinary estimates.
   - You are NOT a medical doctor or clinical nutritionist.
   - Do NOT make medical diagnoses or clinical claims.
   - If remaining calories/protein/carbs/fats are specified, formulate the recipe portion and ingredients to approximately balance the remaining target.
6. NO SECRETS OR DATABASE OPERATIONS: You do not have database access or execution rights.
7. Return ONLY a valid JSON object matching the required schema.

Required JSON Schema:
{
  "name": "string (Recipe Title, 2-120 chars)",
  "description": "string (Brief appetizing summary, max 500 chars)",
  "mealType": "breakfast" | "lunch" | "dinner" | "snack",
  "cuisine": "string",
  "difficulty": "easy" | "medium" | "hard",
  "servings": number (integer >= 1),
  "prepTime": number (minutes >= 0),
  "cookTime": number (minutes >= 0),
  "ingredients": [
    {
      "name": "string",
      "quantity": number,
      "unit": "string",
      "category": "produce" | "dairy" | "meat" | "bakery" | "pantry" | "canned" | "beverages" | "frozen" | "other"
    }
  ],
  "instructions": ["string (step 1)", "string (step 2)"],
  "nutrition": {
    "calories": number (estimated kcal per serving),
    "protein": number (grams per serving),
    "carbohydrates": number (grams per serving),
    "fats": number (grams per serving)
  },
  "dietaryTags": ["string"]
}`;

/**
 * Service to manage communication with Google Gemini AI.
 * The ONLY service layer allowed to interface with the Gemini SDK.
 */
class GeminiService {
  constructor() {
    this.mockClient = null;
    this.defaultModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    this.timeoutMs = 15000;
  }

  /**
   * Check whether a valid GEMINI_API_KEY is configured
   * @returns {boolean}
   */
  isConfigured() {
    if (this.mockClient) return true;
    const key = process.env.GEMINI_API_KEY;
    return Boolean(key && key.trim().length > 0 && key !== 'your_gemini_api_key_here');
  }

  /**
   * Set a mock Gemini client for deterministic testing
   * @param {Object|null} client
   */
  setMockClient(client) {
    this.mockClient = client;
  }

  /**
   * Get an initialized Gemini client instance
   * @returns {GoogleGenAI}
   */
  getClient() {
    if (this.mockClient) {
      return this.mockClient;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      throw new ApiError(503, 'Gemini API key is not configured.');
    }

    return new GoogleGenAI({ apiKey });
  }

  /**
   * Understand and structure a user message using Gemini
   * @param {string} message - User message
   * @param {Object} [userContext] - Sanitized user preference context
   * @param {Array<Object>} [conversationHistory] - Sanitized bounded conversation history
   * @returns {Promise<{ action: string, parameters: Object, response?: string }>}
   */
  async understandZaiMessage(message, userContext = null, conversationHistory = []) {
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new ApiError(400, 'User message is required.');
    }

    const client = this.getClient();
    const sanitizedContext = sanitizeUserContext(userContext);
    const sanitizedHistory = sanitizeConversationHistory(conversationHistory);

    const userPrompt = JSON.stringify({
      userMessage: message.trim(),
      userPreferences: sanitizedContext,
      conversationHistory: sanitizedHistory,
    });

    let rawText = null;

    try {
      // Execute with bounded timeout
      const generatePromise = client.models.generateContent({
        model: this.defaultModel,
        contents: userPrompt,
        config: {
          systemInstruction: ZAI_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new ApiError(504, 'Gemini request timed out.')), this.timeoutMs)
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);

      if (response && response.text) {
        rawText = typeof response.text === 'function' ? response.text() : response.text;
      } else if (response && response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
        rawText = response.candidates[0].content.parts[0].text;
      }
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(502, `Gemini service error: ${err.message || 'Failed to communicate with AI provider'}`);
    }

    if (!rawText || typeof rawText !== 'string') {
      throw new ApiError(502, 'Gemini returned an empty response.');
    }

    // Parse structured JSON safely
    try {
      const parsed = JSON.parse(rawText.trim());
      return parsed;
    } catch {
      throw new ApiError(502, 'Gemini response was not valid JSON.');
    }
  }

  /**
   * Generate a structured personalized recipe using Gemini
   * @param {Object} recipeContext - Sanitized context for recipe generation
   * @returns {Promise<Object>} - Parsed JSON object of the recipe
   */
  async generateRecipe(recipeContext) {
    if (!recipeContext || typeof recipeContext !== 'object') {
      throw new ApiError(400, 'Recipe generation context is required.');
    }

    const client = this.getClient();

    const sanitizedPrompt = JSON.stringify({
      userPreferences: recipeContext.userPreferences || {},
      nutritionContext: recipeContext.nutritionContext || {},
      mealType: recipeContext.mealType || 'dinner',
      servings: recipeContext.servings || 2,
      householdSize: recipeContext.householdSize || 1,
      defaultServings: recipeContext.defaultServings || 2,
      budgetTier: recipeContext.budgetTier || 'balanced',
      preferredMarketplace: recipeContext.preferredMarketplace || 'any',
      recentMeals: recipeContext.recentMeals || [],
      requestedIngredients: recipeContext.requestedIngredients || [],
      constraints: recipeContext.constraints || {},
      targetGoal: recipeContext.healthGoal || null,
      cookingTimeMinutes: recipeContext.cookingTime || null,
      cuisine: recipeContext.cuisine || null,
    });

    let rawText = null;

    try {
      const generatePromise = client.models.generateContent({
        model: this.defaultModel,
        contents: sanitizedPrompt,
        config: {
          systemInstruction: RECIPE_GENERATION_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new ApiError(504, 'Gemini recipe generation timed out.')), this.timeoutMs)
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);

      if (response && response.text) {
        rawText = typeof response.text === 'function' ? response.text() : response.text;
      } else if (response && response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
        rawText = response.candidates[0].content.parts[0].text;
      }
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(502, `Gemini service error: ${err.message || 'Failed to communicate with AI provider'}`);
    }

    if (!rawText || typeof rawText !== 'string') {
      throw new ApiError(502, 'Gemini returned an empty recipe response.');
    }

    try {
      return JSON.parse(rawText.trim());
    } catch {
      throw new ApiError(502, 'Gemini recipe response was not valid JSON.');
    }
  }
}

const geminiService = new GeminiService();
export default geminiService;

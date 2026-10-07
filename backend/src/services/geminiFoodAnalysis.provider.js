import { BaseFoodAnalysisProvider } from './baseFoodAnalysis.provider.js';
import geminiService from './gemini.service.js';
import { validateFoodIntelligence } from '../utils/foodAnalysisValidation.js';
import { ApiError } from '../utils/apiError.js';

const FOOD_VISION_SYSTEM_INSTRUCTION = `You are Zai's visual food intelligence engine inside Zaiqo.
Your mission is to inspect food photos and return structured culinary and nutritional analysis.

CRITICAL INSTRUCTIONS:
1. NON-FOOD CHECK: First determine if the image actually contains edible food, ingredients, or meals.
   If the image is NOT food (e.g. a person, pet, car, document, landscape), set "isFood": false, "dish": null, "detectedFoods": [], "ingredients": [], "nutrition": null, and explain in warnings and mealAnalysis.
2. DISH & COMPONENT DETECTION: Identify the overarching dish and separate components on the plate (e.g. rice, curry, salad).
3. INGREDIENTS: Extract identifiable constituent ingredients (vegetables, proteins, grains, spices).
4. PORTIONS: Estimate visual portion size and approximate weight in grams based on standard dishware scale.
5. NUTRITION ESTIMATES: Provide estimated calories and macronutrients (protein, carbs, fats) for the detected portion.
   Always mark "isEstimated": true.
6. VISUAL UNCERTAINTY & CONFIDENCE:
   - If sauce, batter, or depth obscures ingredients or portions, lower the confidence score (0 to 1) and add explicit warnings.
   - If overall confidence is below 0.6, set "isReliable": false.
7. SAFETY & MEDICAL BOUNDARIES:
   - Nutritional values are approximate visual estimates, NOT clinical or laboratory measurements.
   - NEVER provide medical diagnosis, clinical treatment advice, or insulin dosing guidance.

You must respond with ONLY a valid JSON object matching this schema:
{
  "isFood": boolean,
  "dish": {
    "name": "string or null",
    "mealType": "breakfast" | "lunch" | "dinner" | "snack" | null,
    "cuisine": "string or null",
    "isPlantBased": boolean or null
  },
  "detectedFoods": [
    {
      "name": "string",
      "category": "string",
      "estimatedQuantity": number,
      "unit": "string",
      "confidence": number
    }
  ],
  "ingredients": ["string"],
  "portion": {
    "servingSize": "string or null",
    "estimatedWeightGrams": number or null,
    "visualScale": "string or null"
  },
  "nutrition": {
    "calories": number or null,
    "protein": number or null,
    "carbohydrates": number or null,
    "fats": number or null,
    "isEstimated": true
  },
  "mealAnalysis": {
    "summary": "string",
    "observations": ["string"],
    "suggestions": ["string"]
  },
  "confidence": {
    "overall": number,
    "level": "none" | "low" | "medium" | "high",
    "isReliable": boolean
  },
  "warnings": ["string"],
  "uncertaintyNotes": "string"
}`;

/**
 * Gemini-powered Multimodal Food Photo Analysis Provider.
 * Implements BaseFoodAnalysisProvider contract using @google/genai.
 * Does not access database or user session directly.
 */
export class GeminiFoodAnalysisProvider extends BaseFoodAnalysisProvider {
  constructor() {
    super();
    this.model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    this.timeoutMs = 20000;
    this.mockClient = null;
  }

  /**
   * Set a mock Gemini client for deterministic testing
   * @param {Object|null} client
   */
  setMockClient(client) {
    this.mockClient = client;
  }

  /**
   * Get an active Gemini client instance
   * @returns {Object}
   */
  getClient() {
    if (this.mockClient) {
      return this.mockClient;
    }
    return geminiService.getClient();
  }

  /**
   * Analyze food photo buffer using Gemini multimodal vision API
   * @param {Buffer} buffer - Image file buffer
   * @param {string} mimeType - e.g. 'image/jpeg', 'image/png', 'image/webp'
   * @returns {Promise<Object>} Normalized food intelligence analysis
   */
  async analyze(buffer, mimeType) {
    if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
      throw new ApiError(400, 'Image buffer is required for analysis.');
    }

    if (!mimeType || typeof mimeType !== 'string') {
      throw new ApiError(400, 'Image MIME type is required.');
    }

    const client = this.getClient();
    const base64Image = buffer.toString('base64');

    const promptText = 'Analyze this food photo. Provide complete dish detection, ingredient extraction, portion estimation, approximate nutrition, and visual uncertainty notes.';

    let rawText = null;

    try {
      const generatePromise = client.models.generateContent({
        model: this.model,
        contents: [
          {
            inlineData: {
              data: base64Image,
              mimeType,
            },
          },
          promptText,
        ],
        config: {
          systemInstruction: FOOD_VISION_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new ApiError(504, 'Food photo analysis timed out.')),
          this.timeoutMs
        )
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);

      if (response && response.text) {
        rawText = typeof response.text === 'function' ? response.text() : response.text;
      } else if (
        response &&
        response.candidates &&
        response.candidates[0]?.content?.parts?.[0]?.text
      ) {
        rawText = response.candidates[0].content.parts[0].text;
      }
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(
        502,
        `Gemini vision service error: ${err.message || 'Failed to communicate with AI provider'}`
      );
    }

    if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
      throw new ApiError(502, 'Vision provider returned an empty response.');
    }

    let parsed = null;
    try {
      parsed = JSON.parse(rawText.trim());
    } catch {
      throw new ApiError(502, 'Vision provider response was not valid JSON.');
    }

    // Validate and normalize through strict domain layer
    const validation = validateFoodIntelligence(parsed);
    if (!validation.isValid) {
      throw new ApiError(502, `Invalid food intelligence data: ${validation.error}`);
    }

    return {
      ...validation.sanitized,
      provider: {
        name: 'GeminiVision',
        model: this.model,
      },
    };
  }
}

export default GeminiFoodAnalysisProvider;

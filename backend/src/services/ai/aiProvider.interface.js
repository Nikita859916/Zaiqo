const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Base AI Recipe Provider interface.
 * All concrete AI providers (Gemini, Anthropic, OpenAI, etc.) must implement this contract.
 */
export class BaseAiRecipeProvider {
  /**
   * @param {string} name - Machine identifier (e.g. 'gemini')
   * @param {string} displayName - Human-readable name (e.g. 'Google Gemini')
   */
  constructor(name, displayName) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('AI Provider requires a valid name.');
    }
    if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0) {
      throw new Error('AI Provider requires a valid displayName.');
    }

    const cleanName = name.trim().toLowerCase();
    if (FORBIDDEN_KEYS.has(cleanName)) {
      throw new Error(`Forbidden provider name "${cleanName}".`);
    }

    this.name = cleanName;
    this.displayName = displayName.trim();
  }

  /**
   * Check if provider credentials/client are configured
   * @returns {boolean}
   */
  isConfigured() {
    return false;
  }

  /**
   * Generate structured recipe from validated request
   * @param {Object} sanitizedRequest - Validated recipe request contract
   * @param {Object} [context={}] - Optional culinary and user context
   * @returns {Promise<{
   *   title: string,
   *   description: string,
   *   servings: number,
   *   prepTimeMinutes: number,
   *   cookTimeMinutes: number,
   *   dietaryTags: Array<string>,
   *   ingredients: Array<{ name: string, quantity: number, unit: string }>,
   *   steps: Array<string>
   * }>}
   */
  async generateRecipe(sanitizedRequest, context = {}) {
    throw new Error(`AI Recipe Provider "${this.name}" generateRecipe() method must be implemented.`);
  }
}

export default BaseAiRecipeProvider;

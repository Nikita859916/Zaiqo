/**
 * Base abstraction interface for Vision / Food Analysis providers.
 * All concrete providers (e.g. GeminiFoodAnalysisProvider) implement this contract.
 */
export class BaseFoodAnalysisProvider {
  /**
   * Analyze food image buffer
   * @param {Buffer} buffer - Raw image bytes
   * @param {string} mimeType - e.g. 'image/jpeg', 'image/png', 'image/webp'
   * @returns {Promise<{ detectedFoods: Array, nutrition: Object|null, mealAnalysis: Object|null, provider: Object }>}
   */
  async analyze(buffer, mimeType) {
    throw new Error('Food analysis provider analyze() method must be implemented.');
  }
}

export default BaseFoodAnalysisProvider;

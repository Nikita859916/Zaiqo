import mongoose from 'mongoose';
import FoodAnalysis from '../models/foodAnalysis.model.js';
import { badRequest, notFound, forbidden, ApiError } from '../utils/apiError.js';
import GeminiFoodAnalysisProvider from './geminiFoodAnalysis.provider.js';
import geminiService from './gemini.service.js';
import { BaseFoodAnalysisProvider } from './baseFoodAnalysis.provider.js';

export { BaseFoodAnalysisProvider };

// Global active provider slot (injected mock takes precedence)
let activeProvider = null;

export const setFoodAnalysisProvider = (provider) => {
  activeProvider = provider;
};

export const getFoodAnalysisProvider = () => {
  if (activeProvider) {
    return activeProvider;
  }
  if (geminiService.isConfigured()) {
    return new GeminiFoodAnalysisProvider();
  }
  return null;
};

/**
 * Service to manage Food Photo Analysis business logic and database records
 */
class FoodAnalysisService {
  /**
   * Analyze food photo using configured vision provider
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {Object} file - Multer uploaded file object (in-memory buffer)
   * @returns {Promise<FoodAnalysis>}
   */
  async analyzeFoodPhoto(userId, file) {
    if (!file || !file.buffer) {
      throw badRequest('Image file is required.');
    }

    const provider = getFoodAnalysisProvider();
    if (!provider) {
      throw new ApiError(503, 'Food analysis provider is not configured yet.');
    }

    const analysisResult = await provider.analyze(file.buffer, file.mimetype);

    return this.createAnalysisRecord(
      userId,
      {
        mimeType: file.mimetype,
        size: file.size,
        originalName: file.originalname,
      },
      {
        status: 'completed',
        dish: analysisResult?.dish || null,
        detectedFoods: analysisResult?.detectedFoods || [],
        ingredients: analysisResult?.ingredients || [],
        portion: analysisResult?.portion || {
          servingSize: '1 serving',
          estimatedWeightGrams: null,
          visualScale: null,
        },
        nutrition: analysisResult?.nutrition || null,
        mealAnalysis: analysisResult?.mealAnalysis || null,
        confidence: analysisResult?.confidence || {
          overall: 0,
          level: 'low',
          isReliable: false,
        },
        warnings: analysisResult?.warnings || [],
        uncertaintyNotes:
          analysisResult?.uncertaintyNotes ||
          'Portions and nutritional values are approximate visual estimates.',
        provider: analysisResult?.provider || null,
      }
    );
  }

  /**
   * Create an analysis record in the database
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {Object} imageMeta - { mimeType, size, originalName }
   * @param {Object} [data] - optional analysis payload
   * @returns {Promise<FoodAnalysis>}
   */
  async createAnalysisRecord(userId, imageMeta, data = {}) {
    if (!userId) {
      throw badRequest('User ID is required.');
    }

    if (!imageMeta || !imageMeta.mimeType || typeof imageMeta.size !== 'number') {
      throw badRequest('Valid image metadata (mimeType, size) is required.');
    }

    return FoodAnalysis.create({
      user: userId,
      status: data.status || 'pending',
      image: {
        mimeType: imageMeta.mimeType,
        size: imageMeta.size,
        originalName: imageMeta.originalName || 'uploaded-image',
      },
      dish: data.dish || null,
      detectedFoods: data.detectedFoods || [],
      ingredients: data.ingredients || [],
      portion: data.portion || {
        servingSize: '1 serving',
        estimatedWeightGrams: null,
        visualScale: null,
      },
      nutrition: data.nutrition || null,
      mealAnalysis: data.mealAnalysis || null,
      confidence: data.confidence || {
        overall: 0,
        level: 'low',
        isReliable: false,
      },
      warnings: data.warnings || [],
      uncertaintyNotes:
        data.uncertaintyNotes ||
        'Portions and nutritional values are approximate visual estimates.',
      provider: data.provider || null,
    });
  }

  /**
   * Get user's food analysis history
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {Object} [options] - query options like limit
   * @returns {Promise<Array<FoodAnalysis>>}
   */
  async getAnalysisHistory(userId, options = {}) {
    const query = { user: userId };
    let q = FoodAnalysis.find(query).sort({ createdAt: -1 });

    if (options.limit) {
      const limit = Math.min(50, Math.max(1, parseInt(options.limit, 10) || 10));
      const page = Math.max(1, parseInt(options.page, 10) || 1);
      q = q.skip((page - 1) * limit).limit(limit);
    }

    return q.exec();
  }

  /**
   * Get a single analysis record by ID with ownership verification
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string} analysisId
   * @returns {Promise<FoodAnalysis>}
   */
  async getAnalysisById(userId, analysisId) {
    if (!analysisId || !mongoose.Types.ObjectId.isValid(analysisId)) {
      throw badRequest('Invalid analysis ID format.');
    }

    const analysis = await FoodAnalysis.findById(analysisId);
    if (!analysis) {
      throw notFound('Food analysis record not found.');
    }

    if (analysis.user.toString() !== userId.toString()) {
      throw forbidden('You do not have permission to access this food analysis.');
    }

    return analysis;
  }

  /**
   * Delete an analysis record with ownership verification
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string} analysisId
   * @returns {Promise<boolean>}
   */
  async deleteAnalysis(userId, analysisId) {
    if (!analysisId || !mongoose.Types.ObjectId.isValid(analysisId)) {
      throw badRequest('Invalid analysis ID format.');
    }

    const analysis = await FoodAnalysis.findById(analysisId);
    if (!analysis) {
      throw notFound('Food analysis record not found.');
    }

    if (analysis.user.toString() !== userId.toString()) {
      throw forbidden('You do not have permission to delete this food analysis.');
    }

    await FoodAnalysis.findByIdAndDelete(analysisId);
    return true;
  }
}

const foodAnalysisService = new FoodAnalysisService();

export default foodAnalysisService;

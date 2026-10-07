import mongoose from 'mongoose';
import FoodDiary from '../models/foodDiary.model.js';
import foodAnalysisService from './foodAnalysis.service.js';
import preferenceService from './preference.service.js';
import { badRequest, notFound, forbidden } from '../utils/apiError.js';
import {
  validateDiaryEntryInput,
  validateDiaryUpdateInput,
  isValidIanaTimezone,
  getTimezoneDateRange,
} from '../utils/foodDiaryValidation.js';

/**
 * Service to manage Food Diary entries, daily aggregations, and goal comparisons.
 * Enforces authenticated user ownership on all operations.
 */
class FoodDiaryService {
  /**
   * Create a food diary entry
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {Object} payload
   * @returns {Promise<FoodDiary>}
   */
  async createEntry(userId, payload) {
    if (!userId) {
      throw badRequest('User ID is required.');
    }

    const validation = validateDiaryEntryInput(payload);
    if (!validation.isValid) {
      throw badRequest(validation.error);
    }

    return FoodDiary.create({
      ...validation.sanitized,
      user: userId,
    });
  }

  /**
   * Create a manual food diary entry
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {Object} payload
   * @returns {Promise<FoodDiary>}
   */
  async createManualEntry(userId, payload) {
    const data = {
      ...(payload || {}),
      source: 'MANUAL',
      analysisRef: null,
      recipeRef: null,
    };
    return this.createEntry(userId, data);
  }

  /**
   * Create a food diary entry from a completed FoodAnalysis
   * Verifies analysis ownership, completed state, and food detection.
   * FoodAnalysis document is NEVER modified.
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string} analysisId
   * @param {Object} [overrides={}]
   * @returns {Promise<FoodDiary>}
   */
  async createFromAnalysis(userId, analysisId, overrides = {}) {
    if (!userId) {
      throw badRequest('User ID is required.');
    }

    if (!analysisId || !mongoose.Types.ObjectId.isValid(analysisId)) {
      throw badRequest('Invalid analysis ID format.');
    }

    // Retrieve analysis with strict ownership verification
    const analysis = await foodAnalysisService.getAnalysisById(userId, analysisId);

    if (analysis.status !== 'completed') {
      throw badRequest('Food analysis has not completed yet.');
    }

    const hasDetectedFoods =
      Array.isArray(analysis.detectedFoods) && analysis.detectedFoods.length > 0;
    const hasDish = Boolean(analysis.dish && analysis.dish.name);

    if (!hasDetectedFoods && !hasDish) {
      throw badRequest('Analysis does not contain a recognized food item.');
    }

    // Resolve snapshot values with optional user overrides
    const foodName =
      overrides.foodName ||
      analysis.dish?.name ||
      analysis.detectedFoods?.[0]?.name ||
      'Scanned Meal';

    const mealType =
      overrides.mealType ||
      analysis.dish?.mealType ||
      'lunch';

    const portion = overrides.portion || analysis.portion || {
      servingSize: '1 serving',
      estimatedWeightGrams: null,
    };

    const nutrition = overrides.nutrition || (analysis.nutrition ? {
      calories: analysis.nutrition.calories || 0,
      protein: analysis.nutrition.protein || 0,
      carbohydrates: analysis.nutrition.carbohydrates || 0,
      fats: analysis.nutrition.fats || 0,
      isEstimated: true,
    } : {
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fats: 0,
      isEstimated: true,
    });

    const ingredients =
      overrides.ingredients ||
      (Array.isArray(analysis.ingredients) ? analysis.ingredients : []);

    const consumedAt = overrides.consumedAt ? new Date(overrides.consumedAt) : new Date();
    const notes = overrides.notes || '';

    const entryData = {
      foodName,
      mealType,
      portion,
      nutrition,
      ingredients,
      consumedAt,
      notes,
      source: 'FOOD_ANALYSIS',
      analysisRef: analysis._id,
      recipeRef: null,
    };

    return this.createEntry(userId, entryData);
  }

  /**
   * Get a single diary entry by ID with ownership verification
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string} entryId
   * @returns {Promise<FoodDiary>}
   */
  async getEntryById(userId, entryId) {
    if (!entryId || !mongoose.Types.ObjectId.isValid(entryId)) {
      throw badRequest('Invalid diary entry ID format.');
    }

    const entry = await FoodDiary.findOne({ _id: entryId, user: userId });
    if (!entry) {
      const exists = await FoodDiary.findById(entryId);
      if (exists) {
        throw forbidden('You do not have permission to access this food diary entry.');
      }
      throw notFound('Food diary entry not found.');
    }

    return entry;
  }

  /**
   * Get user's paginated food diary history
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {Object} [options={}]
   * @returns {Promise<Array<FoodDiary>>}
   */
  async getHistory(userId, options = {}) {
    const query = { user: userId };
    let q = FoodDiary.find(query).sort({ consumedAt: -1 });

    if (options.limit) {
      const limit = Math.min(50, Math.max(1, parseInt(options.limit, 10) || 10));
      const page = Math.max(1, parseInt(options.page, 10) || 1);
      q = q.skip((page - 1) * limit).limit(limit);
    }

    return q.exec();
  }

  /**
   * Update an existing diary entry with audit tracking
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string} entryId
   * @param {Object} updates
   * @returns {Promise<FoodDiary>}
   */
  async updateEntry(userId, entryId, updates) {
    if (!entryId || !mongoose.Types.ObjectId.isValid(entryId)) {
      throw badRequest('Invalid diary entry ID format.');
    }

    const entry = await FoodDiary.findOne({ _id: entryId, user: userId });
    if (!entry) {
      const exists = await FoodDiary.findById(entryId);
      if (exists) {
        throw forbidden('You do not have permission to update this food diary entry.');
      }
      throw notFound('Food diary entry not found.');
    }

    const validation = validateDiaryUpdateInput(updates);
    if (!validation.isValid) {
      throw badRequest(validation.error);
    }

    const sanitized = validation.sanitized;

    // Detect if nutrition or portion is being modified
    const isNutritionChange =
      sanitized.nutrition !== undefined || sanitized.portion !== undefined;

    if (isNutritionChange) {
      if (!entry.userEdits?.originalNutrition) {
        entry.userEdits.originalNutrition = {
          calories: entry.nutrition.calories || 0,
          protein: entry.nutrition.protein || 0,
          carbohydrates: entry.nutrition.carbohydrates || 0,
          fats: entry.nutrition.fats || 0,
          isEstimated: true,
        };
      }
      entry.userEdits.isEdited = true;
      entry.userEdits.editedAt = new Date();
    }

    if (sanitized.foodName !== undefined) entry.foodName = sanitized.foodName;
    if (sanitized.mealType !== undefined) entry.mealType = sanitized.mealType;
    if (sanitized.consumedAt !== undefined) entry.consumedAt = sanitized.consumedAt;
    if (sanitized.notes !== undefined) entry.notes = sanitized.notes;
    if (sanitized.ingredients !== undefined) entry.ingredients = sanitized.ingredients;

    if (sanitized.portion !== undefined) {
      entry.portion = {
        servingSize:
          sanitized.portion.servingSize !== undefined
            ? sanitized.portion.servingSize
            : entry.portion.servingSize,
        estimatedWeightGrams:
          sanitized.portion.estimatedWeightGrams !== undefined
            ? sanitized.portion.estimatedWeightGrams
            : entry.portion.estimatedWeightGrams,
      };
    }

    if (sanitized.nutrition !== undefined) {
      entry.nutrition = {
        calories:
          sanitized.nutrition.calories !== undefined
            ? sanitized.nutrition.calories
            : entry.nutrition.calories,
        protein:
          sanitized.nutrition.protein !== undefined
            ? sanitized.nutrition.protein
            : entry.nutrition.protein,
        carbohydrates:
          sanitized.nutrition.carbohydrates !== undefined
            ? sanitized.nutrition.carbohydrates
            : entry.nutrition.carbohydrates,
        fats:
          sanitized.nutrition.fats !== undefined
            ? sanitized.nutrition.fats
            : entry.nutrition.fats,
        isEstimated: true,
      };
    }

    return entry.save();
  }

  /**
   * Delete a food diary entry with ownership verification
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string} entryId
   * @returns {Promise<boolean>}
   */
  async deleteEntry(userId, entryId) {
    if (!entryId || !mongoose.Types.ObjectId.isValid(entryId)) {
      throw badRequest('Invalid diary entry ID format.');
    }

    const entry = await FoodDiary.findOne({ _id: entryId, user: userId });
    if (!entry) {
      const exists = await FoodDiary.findById(entryId);
      if (exists) {
        throw forbidden('You do not have permission to delete this food diary entry.');
      }
      throw notFound('Food diary entry not found.');
    }

    await FoodDiary.findByIdAndDelete(entryId);
    return true;
  }

  /**
   * Calculate on-demand daily nutritional aggregation and goal comparison
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {string|null} [dateString=null] - 'YYYY-MM-DD'
   * @param {string} [timezone='Asia/Kolkata'] - IANA timezone identifier
   * @returns {Promise<Object>}
   */
  async getDailySummary(userId, dateString = null, timezone = 'Asia/Kolkata') {
    if (!userId) {
      throw badRequest('User ID is required.');
    }

    const tz = timezone || 'Asia/Kolkata';
    if (!isValidIanaTimezone(tz)) {
      throw badRequest(`Invalid IANA timezone identifier: "${tz}".`);
    }

    const { startOfDay, endOfDay, formattedDate } = getTimezoneDateRange(dateString, tz);

    const entries = await FoodDiary.find({
      user: userId,
      consumedAt: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ consumedAt: 1 });

    const totals = {
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fats: 0,
    };

    const mealBreakdown = {
      breakfast: { calories: 0, protein: 0, carbohydrates: 0, fats: 0, items: [] },
      lunch: { calories: 0, protein: 0, carbohydrates: 0, fats: 0, items: [] },
      dinner: { calories: 0, protein: 0, carbohydrates: 0, fats: 0, items: [] },
      snack: { calories: 0, protein: 0, carbohydrates: 0, fats: 0, items: [] },
      other: { calories: 0, protein: 0, carbohydrates: 0, fats: 0, items: [] },
    };

    for (const entry of entries) {
      const c = entry.nutrition?.calories || 0;
      const p = entry.nutrition?.protein || 0;
      const cb = entry.nutrition?.carbohydrates || 0;
      const f = entry.nutrition?.fats || 0;

      totals.calories += c;
      totals.protein += p;
      totals.carbohydrates += cb;
      totals.fats += f;

      const mealCategory = mealBreakdown[entry.mealType] ? entry.mealType : 'other';
      mealBreakdown[mealCategory].calories += c;
      mealBreakdown[mealCategory].protein += p;
      mealBreakdown[mealCategory].carbohydrates += cb;
      mealBreakdown[mealCategory].fats += f;
      mealBreakdown[mealCategory].items.push(entry);
    }

    // Round all sums
    totals.calories = Math.round(totals.calories * 10) / 10;
    totals.protein = Math.round(totals.protein * 10) / 10;
    totals.carbohydrates = Math.round(totals.carbohydrates * 10) / 10;
    totals.fats = Math.round(totals.fats * 10) / 10;

    for (const key of Object.keys(mealBreakdown)) {
      mealBreakdown[key].calories = Math.round(mealBreakdown[key].calories * 10) / 10;
      mealBreakdown[key].protein = Math.round(mealBreakdown[key].protein * 10) / 10;
      mealBreakdown[key].carbohydrates = Math.round(mealBreakdown[key].carbohydrates * 10) / 10;
      mealBreakdown[key].fats = Math.round(mealBreakdown[key].fats * 10) / 10;
    }

    // Goal Comparison against user preferences
    let goalComparison = {
      status: 'no_targets_set',
      notice: 'Nutritional totals and targets are approximate estimates for personal tracking and not clinical or medical advice.',
    };

    const userPref = await preferenceService.getPreferencesByUserId(userId);
    const targets = userPref?.dailyNutritionTargets;

    const hasAnyTarget =
      targets &&
      (targets.calories !== null ||
        targets.proteinGrams !== null ||
        targets.carbsGrams !== null ||
        targets.fatsGrams !== null);

    if (hasAnyTarget) {
      const comparison = {
        status: 'in_progress',
        notice: 'Nutritional totals and targets are approximate estimates for personal tracking and not clinical or medical advice.',
      };

      let allTargetsMet = true;

      if (targets.calories !== null && targets.calories > 0) {
        const remaining = Math.max(0, targets.calories - totals.calories);
        const percentage = Math.round((totals.calories / targets.calories) * 1000) / 10;
        comparison.calories = {
          actual: totals.calories,
          target: targets.calories,
          remaining,
          percentage,
        };
        if (totals.calories < targets.calories) allTargetsMet = false;
      }

      if (targets.proteinGrams !== null && targets.proteinGrams > 0) {
        const remaining = Math.max(0, targets.proteinGrams - totals.protein);
        const percentage = Math.round((totals.protein / targets.proteinGrams) * 1000) / 10;
        comparison.protein = {
          actual: totals.protein,
          target: targets.proteinGrams,
          remaining,
          percentage,
        };
        if (totals.protein < targets.proteinGrams) allTargetsMet = false;
      }

      if (targets.carbsGrams !== null && targets.carbsGrams > 0) {
        const remaining = Math.max(0, targets.carbsGrams - totals.carbohydrates);
        const percentage = Math.round((totals.carbohydrates / targets.carbsGrams) * 1000) / 10;
        comparison.carbohydrates = {
          actual: totals.carbohydrates,
          target: targets.carbsGrams,
          remaining,
          percentage,
        };
        if (totals.carbohydrates < targets.carbsGrams) allTargetsMet = false;
      }

      if (targets.fatsGrams !== null && targets.fatsGrams > 0) {
        const remaining = Math.max(0, targets.fatsGrams - totals.fats);
        const percentage = Math.round((totals.fats / targets.fatsGrams) * 1000) / 10;
        comparison.fats = {
          actual: totals.fats,
          target: targets.fatsGrams,
          remaining,
          percentage,
        };
        if (totals.fats < targets.fatsGrams) allTargetsMet = false;
      }

      if (allTargetsMet) {
        comparison.status = 'completed';
      }

      goalComparison = comparison;
    }

    return {
      date: formattedDate,
      timezone: tz,
      entryCount: entries.length,
      totals,
      mealBreakdown,
      goalComparison,
      entries,
    };
  }
}

const foodDiaryService = new FoodDiaryService();

export default foodDiaryService;

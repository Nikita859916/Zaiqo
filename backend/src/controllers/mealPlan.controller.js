import mongoose from 'mongoose';
import mealPlanService from '../services/mealPlan.service.js';
import {
  validateMealPlanInput,
  validateMealSlotUpdate,
} from '../utils/mealPlanValidation.js';
import { badRequest, ApiError } from '../utils/apiError.js';

/**
 * Check if MongoDB connection is active
 */
const checkDbConnection = (next) => {
  if (mongoose.connection.readyState !== 1) {
    next(
      new ApiError(
        503,
        'Database service is currently unavailable. Please verify MONGODB_URI configuration.'
      )
    );
    return false;
  }
  return true;
};

/**
 * Create a new meal plan
 * POST /api/meal-plans
 */
export const createMealPlan = async (req, res, next) => {
  try {
    const validation = validateMealPlanInput(req.body, false);
    if (!validation.isValid) {
      return next(badRequest(validation.error));
    }

    if (!checkDbConnection(next)) return;

    const mealPlan = await mealPlanService.createMealPlan(
      req.user._id,
      validation.sanitized
    );

    res.status(201).json({
      success: true,
      message: 'Meal plan created successfully',
      data: mealPlan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Return the authenticated user's meal plans
 * GET /api/meal-plans
 */
export const getMealPlans = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    const { page, limit } = req.query;
    const result = await mealPlanService.getMealPlans(req.user._id, {
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Return one meal plan belonging to the authenticated user
 * GET /api/meal-plans/:id
 */
export const getMealPlanById = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    const mealPlan = await mealPlanService.getMealPlanById(
      req.user._id,
      req.params.id
    );

    res.status(200).json({
      success: true,
      data: mealPlan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing meal plan
 * PUT /api/meal-plans/:id
 */
export const updateMealPlan = async (req, res, next) => {
  try {
    const validation = validateMealPlanInput(req.body, true);
    if (!validation.isValid) {
      return next(badRequest(validation.error));
    }

    if (!checkDbConnection(next)) return;

    const updated = await mealPlanService.updateMealPlan(
      req.user._id,
      req.params.id,
      validation.sanitized
    );

    res.status(200).json({
      success: true,
      message: 'Meal plan updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an existing meal plan
 * DELETE /api/meal-plans/:id
 */
export const deleteMealPlan = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    await mealPlanService.deleteMealPlan(req.user._id, req.params.id);

    res.status(200).json({
      success: true,
      message: 'Meal plan deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a specific meal slot (date and meal type)
 * PUT /api/meal-plans/:id/meals
 */
export const updateMealSlot = async (req, res, next) => {
  try {
    const validation = validateMealSlotUpdate(req.body);
    if (!validation.isValid) {
      return next(badRequest(validation.error));
    }

    if (!checkDbConnection(next)) return;

    const updated = await mealPlanService.updateMealSlot(
      req.user._id,
      req.params.id,
      validation.sanitized
    );

    res.status(200).json({
      success: true,
      message: 'Meal slot updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

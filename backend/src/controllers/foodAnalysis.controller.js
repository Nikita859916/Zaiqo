import mongoose from 'mongoose';
import foodAnalysisService from '../services/foodAnalysis.service.js';
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
 * Upload and analyze a food photo
 * POST /api/food-analysis
 */
export const analyzeFoodPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(badRequest('Food image file is required (field name: "image").'));
    }

    if (!checkDbConnection(next)) return;

    const analysis = await foodAnalysisService.analyzeFoodPhoto(req.user._id, req.file);

    res.status(201).json({
      success: true,
      message: 'Food photo analyzed successfully',
      data: analysis,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's food analysis history
 * GET /api/food-analysis
 */
export const getFoodAnalysisHistory = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    const analyses = await foodAnalysisService.getAnalysisHistory(req.user._id, req.query);

    res.status(200).json({
      success: true,
      data: analyses,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single food analysis record
 * GET /api/food-analysis/:id
 */
export const getFoodAnalysisById = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    const analysis = await foodAnalysisService.getAnalysisById(req.user._id, req.params.id);

    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a food analysis record
 * DELETE /api/food-analysis/:id
 */
export const deleteFoodAnalysis = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    await foodAnalysisService.deleteAnalysis(req.user._id, req.params.id);

    res.status(200).json({
      success: true,
      message: 'Food analysis deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

import mongoose from 'mongoose';
import foodDiaryService from '../services/foodDiary.service.js';
import { ApiError } from '../utils/apiError.js';

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
 * Create a new manual food diary entry
 * POST /api/food-diary
 */
export const createDiaryEntry = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    const entry = await foodDiaryService.createEntry(req.user._id, req.body);

    res.status(201).json({
      success: true,
      message: 'Food diary entry created successfully',
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a food diary entry from a completed FoodAnalysis
 * POST /api/food-diary/from-analysis/:analysisId
 */
export const createFromAnalysis = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    const entry = await foodDiaryService.createFromAnalysis(
      req.user._id,
      req.params.analysisId,
      req.body
    );

    res.status(201).json({
      success: true,
      message: 'Food diary entry created from analysis successfully',
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get daily nutritional aggregation and goal comparison
 * GET /api/food-diary/daily?date=YYYY-MM-DD&timezone=Asia/Kolkata
 */
export const getDailySummary = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    const summary = await foodDiaryService.getDailySummary(
      req.user._id,
      req.query.date,
      req.query.timezone
    );

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's paginated food diary history
 * GET /api/food-diary/history
 */
export const getHistory = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    const history = await foodDiaryService.getHistory(req.user._id, req.query);

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single food diary entry by ID
 * GET /api/food-diary/:id
 */
export const getEntryById = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    const entry = await foodDiaryService.getEntryById(req.user._id, req.params.id);

    res.status(200).json({
      success: true,
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing food diary entry
 * PATCH /api/food-diary/:id
 */
export const updateEntry = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    const entry = await foodDiaryService.updateEntry(
      req.user._id,
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: 'Food diary entry updated successfully',
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a food diary entry
 * DELETE /api/food-diary/:id
 */
export const deleteEntry = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    await foodDiaryService.deleteEntry(req.user._id, req.params.id);

    res.status(200).json({
      success: true,
      message: 'Food diary entry deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

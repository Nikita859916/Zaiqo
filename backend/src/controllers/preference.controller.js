import mongoose from 'mongoose';
import preferenceService from '../services/preference.service.js';
import { validatePreferenceInput } from '../utils/preferenceValidation.js';
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
 * Get preferences for the authenticated user
 * GET /api/preferences
 */
export const getPreferences = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    const preferences = await preferenceService.getPreferencesByUserId(req.user._id);

    if (!preferences) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No preferences found for this user.',
      });
    }

    res.status(200).json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create preferences for the authenticated user
 * POST /api/preferences
 */
export const createPreferences = async (req, res, next) => {
  try {
    const validation = validatePreferenceInput(req.body, false);
    if (!validation.isValid) {
      return next(badRequest(validation.error));
    }

    if (!checkDbConnection(next)) return;

    const preferences = await preferenceService.createPreferences(
      req.user._id,
      validation.sanitized
    );

    res.status(201).json({
      success: true,
      message: 'Preferences created successfully',
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update preferences for the authenticated user
 * PUT /api/preferences
 */
export const updatePreferences = async (req, res, next) => {
  try {
    const validation = validatePreferenceInput(req.body, true);
    if (!validation.isValid) {
      return next(badRequest(validation.error));
    }

    if (!checkDbConnection(next)) return;

    const preferences = await preferenceService.updatePreferences(
      req.user._id,
      validation.sanitized,
      { upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete or reset preferences for the authenticated user
 * DELETE /api/preferences
 */
export const deletePreferences = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    const wasDeleted = await preferenceService.deletePreferences(req.user._id);

    res.status(200).json({
      success: true,
      message: wasDeleted
        ? 'Preferences deleted successfully'
        : 'No preferences found to delete.',
    });
  } catch (error) {
    next(error);
  }
};

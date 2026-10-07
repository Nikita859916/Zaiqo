import mongoose from 'mongoose';
import userService from '../services/user.service.js';
import { ApiError, badRequest } from '../utils/apiError.js';

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
 * Get authenticated user profile with linked preferences
 * GET /api/users/profile
 */
export const getUserProfile = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    const profileData = await userService.getUserProfile(req.user._id);

    res.status(200).json({
      success: true,
      data: profileData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update authenticated user profile details
 * PUT /api/users/profile
 */
export const updateUserProfile = async (req, res, next) => {
  try {
    if (!checkDbConnection(next)) return;

    const { name } = req.body || {};
    if (name === undefined) {
      return next(badRequest('Please provide at least one field to update (e.g. name).'));
    }

    const updatedUser = await userService.updateUserProfile(req.user._id, { name });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

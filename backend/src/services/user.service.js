import User from '../models/user.model.js';
import preferenceService from './preference.service.js';
import { notFound, badRequest } from '../utils/apiError.js';

/**
 * Service to manage User Profile business logic and persistence
 */
class UserService {
  /**
   * Get user profile along with linked preferences
   * @param {string|mongoose.Types.ObjectId} userId
   * @returns {Promise<{ user: Object, preferences: Object|null }>}
   */
  async getUserProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw notFound('User not found.');
    }

    const preferences = await preferenceService.getPreferencesByUserId(userId);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      preferences: preferences || null,
    };
  }

  /**
   * Update authenticated user profile details
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async updateUserProfile(userId, data) {
    const user = await User.findById(userId);
    if (!user) {
      throw notFound('User not found.');
    }

    if (data.name !== undefined) {
      if (typeof data.name !== 'string' || data.name.trim().length < 2) {
        throw badRequest('Name must be at least 2 characters long.');
      }
      if (data.name.trim().length > 50) {
        throw badRequest('Name cannot exceed 50 characters.');
      }
      user.name = data.name.trim();
    }

    await user.save();

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

export default new UserService();

import UserPreference from '../models/userPreference.model.js';
import { conflict, notFound } from '../utils/apiError.js';

/**
 * Service to manage UserPreference persistence and business logic
 */
class PreferenceService {
  /**
   * Retrieve preferences for a specific user
   * @param {string|mongoose.Types.ObjectId} userId
   * @returns {Promise<UserPreference|null>}
   */
  async getPreferencesByUserId(userId) {
    return UserPreference.findOne({ user: userId });
  }

  /**
   * Create preferences for an authenticated user
   * Prevents duplicate preference creation
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {Object} data
   * @returns {Promise<UserPreference>}
   */
  async createPreferences(userId, data) {
    const existing = await UserPreference.findOne({ user: userId });
    if (existing) {
      throw conflict('Preferences already exist for this user. Use PUT to update.');
    }

    return UserPreference.create({
      ...data,
      user: userId,
    });
  }

  /**
   * Update preferences for an authenticated user
   * Supports upsert if preferences have not been initialized yet
   * @param {string|mongoose.Types.ObjectId} userId
   * @param {Object} data
   * @param {Object} options
   * @returns {Promise<UserPreference>}
   */
  async updatePreferences(userId, data, options = { upsert: true }) {
    const updated = await UserPreference.findOneAndUpdate(
      { user: userId },
      { $set: data },
      {
        new: true,
        runValidators: true,
        upsert: options.upsert,
        setDefaultsOnInsert: true,
      }
    );

    return updated;
  }

  /**
   * Delete or reset preferences for an authenticated user
   * @param {string|mongoose.Types.ObjectId} userId
   * @returns {Promise<boolean>}
   */
  async deletePreferences(userId) {
    const deleted = await UserPreference.findOneAndDelete({ user: userId });
    return Boolean(deleted);
  }
}

export default new PreferenceService();

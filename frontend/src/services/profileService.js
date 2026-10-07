/**
 * Zaiqo User Profile & Preference Service
 * 
 * Connects directly to Express backend APIs:
 * - GET  /api/users/profile
 * - PUT  /api/users/profile
 * - GET  /api/preferences
 * - PUT  /api/preferences
 * - DELETE /api/preferences
 */

import api from './api';

export const DEFAULT_PREFERENCES = {
  dietaryPreference: 'no-preference',
  wellnessGoals: ['general-wellness'],
  allergies: [],
  foodsToAvoid: [],
  preferredCuisines: [],
  cookingTime: 'no-preference',
  spiceLevel: 'medium',
  dailyNutritionTargets: {
    calories: null,
    proteinGrams: null,
    carbsGrams: null,
    fatsGrams: null,
  },
  householdSize: 1,
  defaultServings: 2,
  budgetTier: 'balanced',
  preferredMarketplace: 'any',
};

/**
 * Normalizes backend user + preference responses into unified profile state
 */
export function normalizeProfile(user, preferences) {
  const prefs = preferences || {};
  return {
    id: user?.id || user?._id || '',
    name: user?.name || 'Zaiqo Member',
    email: user?.email || '',
    dietaryPreference: prefs.dietaryPreference || DEFAULT_PREFERENCES.dietaryPreference,
    wellnessGoals: Array.isArray(prefs.wellnessGoals) ? prefs.wellnessGoals : DEFAULT_PREFERENCES.wellnessGoals,
    allergies: Array.isArray(prefs.allergies) ? prefs.allergies : DEFAULT_PREFERENCES.allergies,
    foodsToAvoid: Array.isArray(prefs.foodsToAvoid) ? prefs.foodsToAvoid : DEFAULT_PREFERENCES.foodsToAvoid,
    preferredCuisines: Array.isArray(prefs.preferredCuisines) ? prefs.preferredCuisines : DEFAULT_PREFERENCES.preferredCuisines,
    cookingTime: prefs.cookingTime || DEFAULT_PREFERENCES.cookingTime,
    spiceLevel: prefs.spiceLevel || DEFAULT_PREFERENCES.spiceLevel,
    dailyNutritionTargets: {
      calories: prefs.dailyNutritionTargets?.calories ?? null,
      proteinGrams: prefs.dailyNutritionTargets?.proteinGrams ?? null,
      carbsGrams: prefs.dailyNutritionTargets?.carbsGrams ?? null,
      fatsGrams: prefs.dailyNutritionTargets?.fatsGrams ?? null,
    },
    householdSize: typeof prefs.householdSize === 'number' ? prefs.householdSize : DEFAULT_PREFERENCES.householdSize,
    defaultServings: typeof prefs.defaultServings === 'number' ? prefs.defaultServings : DEFAULT_PREFERENCES.defaultServings,
    budgetTier: prefs.budgetTier || DEFAULT_PREFERENCES.budgetTier,
    preferredMarketplace: prefs.preferredMarketplace || DEFAULT_PREFERENCES.preferredMarketplace,

    // Aliases for dashboard and backward-compatible consumers
    foodPreferences: prefs.dietaryPreference ? [prefs.dietaryPreference] : ['no-preference'],
    spicePreference: prefs.spiceLevel || 'medium',
  };
}

/**
 * Retrieve user profile and linked preferences from backend
 * GET /api/users/profile
 */
export async function getUserProfile(userId, fallbackUser = null) {
  try {
    const response = await api.get('/users/profile');
    const data = response.data?.data || response.data || {};
    return normalizeProfile(data.user || fallbackUser, data.preferences);
  } catch (error) {
    if (error.response?.status === 401) {
      throw error;
    }
    const message = error.response?.data?.message || error.message || 'Failed to load user profile.';
    throw new Error(message);
  }
}

/**
 * Update authenticated user name
 * PUT /api/users/profile
 */
export async function updateUserProfile(name) {
  const response = await api.put('/users/profile', { name });
  return response.data?.data?.user || response.data?.user;
}

/**
 * Get user preferences
 * GET /api/preferences
 */
export async function getPreferences() {
  const response = await api.get('/preferences');
  return response.data?.data || response.data;
}

/**
 * Update user preferences
 * PUT /api/preferences
 */
export async function updatePreferences(preferences) {
  const response = await api.put('/preferences', preferences);
  return response.data?.data || response.data;
}

/**
 * Delete or reset user preferences
 * DELETE /api/preferences
 */
export async function deletePreferences() {
  const response = await api.delete('/preferences');
  return response.data;
}

/**
 * Unified save operation: persists name via /api/users/profile and preferences via /api/preferences
 */
export async function saveUserProfile(userId, profileData) {
  try {
    let updatedUser = null;
    if (profileData?.name && typeof profileData.name === 'string') {
      try {
        const userRes = await api.put('/users/profile', { name: profileData.name.trim() });
        updatedUser = userRes.data?.data?.user || userRes.data?.user;
      } catch (err) {
        throw new Error(err.response?.data?.message || err.message || 'Failed to update user name.');
      }
    }

    const preferencePayload = {
      dietaryPreference: profileData.dietaryPreference,
      wellnessGoals: profileData.wellnessGoals,
      allergies: profileData.allergies,
      foodsToAvoid: profileData.foodsToAvoid,
      preferredCuisines: profileData.preferredCuisines,
      cookingTime: profileData.cookingTime,
      spiceLevel: profileData.spiceLevel,
      dailyNutritionTargets: profileData.dailyNutritionTargets,
      householdSize: profileData.householdSize,
      defaultServings: profileData.defaultServings,
      budgetTier: profileData.budgetTier,
      preferredMarketplace: profileData.preferredMarketplace,
    };

    const prefRes = await api.put('/preferences', preferencePayload);
    const updatedPreferences = prefRes.data?.data || prefRes.data || {};

    return normalizeProfile(
      updatedUser || { id: userId, name: profileData.name, email: profileData.email },
      updatedPreferences
    );
  } catch (error) {
    const message =
      error.response?.data?.message || error.message || 'Failed to save profile and preferences.';
    throw new Error(message);
  }
}

/**
 * Reset profile preferences back to defaults in MongoDB
 */
export async function resetUserProfile(userId, user = null) {
  try {
    await api.delete('/preferences');
    return normalizeProfile(user, DEFAULT_PREFERENCES);
  } catch (error) {
    const message =
      error.response?.data?.message || error.message || 'Failed to reset preferences.';
    throw new Error(message);
  }
}

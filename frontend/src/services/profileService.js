/**
 * Zaiqo User Profile & Preference Service
 * 
 * Manages personalized food preferences, wellness goals, allergies,
 * and culinary settings for authenticated users.
 * Persists locally and is structured for seamless backend integration.
 */

const DEFAULT_PROFILE = {
  foodPreferences: ['Vegetarian', 'Plant-Forward'],
  wellnessGoals: ['Sustained Energy', 'Digestive Balance', 'Mindful Eating'],
  allergies: ['None reported'],
  foodsToAvoid: ['Refined Sugar', 'Artificial Preservatives'],
  preferredCuisines: ['Mediterranean', 'Indian', 'East Asian'],
  cookingTime: '20–30 Minutes',
  spicePreference: 'Medium',
};

const getStorageKey = (userId) => `zaiqo_profile_${userId || 'default'}`;

/**
 * Retrieve user profile from local storage or fallback to defaults
 */
export function getUserProfile(userId, fallbackUser = null) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return {
        name: fallbackUser?.name || 'Zaiqo Member',
        email: fallbackUser?.email || '',
        ...DEFAULT_PROFILE,
      };
    }

    const key = getStorageKey(userId || fallbackUser?.id);
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      const initial = {
        name: fallbackUser?.name || 'Zaiqo Member',
        email: fallbackUser?.email || '',
        ...DEFAULT_PROFILE,
      };
      window.localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }

    const parsed = JSON.parse(raw);
    return {
      name: fallbackUser?.name || parsed.name || 'Zaiqo Member',
      email: fallbackUser?.email || parsed.email || '',
      ...DEFAULT_PROFILE,
      ...parsed,
    };
  } catch {
    return {
      name: fallbackUser?.name || 'Zaiqo Member',
      email: fallbackUser?.email || '',
      ...DEFAULT_PROFILE,
    };
  }
}

/**
 * Save updated user profile
 */
export function saveUserProfile(userId, profileData) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return profileData;
    const key = getStorageKey(userId);
    window.localStorage.setItem(key, JSON.stringify(profileData));
    return profileData;
  } catch (err) {
    console.error('Failed to save profile', err);
    return profileData;
  }
}

/**
 * Reset profile back to defaults
 */
export function resetUserProfile(userId, user = null) {
  try {
    const key = getStorageKey(userId);
    const fresh = {
      name: user?.name || 'Zaiqo Member',
      email: user?.email || '',
      ...DEFAULT_PROFILE,
    };
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(fresh));
    }
    return fresh;
  } catch {
    return {
      name: user?.name || 'Zaiqo Member',
      email: user?.email || '',
      ...DEFAULT_PROFILE,
    };
  }
}

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  ShieldCheck,
  Sparkles,
  Save,
  RotateCcw,
  Check,
  UtensilsCrossed,
  Heart,
  Clock,
  Flame,
  AlertTriangle,
  LogOut,
  ChevronLeft,
  Users,
  Store,
  Wallet,
  Activity,
  AlertCircle,
  Plus,
  Minus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AppNavigation from '../components/AppNavigation';
import {
  getUserProfile,
  saveUserProfile,
  resetUserProfile,
} from '../services/profileService';

const DIETARY_PREFERENCE_OPTIONS = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'eggetarian', label: 'Eggetarian' },
  { value: 'non-vegetarian', label: 'Non-Vegetarian' },
  { value: 'jain', label: 'Jain' },
  { value: 'no-preference', label: 'No Preference' },
];

const WELLNESS_GOAL_OPTIONS = [
  { value: 'healthy-eating', label: 'Healthy Eating' },
  { value: 'weight-management', label: 'Weight Management' },
  { value: 'muscle-gain', label: 'Muscle Gain' },
  { value: 'better-nutrition', label: 'Better Nutrition' },
  { value: 'general-wellness', label: 'General Wellness' },
];

const ALLERGY_PRESETS = [
  'peanuts',
  'tree nuts',
  'dairy',
  'gluten',
  'shellfish',
  'eggs',
  'soy',
  'sesame',
];

const AVOID_PRESETS = [
  'refined sugar',
  'artificial preservatives',
  'highly processed seed oils',
  'excess sodium',
  'red meat',
  'deep fried foods',
];

const CUISINE_PRESETS = [
  'indian',
  'italian',
  'mexican',
  'mediterranean',
  'japanese',
  'chinese',
  'continental',
];

const COOKING_TIME_OPTIONS = [
  { value: 'under-15', label: 'Under 15 Mins (Fast)' },
  { value: '15-30', label: '15–30 Mins (Balanced)' },
  { value: '30-60', label: '30–60 Mins (Leisurely)' },
  { value: 'no-preference', label: 'No Preference' },
];

const SPICE_OPTIONS = [
  { value: 'mild', label: 'Mild' },
  { value: 'medium', label: 'Medium' },
  { value: 'spicy', label: 'Spicy' },
  { value: 'no-preference', label: 'No Preference' },
];

const BUDGET_TIER_OPTIONS = [
  { value: 'budget-friendly', label: 'Budget-Friendly' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'premium', label: 'Premium' },
  { value: 'no-preference', label: 'No Preference' },
];

const MARKETPLACE_OPTIONS = [
  { value: 'instamart', label: 'Swiggy Instamart' },
  { value: 'blinkit', label: 'Blinkit' },
  { value: 'zepto', label: 'Zepto' },
  { value: 'jiomart', label: 'JioMart' },
  { value: 'any', label: 'Any Marketplace' },
];

function formatLabel(str) {
  if (!str) return '';
  return str
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function AccountPage() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (user) {
      setIsLoadingProfile(true);
      setErrorMessage(null);
      getUserProfile(user.id, user)
        .then((p) => {
          if (isMounted) setProfile(p);
        })
        .catch((err) => {
          if (isMounted) {
            setErrorMessage(err.message || 'Failed to load user profile from server.');
          }
        })
        .finally(() => {
          if (isMounted) setIsLoadingProfile(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [user]);

  if (!profile) {
    if (errorMessage) {
      return (
        <div className="min-h-screen bg-[#FAFAF9] flex flex-col items-center justify-center p-4">
          <div className="p-5 max-w-md w-full bg-rose-50 border border-rose-200 rounded-3xl text-center space-y-3">
            <div className="w-10 h-10 mx-auto rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Unable to Load Profile</h3>
            <p className="text-xs font-medium text-rose-800">{errorMessage}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider animate-pulse">
          Loading culinary profile...
        </div>
      </div>
    );
  }

  const toggleArrayOption = (field, option) => {
    setProfile((prev) => {
      const current = prev[field] || [];
      const normalized = option.toLowerCase().trim();
      if (current.includes(normalized)) {
        return {
          ...prev,
          [field]: current.filter((item) => item !== normalized),
        };
      } else {
        return {
          ...prev,
          [field]: [...current, normalized],
        };
      }
    });
  };

  const handleNutritionChange = (key, value) => {
    const num = value === '' ? null : Number(value);
    setProfile((prev) => ({
      ...prev,
      dailyNutritionTargets: {
        ...(prev.dailyNutritionTargets || {}),
        [key]: num !== null && !isNaN(num) ? num : null,
      },
    }));
  };

  const handleHouseholdChange = (delta) => {
    setProfile((prev) => {
      const current = prev.householdSize || 1;
      const next = Math.min(20, Math.max(1, current + delta));
      return { ...prev, householdSize: next };
    });
  };

  const handleServingsChange = (delta) => {
    setProfile((prev) => {
      const current = prev.defaultServings || 2;
      const next = Math.min(20, Math.max(1, current + delta));
      return { ...prev, defaultServings: next };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const updated = await saveUserProfile(user.id, profile);
      setProfile(updated);
      if (profile.name && profile.name !== user.name) {
        setUser({ ...user, name: profile.name });
      }
      setIsSavedNotice(true);
      setTimeout(() => setIsSavedNotice(false), 2400);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save dietary profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!user) return;
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const fresh = await resetUserProfile(user.id, user);
      setProfile(fresh);
      setIsSavedNotice(true);
      setTimeout(() => setIsSavedNotice(false), 2400);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to reset preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Top Unified Navigation */}
      <AppNavigation />

      {/* Main Account Settings Space */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Back Link to Dashboard */}
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          <AnimatePresence>
            {isSavedNotice && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Preferences Saved to Cloud</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Global Error Banner if any */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-medium">{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User Identity Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center text-xl font-black shadow-md shadow-emerald-600/20">
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[10px] font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Active Profile</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {profile.name}
              </h1>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{profile.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Profile Settings Form */}
        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 0: Account Details */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Account Details</h2>
                <p className="text-xs text-slate-500">
                  Update your display name linked to your verified account.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:bg-white rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-none transition-all"
                  placeholder="Your full name"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Email Address
                </label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200/80 rounded-2xl text-xs sm:text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Section 1: Dietary Preference */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Dietary Preference</h2>
                <p className="text-xs text-slate-500">
                  Select your primary dietary philosophy to guide recipe generation and meal suggestions.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {DIETARY_PREFERENCE_OPTIONS.map((option) => {
                const isSelected = profile.dietaryPreference === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setProfile({ ...profile, dietaryPreference: option.value })}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Wellness Goals */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Wellness Goals</h2>
                <p className="text-xs text-slate-500">
                  Zai optimizes micronutrient density and glycemic load to support these vitality outcomes.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {WELLNESS_GOAL_OPTIONS.map((option) => {
                const isSelected = profile.wellnessGoals?.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleArrayOption('wellnessGoals', option.value)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Household & Servings (Phase 11) */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Household &amp; Servings</h2>
                <p className="text-xs text-slate-500">
                  Calibrate recipe ingredient quantities, grocery packaging, and meal scale.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Household Size */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-slate-900">Household Size</span>
                  <span className="text-[11px] text-slate-500">Total people in your home</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleHouseholdChange(-1)}
                    disabled={(profile.householdSize || 1) <= 1}
                    className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-black text-slate-900">
                    {profile.householdSize || 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleHouseholdChange(1)}
                    disabled={(profile.householdSize || 1) >= 20}
                    className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Default Servings */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-slate-900">Default Servings</span>
                  <span className="text-[11px] text-slate-500">Portions cooked per recipe</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleServingsChange(-1)}
                    disabled={(profile.defaultServings || 2) <= 1}
                    className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-black text-slate-900">
                    {profile.defaultServings || 2}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleServingsChange(1)}
                    disabled={(profile.defaultServings || 2) >= 20}
                    className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Budget Tier & Preferred Marketplace (Phase 11) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Budget Tier */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Budget Tier</h2>
                  <p className="text-xs text-slate-500">Calibrates ingredient recommendations.</p>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                {BUDGET_TIER_OPTIONS.map((option) => {
                  const isSelected = profile.budgetTier === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setProfile({ ...profile, budgetTier: option.value })}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                      }`}
                    >
                      <span>{option.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-100" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preferred Marketplace */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Preferred Marketplace</h2>
                  <p className="text-xs text-slate-500">Prioritized for live pricing and cart export.</p>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                {MARKETPLACE_OPTIONS.map((option) => {
                  const isSelected = profile.preferredMarketplace === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setProfile({ ...profile, preferredMarketplace: option.value })}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-violet-600 text-white shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                      }`}
                    >
                      <span>{option.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-violet-100" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 5: Allergies & Sensitivities */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Allergies &amp; Sensitivities</h2>
                <p className="text-xs text-slate-500">
                  Ingredients containing these allergens will be strictly excluded from all recommendations.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {ALLERGY_PRESETS.map((allergy) => {
                const isSelected = profile.allergies?.includes(allergy);
                return (
                  <button
                    key={allergy}
                    type="button"
                    onClick={() => toggleArrayOption('allergies', allergy)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                    }`}
                  >
                    {formatLabel(allergy)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 6: Foods to Avoid */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Foods to Avoid</h2>
                <p className="text-xs text-slate-500">
                  Optional ingredient filters for lifestyle or personal preference.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {AVOID_PRESETS.map((avoid) => {
                const isSelected = profile.foodsToAvoid?.includes(avoid);
                return (
                  <button
                    key={avoid}
                    type="button"
                    onClick={() => toggleArrayOption('foodsToAvoid', avoid)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                    }`}
                  >
                    {formatLabel(avoid)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 7: Preferred Cuisines */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Preferred Cuisines</h2>
                <p className="text-xs text-slate-500">
                  Flavors and culinary styles you enjoy cooking and eating most frequently.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {CUISINE_PRESETS.map((cuisine) => {
                const isSelected = profile.preferredCuisines?.includes(cuisine);
                return (
                  <button
                    key={cuisine}
                    type="button"
                    onClick={() => toggleArrayOption('preferredCuisines', cuisine)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                    }`}
                  >
                    {formatLabel(cuisine)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 8: Cooking Time & Spice Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cooking Time */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Cooking Time</h2>
                  <p className="text-xs text-slate-500">Preferred meal prep duration.</p>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                {COOKING_TIME_OPTIONS.map((option) => {
                  const isSelected = profile.cookingTime === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setProfile({ ...profile, cookingTime: option.value })}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                      }`}
                    >
                      <span>{option.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Spice Level */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Spice Level</h2>
                  <p className="text-xs text-slate-500">Heat and seasoning calibration.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {SPICE_OPTIONS.map((option) => {
                  const isSelected = profile.spiceLevel === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setProfile({ ...profile, spiceLevel: option.value })}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
                        isSelected
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 9: Daily Nutrition Targets */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Daily Nutrition Targets</h2>
                <p className="text-xs text-slate-500">
                  Optional caloric and macronutrient guidelines for personalized meal planning.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Calories (kcal)
                </span>
                <input
                  type="number"
                  min="0"
                  max="10000"
                  value={profile.dailyNutritionTargets?.calories ?? ''}
                  onChange={(e) => handleNutritionChange('calories', e.target.value)}
                  placeholder="e.g. 2000"
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Protein (g)
                </span>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={profile.dailyNutritionTargets?.proteinGrams ?? ''}
                  onChange={(e) => handleNutritionChange('proteinGrams', e.target.value)}
                  placeholder="e.g. 120"
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Carbs (g)
                </span>
                <input
                  type="number"
                  min="0"
                  max="2000"
                  value={profile.dailyNutritionTargets?.carbsGrams ?? ''}
                  onChange={(e) => handleNutritionChange('carbsGrams', e.target.value)}
                  placeholder="e.g. 220"
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Fats (g)
                </span>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={profile.dailyNutritionTargets?.fatsGrams ?? ''}
                  onChange={(e) => handleNutritionChange('fatsGrams', e.target.value)}
                  placeholder="e.g. 65"
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Form Action Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>

            <motion.button
              type="submit"
              disabled={isSaving}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Preferences...' : 'Save Dietary Profile'}</span>
            </motion.button>
          </div>
        </form>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200/60 mt-8">
        <span>Zaiqo &bull; Personalized AI-Powered Food &amp; Wellness Platform</span>
      </footer>
    </div>
  );
}

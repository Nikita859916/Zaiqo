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
  ArrowRight,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AppNavigation from '../components/AppNavigation';
import {
  getUserProfile,
  saveUserProfile,
  resetUserProfile,
} from '../services/profileService';

const FOOD_PREFERENCE_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Plant-Forward',
  'High-Protein',
  'Mediterranean',
  'Low-Carb',
  'Keto',
  'Pescatarian',
  'Dairy-Free',
  'Gluten-Free',
];

const WELLNESS_GOAL_OPTIONS = [
  'Sustained Energy',
  'Digestive Balance',
  'Muscle Recovery',
  'Mindful Eating',
  'Better Sleep',
  'Weight Management',
  'Cardiovascular Health',
  'Anti-Inflammatory',
];

const ALLERGY_OPTIONS = [
  'None reported',
  'Peanuts',
  'Tree Nuts',
  'Dairy / Lactose',
  'Gluten / Wheat',
  'Shellfish',
  'Eggs',
  'Soy',
  'Sesame',
];

const AVOID_OPTIONS = [
  'Refined Sugar',
  'Artificial Preservatives',
  'Highly Processed Seed Oils',
  'Excess Sodium',
  'Red Meat',
  'Nightshades',
  'Deep Fried Foods',
];

const CUISINE_OPTIONS = [
  'Mediterranean',
  'Indian',
  'East Asian',
  'Italian',
  'Mexican',
  'Middle Eastern',
  'Nordic / Continental',
  'Thai',
];

const COOKING_TIME_OPTIONS = [
  'Under 15 Mins (Ultra Fast)',
  '20–30 Minutes (Balanced)',
  '45+ Minutes (Leisurely)',
];

const SPICE_OPTIONS = ['Mild', 'Medium', 'Spicy', 'Fiery'];

export default function AccountPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  useEffect(() => {
    if (user) {
      const p = getUserProfile(user.id, user);
      setProfile(p);
    }
  }, [user]);

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Loading culinary profile...
        </div>
      </div>
    );
  }

  const toggleArrayOption = (field, option) => {
    setProfile((prev) => {
      const current = prev[field] || [];
      if (current.includes(option)) {
        // Prevent empty list for essential fields
        if (current.length === 1 && field === 'foodPreferences') return prev;
        return {
          ...prev,
          [field]: current.filter((item) => item !== option),
        };
      } else {
        return {
          ...prev,
          [field]: [...current, option],
        };
      }
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!user) return;
    saveUserProfile(user.id, profile);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2400);
  };

  const handleReset = () => {
    if (!user) return;
    const fresh = resetUserProfile(user.id, user);
    setProfile(fresh);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2400);
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
                <span>Preferences Saved Successfully</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
          {/* Section 1: Food Preferences */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Food Preferences</h2>
                <p className="text-xs text-slate-500">
                  Select your primary dietary approaches to calibrate recipe generation and meal suggestions.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {FOOD_PREFERENCE_OPTIONS.map((option) => {
                const isSelected = profile.foodPreferences?.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleArrayOption('foodPreferences', option)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                    }`}
                  >
                    {option}
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
                  Zai optimizes micronutrient diversity and glycemic load to support these vitality outcomes.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {WELLNESS_GOAL_OPTIONS.map((option) => {
                const isSelected = profile.wellnessGoals?.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleArrayOption('wellnessGoals', option)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Allergies & Sensitivities */}
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
              {ALLERGY_OPTIONS.map((option) => {
                const isSelected = profile.allergies?.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleArrayOption('allergies', option)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Foods to Avoid */}
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
              {AVOID_OPTIONS.map((option) => {
                const isSelected = profile.foodsToAvoid?.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleArrayOption('foodsToAvoid', option)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Preferred Cuisines */}
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
              {CUISINE_OPTIONS.map((option) => {
                const isSelected = profile.preferredCuisines?.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleArrayOption('preferredCuisines', option)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 6: Cooking Time & Spice Preference */}
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
                  const isSelected = profile.cookingTime === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setProfile({ ...profile, cookingTime: option })}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                      }`}
                    >
                      <span>{option}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Spice Preference */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Spice Preference</h2>
                  <p className="text-xs text-slate-500">Heat and seasoning calibration.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {SPICE_OPTIONS.map((option) => {
                  const isSelected = profile.spicePreference === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setProfile({ ...profile, spicePreference: option })}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
                        isSelected
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Form Action Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Dietary Profile</span>
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

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Clock, Utensils, ShieldCheck, Flame } from 'lucide-react';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

const DIETARY_PREFERENCES = [
  'Vegetarian',
  'Vegan',
  'High Protein',
  'Low Carb',
  'Gluten Free',
  'No Preference',
];

const COOKING_TIMES = [
  { label: 'Under 15 mins', value: '15 mins' },
  { label: 'Under 25 mins', value: '25 mins' },
  { label: 'Under 45 mins', value: '45 mins' },
  { label: 'Any time', value: '' },
];

export default function RecipeRequestForm({
  initialParams = {},
  onGenerate,
  isLoading = false,
}) {
  const [mealType, setMealType] = useState(initialParams.mealType || 'Dinner');
  const [dietaryPreference, setDietaryPreference] = useState(
    initialParams.dietaryPreference || 'Vegetarian'
  );
  const [ingredients, setIngredients] = useState(
    Array.isArray(initialParams.ingredients)
      ? initialParams.ingredients.join(', ')
      : initialParams.ingredients || ''
  );
  const [maxCookingTime, setMaxCookingTime] = useState(
    initialParams.cookingTime || '25 mins'
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;
    onGenerate({
      mealType,
      dietaryPreference,
      ingredients,
      maxCookingTime,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Meal Type Selection */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Utensils className="w-3.5 h-3.5 text-emerald-600" />
          <span>Meal Type</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MEAL_TYPES.map((type) => {
            const isSelected = mealType.toLowerCase() === type.toLowerCase();
            return (
              <button
                type="button"
                key={type}
                onClick={() => setMealType(type)}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer text-center ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/40'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Dietary Preference Selection */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Dietary Preference</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DIETARY_PREFERENCES.map((pref) => {
            const isSelected =
              dietaryPreference.toLowerCase() === pref.toLowerCase();
            return (
              <button
                type="button"
                key={pref}
                onClick={() => setDietaryPreference(pref)}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer text-center ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/40'
                }`}
              >
                {pref}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Available Ingredients (Free Text Input) */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Available Ingredients</span>
          </span>
          <span className="text-[11px] text-slate-400 font-normal lowercase">
            comma-separated
          </span>
        </label>
        <input
          type="text"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder="e.g. paneer, spinach, garlic, cumin"
          className="w-full bg-white border border-slate-200/90 hover:border-slate-300 focus:border-emerald-500 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-xs"
        />
      </div>

      {/* 4. Maximum Cooking Time */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Maximum Cooking Time (Optional)</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {COOKING_TIMES.map((time) => {
            const isSelected = maxCookingTime === time.value;
            return (
              <button
                type="button"
                key={time.label}
                onClick={() => setMaxCookingTime(time.value)}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer text-center ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {time.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Generate Recipe CTA Button */}
      <div className="pt-2">
        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-emerald-200" />
          <span>{isLoading ? 'Generating Recipe...' : 'Generate Recipe'}</span>
        </motion.button>
      </div>
    </form>
  );
}

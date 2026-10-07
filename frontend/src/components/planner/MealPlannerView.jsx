import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Sparkles,
  ShoppingCart,
  ArrowLeft,
  ChefHat,
  RefreshCw,
  CheckCircle2,
  SlidersHorizontal,
  Flame,
  X,
} from 'lucide-react';
import DayPlanSection from './DayPlanSection';
import RecipeDetailModal from './RecipeDetailModal';
import MealReplaceModal from './MealReplaceModal';
import {
  DURATION_OPTIONS,
  DIETARY_OPTIONS,
  CALORIE_OPTIONS,
  generateMealPlan,
  loadMealPlan,
  saveMealPlan,
  replaceMeal,
  regenerateSingleMeal,
  removeMeal,
  createGroceryListFromMealPlan,
} from '../../services/mealPlannerService';

export default function MealPlannerView({
  initialParams = {},
  onBackToChat,
  onOpenGroceryList,
  onOpenRecipeStudio,
}) {
  const [durationDays, setDurationDays] = useState(
    Number(initialParams.durationDays) || 5
  );
  const [dietaryPreference, setDietaryPreference] = useState(
    initialParams.dietaryPreference || 'Vegetarian'
  );
  const [calorieTarget, setCalorieTarget] = useState(2000);
  const [plan, setPlan] = useState(null);
  const [selectedDayTab, setSelectedDayTab] = useState('All');
  const [isGenerating, setIsGenerating] = useState(false);
  const [notice, setNotice] = useState(null);

  // Modals state
  const [viewingRecipe, setViewingRecipe] = useState(null);
  const [replaceModalState, setReplaceModalState] = useState(null); // { dayNumber, mealType, currentRecipeId }

  // Load plan on mount or auto-generate
  useEffect(() => {
    const existing = loadMealPlan();
    if (existing && existing.days?.length) {
      setPlan(existing);
      setDurationDays(existing.durationDays || 5);
      setDietaryPreference(existing.dietaryPreference || 'Vegetarian');
      setCalorieTarget(existing.calorieTarget || 2000);
    } else {
      handleGenerateNewPlan(durationDays, dietaryPreference, calorieTarget);
    }
  }, []);

  const handleGenerateNewPlan = (
    days = durationDays,
    pref = dietaryPreference,
    cals = calorieTarget
  ) => {
    setIsGenerating(true);
    setTimeout(() => {
      const generated = generateMealPlan({
        durationDays: days,
        dietaryPreference: pref,
        calorieTarget: cals,
      });
      setPlan(generated);
      setIsGenerating(false);
      setNotice(`Generated a personalized ${days}-day ${pref} meal plan.`);
    }, 400);
  };

  const handleRegenerateMeal = (dayNumber, mealType) => {
    if (!plan) return;
    const updated = regenerateSingleMeal(plan, dayNumber, mealType);
    setPlan(updated);
    setNotice(`Updated ${mealType} for Day ${dayNumber}.`);
  };

  const handleRemoveMeal = (dayNumber, mealType) => {
    if (!plan) return;
    const updated = removeMeal(plan, dayNumber, mealType);
    setPlan(updated);
  };

  const handleOpenReplaceModal = (dayNumber, mealType) => {
    const currentMeal = plan?.days?.find((d) => d.day === dayNumber)?.meals?.[mealType.toLowerCase()];
    setReplaceModalState({
      dayNumber,
      mealType,
      currentRecipeId: currentMeal?.id || null,
    });
  };

  const handleApplyReplacement = (newRecipe) => {
    if (!replaceModalState || !plan) return;
    const { dayNumber, mealType } = replaceModalState;
    const updated = replaceMeal(plan, dayNumber, mealType, newRecipe);
    setPlan(updated);
    setReplaceModalState(null);
    setNotice(`Replaced Day ${dayNumber} ${mealType} with "${newRecipe.name}".`);
  };

  // Convert Meal Plan to Grocery List
  const handleCreateGroceryList = () => {
    if (!plan) return;
    const result = createGroceryListFromMealPlan(plan);
    if (onOpenGroceryList) {
      onOpenGroceryList({
        notice: `Added all ingredients from your ${plan.durationDays}-day meal plan (${result.totalIngredientsAdded} ingredients combined into ${result.uniqueItemCount} grocery items).`,
      });
    } else {
      setNotice(`Successfully converted meal plan into grocery list (${result.totalIngredientsAdded} ingredients combined).`);
    }
  };

  const visibleDays =
    selectedDayTab === 'All'
      ? plan?.days || []
      : plan?.days?.filter((d) => d.day === Number(selectedDayTab)) || [];

  return (
    <div className="flex flex-col h-full bg-[#FAFAF9] rounded-3xl overflow-hidden">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200/90 px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          {onBackToChat && (
            <button
              onClick={onBackToChat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-semibold transition-colors cursor-pointer"
              title="Return to Zai Chat"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Chat</span>
            </button>
          )}

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 leading-tight">
                  Meal Planner
                </h2>
                {plan && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {plan.durationDays} Days &bull; {plan.dietaryPreference}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                Structured multi-day schedule with isolated meal swaps
              </span>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {onOpenRecipeStudio && (
            <button
              onClick={onOpenRecipeStudio}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              title="Open Recipe Studio"
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Recipe Studio</span>
            </button>
          )}

          {/* Prominent Action: Create Grocery List */}
          <button
            onClick={handleCreateGroceryList}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs hover:shadow-sm cursor-pointer transition-all"
            title="Collect all meal plan ingredients into Grocery List"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Create Grocery List</span>
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Notification Banner */}
          <AnimatePresence>
            {notice && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-3.5 flex items-center justify-between text-xs text-emerald-950 shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">{notice}</span>
                </div>
                <button
                  onClick={() => setNotice(null)}
                  className="p-1 text-emerald-700 hover:text-emerald-900 rounded-lg hover:bg-emerald-100 cursor-pointer"
                  aria-label="Dismiss alert"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Planner Controls Bar */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Calibrate Your Schedule
                </h3>
                <p className="text-xs text-slate-500">
                  Select your schedule duration, dietary requirements, and daily caloric goals.
                </p>
              </div>

              <button
                onClick={() => handleGenerateNewPlan()}
                disabled={isGenerating}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-bold shadow-xs cursor-pointer transition-all self-start sm:self-auto shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Generating Plan...' : 'Generate Meal Plan'}</span>
              </button>
            </div>

            {/* Selectors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* 1. Duration Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Duration
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {DURATION_OPTIONS.map((days) => (
                    <button
                      type="button"
                      key={days}
                      onClick={() => {
                        setDurationDays(days);
                        handleGenerateNewPlan(days, dietaryPreference, calorieTarget);
                      }}
                      className={`py-2 px-2.5 rounded-xl font-bold border transition-all text-center cursor-pointer ${
                        durationDays === days
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {days} Days
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Dietary Preference Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Dietary Preference
                </label>
                <select
                  value={dietaryPreference}
                  onChange={(e) => {
                    const pref = e.target.value;
                    setDietaryPreference(pref);
                    handleGenerateNewPlan(durationDays, pref, calorieTarget);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                >
                  {DIETARY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Calorie Target */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Optional Calorie Target
                </label>
                <select
                  value={calorieTarget}
                  onChange={(e) => {
                    const cals = Number(e.target.value);
                    setCalorieTarget(cals);
                    handleGenerateNewPlan(durationDays, dietaryPreference, cals);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                >
                  {CALORIE_OPTIONS.map((cal) => (
                    <option key={cal.value} value={cal.value}>
                      {cal.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Day Tabs Bar */}
          {plan?.days?.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedDayTab('All')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedDayTab === 'All'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                All Days ({plan.days.length})
              </button>
              {plan.days.map((d) => (
                <button
                  type="button"
                  key={d.day}
                  onClick={() => setSelectedDayTab(String(d.day))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedDayTab === String(d.day)
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/40'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}

          {/* Days Grid / List */}
          <div className="space-y-5">
            {visibleDays.map((dayPlan) => (
              <DayPlanSection
                key={dayPlan.day}
                dayPlan={dayPlan}
                onViewRecipe={(recipe) => setViewingRecipe(recipe)}
                onRegenerateMeal={handleRegenerateMeal}
                onReplaceMeal={handleOpenReplaceModal}
                onRemoveMeal={handleRemoveMeal}
                onAddMeal={handleOpenReplaceModal}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Modal 1: Recipe Full Detail View */}
      {viewingRecipe && (
        <RecipeDetailModal
          recipe={viewingRecipe}
          onClose={() => setViewingRecipe(null)}
          onAddToGroceryList={() => {
            handleCreateGroceryList();
            setViewingRecipe(null);
          }}
        />
      )}

      {/* Modal 2: Meal Replace Selector */}
      {replaceModalState && (
        <MealReplaceModal
          isOpen={true}
          onClose={() => setReplaceModalState(null)}
          dayNumber={replaceModalState.dayNumber}
          mealType={replaceModalState.mealType}
          dietaryPreference={plan?.dietaryPreference}
          currentRecipeId={replaceModalState.currentRecipeId}
          onSelectRecipe={handleApplyReplacement}
        />
      )}
    </div>
  );
}

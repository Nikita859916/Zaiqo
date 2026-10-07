import React from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Flame,
  RefreshCw,
  Trash2,
  Eye,
  Plus,
  Repeat,
  Sparkles,
} from 'lucide-react';

const MEAL_THEMES = {
  breakfast: {
    label: 'Breakfast',
    badge: 'bg-amber-100/80 text-amber-900 border-amber-200/80',
    dot: 'bg-amber-500',
  },
  lunch: {
    label: 'Lunch',
    badge: 'bg-teal-100/80 text-teal-900 border-teal-200/80',
    dot: 'bg-teal-500',
  },
  dinner: {
    label: 'Dinner',
    badge: 'bg-emerald-100/80 text-emerald-900 border-emerald-200/80',
    dot: 'bg-emerald-500',
  },
  snack: {
    label: 'Snack',
    badge: 'bg-purple-100/80 text-purple-900 border-purple-200/80',
    dot: 'bg-purple-500',
  },
};

export default function MealSlotCard({
  mealType = 'breakfast',
  recipe,
  onViewRecipe,
  onRegenerateMeal,
  onReplaceMeal,
  onRemoveMeal,
  onAddMeal,
}) {
  const theme = MEAL_THEMES[mealType.toLowerCase()] || MEAL_THEMES.breakfast;

  // Empty slot state
  if (!recipe) {
    return (
      <div className="h-full min-h-[170px] rounded-2xl border-2 border-dashed border-slate-200/90 hover:border-emerald-300 bg-slate-50/50 hover:bg-emerald-50/30 transition-all p-4 flex flex-col items-center justify-center text-center space-y-2">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${theme.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
          {theme.label}
        </span>
        <p className="text-xs text-slate-400 font-medium">Slot is currently open</p>
        <button
          type="button"
          onClick={onAddMeal}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:text-emerald-700 text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-600" />
          <span>Add {theme.label}</span>
        </button>
      </div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className="group h-full bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-200 hover:shadow-xs p-4 flex flex-col justify-between space-y-3 transition-all"
    >
      {/* Top Header: Badge & Quick Actions */}
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${theme.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
          {theme.label}
        </span>

        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          {/* Regenerate Single Meal */}
          <button
            type="button"
            onClick={onRegenerateMeal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
            title="Regenerate only this meal"
            aria-label={`Regenerate ${theme.label}`}
          >
            <RefreshCw className="w-3 h-3" />
          </button>

          {/* Replace Meal from options */}
          <button
            type="button"
            onClick={onReplaceMeal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Choose a different recipe for this slot"
            aria-label={`Replace ${theme.label}`}
          >
            <Repeat className="w-3 h-3" />
          </button>

          {/* Remove Meal */}
          <button
            type="button"
            onClick={onRemoveMeal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Remove meal"
            aria-label={`Remove ${theme.label}`}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Middle: Recipe Title (Clickable) */}
      <div className="space-y-1">
        <h4
          onClick={onViewRecipe}
          className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors cursor-pointer line-clamp-2 leading-snug"
          title="Click to view recipe details"
        >
          {recipe.name}
        </h4>
        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
          {recipe.description}
        </p>
      </div>

      {/* Bottom: Metrics & View CTA */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-medium">
            <Clock className="w-3 h-3 text-emerald-600" />
            <span>Time: {recipe.totalTime || recipe.cookTime || '15 min'}</span>
          </span>
          {recipe.nutrition?.calories && (
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <Flame className="w-3 h-3 text-amber-500" />
              <span>{recipe.nutrition.calories} kcal</span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onViewRecipe}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
          title="View Recipe Details"
        >
          <Eye className="w-3 h-3" />
          <span>View</span>
        </button>
      </div>
    </motion.div>
  );
}

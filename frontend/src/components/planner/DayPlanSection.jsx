import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Flame, Sparkles } from 'lucide-react';
import MealSlotCard from './MealSlotCard';

export default function DayPlanSection({
  dayPlan,
  onViewRecipe,
  onRegenerateMeal,
  onReplaceMeal,
  onRemoveMeal,
  onAddMeal,
}) {
  if (!dayPlan) return null;

  const { day, label, totalCalories, meals = {} } = dayPlan;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden"
    >
      {/* Day Header Bar */}
      <div className="bg-slate-50/80 border-b border-slate-200/80 px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
            {day}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight">
              {label || `Day ${day}`}
            </h3>
            <span className="text-[10px] text-slate-500 font-medium">
              4 Calibrated Nutrient Slots
            </span>
          </div>
        </div>

        {totalCalories > 0 && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>{totalCalories} kcal total</span>
          </div>
        )}
      </div>

      {/* Meals Grid (4 Slots: Breakfast, Lunch, Dinner, Snack) */}
      <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Breakfast */}
        <MealSlotCard
          mealType="breakfast"
          recipe={meals.breakfast}
          onViewRecipe={() => meals.breakfast && onViewRecipe(meals.breakfast)}
          onRegenerateMeal={() => onRegenerateMeal(day, 'breakfast')}
          onReplaceMeal={() => onReplaceMeal(day, 'breakfast')}
          onRemoveMeal={() => onRemoveMeal(day, 'breakfast')}
          onAddMeal={() => onAddMeal(day, 'breakfast')}
        />

        {/* Lunch */}
        <MealSlotCard
          mealType="lunch"
          recipe={meals.lunch}
          onViewRecipe={() => meals.lunch && onViewRecipe(meals.lunch)}
          onRegenerateMeal={() => onRegenerateMeal(day, 'lunch')}
          onReplaceMeal={() => onReplaceMeal(day, 'lunch')}
          onRemoveMeal={() => onRemoveMeal(day, 'lunch')}
          onAddMeal={() => onAddMeal(day, 'lunch')}
        />

        {/* Dinner */}
        <MealSlotCard
          mealType="dinner"
          recipe={meals.dinner}
          onViewRecipe={() => meals.dinner && onViewRecipe(meals.dinner)}
          onRegenerateMeal={() => onRegenerateMeal(day, 'dinner')}
          onReplaceMeal={() => onReplaceMeal(day, 'dinner')}
          onRemoveMeal={() => onRemoveMeal(day, 'dinner')}
          onAddMeal={() => onAddMeal(day, 'dinner')}
        />

        {/* Snack */}
        <MealSlotCard
          mealType="snack"
          recipe={meals.snack}
          onViewRecipe={() => meals.snack && onViewRecipe(meals.snack)}
          onRegenerateMeal={() => onRegenerateMeal(day, 'snack')}
          onReplaceMeal={() => onReplaceMeal(day, 'snack')}
          onRemoveMeal={() => onRemoveMeal(day, 'snack')}
          onAddMeal={() => onAddMeal(day, 'snack')}
        />
      </div>
    </motion.div>
  );
}

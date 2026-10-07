import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Clock,
  Flame,
  Users,
  ChefHat,
  Layers,
  ListOrdered,
  ShoppingCart,
  Bot,
} from 'lucide-react';

export default function RecipeDetailModal({
  recipe,
  onClose,
  onAddToGroceryList,
}) {
  if (!recipe) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
                <ChefHat className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  {recipe.mealType || 'Recipe Detail'}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-1">
                  {recipe.name}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
            {/* Zai Recommendation Note if present */}
            {recipe.zaiNote && (
              <div className="bg-emerald-50/80 border border-emerald-200/70 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-emerald-950">
                <Bot className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>{recipe.zaiNote}</span>
              </div>
            )}

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {recipe.description}
            </p>

            {/* Quick Metrics Bar */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 font-medium py-2 px-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Time: {recipe.totalTime || recipe.cookTime || '15 mins'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Calories: {recipe.nutrition?.calories || 380} kcal</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-teal-600" />
                <span>{recipe.servings || 1} Serving</span>
              </span>
            </div>

            {/* Nutrition Highlights */}
            {recipe.nutrition && (
              <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                <div className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <span className="block text-[10px] text-slate-500">Protein</span>
                  <span className="font-bold text-emerald-800">{recipe.nutrition.protein || '20g'}</span>
                </div>
                <div className="p-2 rounded-xl bg-teal-50/60 border border-teal-100">
                  <span className="block text-[10px] text-slate-500">Carbs</span>
                  <span className="font-bold text-teal-800">{recipe.nutrition.carbohydrates || '30g'}</span>
                </div>
                <div className="p-2 rounded-xl bg-amber-50/60 border border-amber-100">
                  <span className="block text-[10px] text-slate-500">Fats</span>
                  <span className="font-bold text-amber-800">{recipe.nutrition.fats || '14g'}</span>
                </div>
              </div>
            )}

            {/* Ingredients */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ingredients</span>
              </h4>
              <div className="bg-slate-50/80 rounded-2xl border border-slate-200/70 divide-y divide-slate-100 text-xs">
                {recipe.ingredients?.map((ing, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5">
                    <span className="text-slate-800 font-medium">{ing.item}</span>
                    <span className="text-slate-500 font-semibold">{ing.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            {recipe.instructions && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <ListOrdered className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Preparation Instructions</span>
                </h4>
                <div className="space-y-2 text-xs text-slate-700">
                  {recipe.instructions.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Close
            </button>

            {onAddToGroceryList && (
              <button
                type="button"
                onClick={() => {
                  onAddToGroceryList(recipe);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Add to Grocery List</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

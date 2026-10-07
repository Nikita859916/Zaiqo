import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Repeat,
  Check,
  Clock,
  Flame,
  Plus,
} from 'lucide-react';
import { getAvailableMealsForSlot } from '../../services/mealPlannerService';

export default function MealReplaceModal({
  isOpen,
  onClose,
  dayNumber,
  mealType,
  dietaryPreference,
  currentRecipeId,
  onSelectRecipe,
}) {
  const [customName, setCustomName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  if (!isOpen) return null;

  const candidates = getAvailableMealsForSlot(mealType, dietaryPreference);

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const customRecipe = {
      id: `custom_${Date.now()}`,
      name: customName.trim(),
      description: `Custom ${mealType} addition selected for Day ${dayNumber}.`,
      mealType: mealType.charAt(0).toUpperCase() + mealType.slice(1),
      dietaryPreferences: [dietaryPreference || 'No Preference'],
      totalTime: '15 mins',
      cookTime: '15 mins',
      nutrition: { calories: 350, protein: '20g', carbohydrates: '30g', fats: '12g' },
      ingredients: [{ item: customName.trim(), quantity: '1 portion' }],
      instructions: ['Prepared according to custom recipe specification.'],
    };

    onSelectRecipe(customRecipe);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
                <Repeat className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Select {mealType?.charAt(0).toUpperCase() + mealType?.slice(1)} Replacement
                </h3>
                <span className="text-[10px] text-slate-500 font-medium">
                  Day {dayNumber} &bull; Matched to {dietaryPreference || 'No Preference'}
                </span>
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

          {/* Body: Candidate options */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Available chef-curated options
            </span>

            <div className="space-y-2.5">
              {candidates.map((cand) => {
                const isCurrent = cand.id === currentRecipeId;
                return (
                  <div
                    key={cand.id}
                    onClick={() => {
                      onSelectRecipe(cand);
                      onClose();
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isCurrent
                        ? 'bg-emerald-50/60 border-emerald-300'
                        : 'bg-white border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/20'
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {cand.name}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {cand.description}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium pt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          <span>{cand.totalTime || cand.cookTime}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-amber-500" />
                          <span>{cand.nutrition?.calories} kcal</span>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 text-xs font-semibold transition-colors shrink-0 cursor-pointer"
                    >
                      {isCurrent ? 'Keep' : 'Select'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Custom Manual Meal Input Option */}
            <div className="pt-2">
              {!showCustomInput ? (
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  className="w-full py-2.5 px-4 rounded-xl border border-dashed border-slate-300 hover:border-emerald-400 text-slate-600 hover:text-emerald-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Enter a custom recipe name</span>
                </button>
              ) : (
                <form onSubmit={handleCustomSubmit} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Custom Meal Name
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Scrambled eggs on sourdough"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 shadow-2xs"
                    required
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCustomInput(false)}
                      className="px-3 py-1 rounded-xl text-slate-500 hover:bg-slate-200 text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      Add Custom Meal
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

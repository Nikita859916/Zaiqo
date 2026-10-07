import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Sparkles,
  ChefHat,
  SlidersHorizontal,
  Bot,
  RefreshCw,
  ShoppingCart,
  Calendar,
} from 'lucide-react';
import RecipeRequestForm from './RecipeRequestForm';
import RecipeCard from './RecipeCard';
import { generateMockRecipe } from '../../services/recipeService';

export default function RecipeStudio({
  initialParams = {},
  onBackToChat,
  onOpenGroceryList,
  onAddToGroceryList,
  onOpenMealPlanner,
}) {
  const [recipe, setRecipe] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastParams, setLastParams] = useState(initialParams);

  // Auto-generate recipe on mount if initial parameters were passed from chat
  useEffect(() => {
    if (initialParams && (initialParams.ingredients?.length || initialParams.mealType || initialParams.dietaryPreference)) {
      handleGenerate(initialParams);
    }
  }, []);

  const handleGenerate = async (params) => {
    setIsLoading(true);
    setLastParams(params);
    try {
      const generated = await generateMockRecipe(params);
      setRecipe(generated);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAnother = () => {
    setRecipe(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#FAFAF9] rounded-3xl overflow-hidden">
      {/* Studio Header Bar */}
      <div className="bg-white border-b border-slate-200/90 px-4 sm:px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToChat}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-600"
            title="Return to Zai Chat conversation"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Chat</span>
          </button>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
              <ChefHat className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                Recipe Studio
              </h2>
              <span className="text-[10px] text-emerald-700 font-medium">
                Personalized AI Culinary Synthesis
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenMealPlanner && (
            <button
              onClick={onOpenMealPlanner}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-semibold transition-colors cursor-pointer"
              title="Open Meal Planner"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Meal Planner</span>
            </button>
          )}

          {onOpenGroceryList && (
            <button
              onClick={onOpenGroceryList}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-semibold transition-colors cursor-pointer"
              title="Open Grocery List"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Grocery List</span>
            </button>
          )}

          {recipe && (
            <button
              onClick={handleGenerateAnother}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Modify Request</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Studio Workspace */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <AnimatePresence mode="wait">
            {!recipe ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6"
              >
                <div className="space-y-1 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      Recipe Generator
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                    Customize your culinary request
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600">
                    Select your preferred meal parameters or enter ingredients available in your pantry.
                  </p>
                </div>

                <RecipeRequestForm
                  initialParams={lastParams}
                  onGenerate={handleGenerate}
                  isLoading={isLoading}
                />
              </motion.div>
            ) : (
              <motion.div
                key="card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <RecipeCard
                  recipe={recipe}
                  onGenerateAnother={handleGenerateAnother}
                  onAddToGroceryList={onAddToGroceryList}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

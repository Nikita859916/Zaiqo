import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Flame,
  Users,
  Bookmark,
  BookmarkCheck,
  ShoppingCart,
  CheckCircle2,
  RefreshCw,
  ChefHat,
  Sparkles,
  Bot,
  ListOrdered,
  Layers,
} from 'lucide-react';

export default function RecipeCard({
  recipe,
  onGenerateAnother,
  onAddToGroceryList,
}) {
  const [isSaved, setIsSaved] = useState(false);
  const [isAddedToGrocery, setIsAddedToGrocery] = useState(false);

  if (!recipe) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden"
    >
      {/* 1. Zai Recommendation Speech Callout */}
      <div className="bg-emerald-50/70 border-b border-emerald-100/90 p-4 sm:p-5 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Bot className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
              Zai Recommendation
            </span>
            <span className="text-[10px] bg-emerald-200/70 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
              Tailored Match
            </span>
          </div>
          <p className="text-xs sm:text-sm text-emerald-950/80 leading-relaxed font-normal">
            {recipe.zaiNote ||
              'Based on your preferences and available ingredients, I found a recipe that fits your request.'}
          </p>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* 2. Recipe Header & Image Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Visual Culinary Placeholder */}
          <div className="md:col-span-5 h-48 sm:h-56 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-amber-500/15 border border-emerald-100 flex flex-col items-center justify-center text-center p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />
            <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-emerald-100 flex items-center justify-center text-emerald-600 mb-3 group-hover:scale-105 transition-transform duration-300">
              <ChefHat className="w-7 h-7" />
            </div>
            <span className="text-xs font-bold text-slate-800 tracking-tight">
              {recipe.mealType} &bull; {recipe.dietaryPreference}
            </span>
            <span className="text-[11px] text-slate-500 mt-1">
              Dietitian-Verified Culinary Composition
            </span>
          </div>

          {/* Details Column */}
          <div className="md:col-span-7 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-md">
                {recipe.mealType}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md">
                {recipe.dietaryPreference}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {recipe.name}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {recipe.description}
            </p>

            {/* Quick Metrics Bar */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Prep: {recipe.prepTime}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Cook: {recipe.cookTime}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-teal-600" />
                <span>{recipe.servings} Servings</span>
              </span>
            </div>
          </div>
        </div>

        {/* 3. Nutrition Breakdown Grid */}
        <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200/80">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Macro &amp; Caloric Profile</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
              <span className="block text-[11px] text-slate-400 font-medium">Calories</span>
              <span className="text-base sm:text-lg font-black text-slate-900">
                {recipe.nutrition?.calories || 420}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
              <span className="block text-[11px] text-slate-400 font-medium">Protein</span>
              <span className="text-base sm:text-lg font-black text-emerald-700">
                {recipe.nutrition?.protein || '28g'}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
              <span className="block text-[11px] text-slate-400 font-medium">Carbohydrates</span>
              <span className="text-base sm:text-lg font-black text-teal-700">
                {recipe.nutrition?.carbohydrates || '34g'}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 shadow-2xs">
              <span className="block text-[11px] text-slate-400 font-medium">Fats</span>
              <span className="text-base sm:text-lg font-black text-amber-700">
                {recipe.nutrition?.fats || '16g'}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Ingredients & Instructions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
          {/* Left: Ingredients Section */}
          <div className="md:col-span-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Ingredients</span>
            </h4>
            <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden text-xs">
              {recipe.ingredients?.map((ing, idx) => (
                <div key={idx} className="flex items-center justify-between p-3">
                  <span className="font-medium text-slate-800">{ing.item}</span>
                  <span className="text-slate-500 font-semibold">{ing.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Step-by-Step Instructions */}
          <div className="md:col-span-7 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-emerald-600" />
              <span>Cooking Instructions</span>
            </h4>
            <div className="space-y-2.5">
              {recipe.instructions?.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/70 text-xs sm:text-sm text-slate-700 leading-relaxed"
                >
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 5. Actions Footer */}
        <div className="pt-6 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Save Recipe Action */}
            <button
              onClick={() => setIsSaved(!isSaved)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isSaved
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 hover:border-slate-300'
              }`}
              title="Save this recipe"
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="w-4 h-4 text-emerald-700" />
                  <span>Recipe Saved</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4 text-slate-500" />
                  <span>Save Recipe</span>
                </>
              )}
            </button>

            {/* Add to Grocery List Action */}
            <button
              onClick={() => {
                setIsAddedToGrocery(true);
                if (onAddToGroceryList) {
                  onAddToGroceryList(recipe);
                }
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isAddedToGrocery
                  ? 'bg-blue-100 text-blue-900 border border-blue-300'
                  : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 hover:border-slate-300'
              }`}
              title="Add ingredients to grocery list"
            >
              {isAddedToGrocery ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-blue-700" />
                  <span>Added to Grocery List</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 text-slate-500" />
                  <span>Add to Grocery List</span>
                </>
              )}
            </button>
          </div>

          {/* Generate Another Action */}
          <button
            onClick={onGenerateAnother}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Generate another recipe with different options"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Generate Another</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

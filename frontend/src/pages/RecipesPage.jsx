import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppNavigation from '../components/AppNavigation';
import RecipeStudio from '../components/recipe/RecipeStudio';
import { addIngredientsFromRecipe } from '../services/groceryService';

export default function RecipesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [initialParams, setInitialParams] = useState(null);

  useEffect(() => {
    const mealType = searchParams.get('mealType') || 'Dinner';
    const dietaryPreference = searchParams.get('dietaryPreference') || 'Vegetarian';
    const ingredients = searchParams.get('ingredients')
      ? searchParams.get('ingredients').split(',').map((s) => s.trim())
      : [];

    setInitialParams({
      mealType,
      dietaryPreference,
      ingredients,
    });
  }, [searchParams]);

  const handleBackToChat = () => {
    navigate('/zai');
  };

  const handleOpenGroceryList = () => {
    navigate('/grocery');
  };

  const handleAddToGroceryList = (recipe) => {
    if (recipe && recipe.ingredients) {
      addIngredientsFromRecipe(recipe.ingredients, recipe.title);
      navigate('/grocery');
    }
  };

  const handleOpenMealPlanner = () => {
    navigate('/meal-planner');
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Top Unified Navigation */}
      <AppNavigation />

      {/* Main Recipe Studio Space */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden min-h-[calc(100vh-140px)]">
          <RecipeStudio
            initialParams={initialParams || {}}
            onBackToChat={handleBackToChat}
            onOpenGroceryList={handleOpenGroceryList}
            onAddToGroceryList={handleAddToGroceryList}
            onOpenMealPlanner={handleOpenMealPlanner}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200/60">
        <span>Zaiqo &bull; Personalized AI-Powered Food &amp; Wellness Platform</span>
      </footer>
    </div>
  );
}

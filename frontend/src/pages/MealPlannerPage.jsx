import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import AppNavigation from '../components/AppNavigation';
import ZaiCharacter from '../components/ZaiCharacter';
import MealPlannerView from '../components/planner/MealPlannerView';

export default function MealPlannerPage() {
  const navigate = useNavigate();
  const [isZaiHappy, setIsZaiHappy] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Top Unified Navigation */}
      <AppNavigation />

      {/* Main Page Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Zai Interactive Companion */}
        <aside className="lg:col-span-4 bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm flex flex-col items-center text-center lg:sticky lg:top-20">
          <div className="relative w-full flex flex-col items-center">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none -z-10" />

            <div className="py-2">
              <ZaiCharacter
                isThinking={false}
                isHappy={isZaiHappy}
                compact={false}
                showBadges={true}
                onClick={() => {
                  setIsZaiHappy(true);
                  setTimeout(() => setIsZaiHappy(false), 700);
                }}
              />
            </div>

            <div className="mt-4 space-y-1">
              <h2 className="text-lg font-bold text-slate-900">Zai</h2>
              <p className="text-xs text-slate-500 font-medium">
                Metabolic Calendar Optimization
              </p>
            </div>

            <p className="text-xs text-slate-600 mt-2 max-w-xs leading-relaxed">
              I balance your macro intake across 3, 5, or 7 days with zero-waste grocery synchronization.
            </p>

            <div className="mt-4 pt-4 border-t border-slate-100 w-full flex items-center justify-center gap-4 text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Multi-Day Balance
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Single Swaps
              </span>
            </div>
          </div>
        </aside>

        {/* Right Column: Meal Planner Workspace */}
        <section className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-sm h-[650px] sm:h-[700px] overflow-hidden">
          <MealPlannerView
            onBackToChat={() => navigate('/zai')}
            onOpenRecipeStudio={() => navigate('/recipes')}
            onOpenGroceryList={() => navigate('/grocery')}
          />
        </section>
      </main>
    </div>
  );
}

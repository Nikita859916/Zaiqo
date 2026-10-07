import React from 'react';
import { ChefHat, Heart, Sparkles, Send } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200/80 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-100">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <ChefHat className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                Zaiqo
              </span>
            </div>
            <p className="text-sm text-slate-600 max-w-sm leading-relaxed">
              Your personalized AI culinary and wellness companion. Simplifying nutrition, reducing kitchen waste, and making every meal a celebration of health.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Crafted for conscious food lovers worldwide</span>
            </div>
          </div>

          {/* Links Col 1: Platform */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Platform
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <a href="#features" className="hover:text-emerald-600 transition-colors">
                  Personalized Recipes
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-emerald-600 transition-colors">
                  Smart Grocery Lists
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-emerald-600 transition-colors">
                  Meal Planner
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-emerald-600 transition-colors">
                  Pantry Intelligence
                </a>
              </li>
            </ul>
          </div>

          {/* Links Col 2: Wellness */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Wellness
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <a href="#how-it-works" className="hover:text-emerald-600 transition-colors">
                  Nutritional Philosophy
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-emerald-600 transition-colors">
                  Circadian Eating
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-emerald-600 transition-colors">
                  Macro Precision
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-emerald-600 transition-colors">
                  Zero-Waste Mindset
                </a>
              </li>
            </ul>
          </div>

          {/* Links Col 3: Newsletter */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Stay Inspired
            </h4>
            <p className="text-xs text-slate-600">
              Get weekly AI-curated recipes and metabolic wellness insights.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-1.5">
              <input
                type="email"
                placeholder="Enter your email"
                aria-label="Email address for weekly culinary updates"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <button
                type="submit"
                className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-600"
                title="Subscribe"
                aria-label="Subscribe to newsletter"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <p>&copy; {new Date().getFullYear()} Zaiqo Technologies. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#privacy" className="hover:text-slate-700 transition-colors">
              Privacy Policy
            </a>
            <a href="#terms" className="hover:text-slate-700 transition-colors">
              Terms of Service
            </a>
            <a href="#cookies" className="hover:text-slate-700 transition-colors">
              Cookie Settings
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

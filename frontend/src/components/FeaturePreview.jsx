import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  UtensilsCrossed,
  ShoppingCart,
  CalendarDays,
  HeartPulse,
  Check,
  ChevronRight,
  Clock,
  Flame,
  Award
} from 'lucide-react';

const features = [
  {
    id: 'recipes',
    category: 'Dynamic Culinary AI',
    title: 'Personalized Recipes',
    description:
      'Transform what is already in your pantry into gourmet, dietitian-tailored meals matched to your tastes and dietary limits.',
    icon: UtensilsCrossed,
    color: 'emerald',
    gradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    renderPreview: () => (
      <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200/80 space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800">Avocado Citrus Salmon Bowl</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
            96% Pantry Match
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-emerald-600" /> 18 Mins
          </span>
          <span className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-500" /> 480 kcal
          </span>
          <span className="font-medium text-emerald-700">38g Protein</span>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] text-slate-600 font-medium">
            Wild Salmon
          </span>
          <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] text-slate-600 font-medium">
            Ripe Avocado
          </span>
          <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] text-slate-600 font-medium">
            Quinoa
          </span>
        </div>
      </div>
    ),
  },
  {
    id: 'grocery',
    category: 'Pantry Intelligence',
    title: 'Smart Grocery Lists',
    description:
      'Auto-generates aisles-organized shopping lists from your meal plans, automatically eliminating items you already have in stock.',
    icon: ShoppingCart,
    color: 'blue',
    gradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
    iconBg: 'bg-blue-50 text-blue-600 border-blue-200',
    renderPreview: () => (
      <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200/80 space-y-2 text-xs">
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
          <span className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
            Organized by Aisle
          </span>
          <span className="text-[10px] font-bold text-blue-600">3 of 5 Checked</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-500 flex items-center justify-center text-white">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
              <span className="line-through text-slate-400">Baby Spinach (Organic)</span>
            </div>
            <span className="text-[10px] text-slate-400">Produce</span>
          </div>
          <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border border-slate-300" />
              <span className="font-medium text-slate-700">Greek Yogurt (0% fat)</span>
            </div>
            <span className="text-[10px] text-slate-500">Dairy</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'meal-planning',
    category: 'Macro Alignment',
    title: 'Adaptive Meal Planning',
    description:
      'Effortless 7-day calendars dynamically calibrated to your daily physical activity, workout recovery, and metabolic schedule.',
    icon: CalendarDays,
    color: 'teal',
    gradient: 'from-teal-500/10 via-teal-500/5 to-transparent',
    iconBg: 'bg-teal-50 text-teal-600 border-teal-200',
    renderPreview: () => (
      <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200/80 space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800">Weekly Target Progress</span>
          <span className="font-bold text-teal-700">92% on track</span>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
          <div className="bg-emerald-500 h-full w-[45%]" title="Protein" />
          <div className="bg-teal-400 h-full w-[35%]" title="Complex Carbs" />
          <div className="bg-amber-400 h-full w-[20%]" title="Healthy Fats" />
        </div>
        <div className="grid grid-cols-3 gap-1 text-center text-[10px] text-slate-600 pt-0.5">
          <div className="bg-white p-1 rounded border border-slate-100 font-medium">
            P: <span className="text-emerald-700 font-bold">135g</span>
          </div>
          <div className="bg-white p-1 rounded border border-slate-100 font-medium">
            C: <span className="text-teal-700 font-bold">160g</span>
          </div>
          <div className="bg-white p-1 rounded border border-slate-100 font-medium">
            F: <span className="text-amber-700 font-bold">50g</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'wellness',
    category: 'Holistic Longevity',
    title: 'Food & Wellness Guidance',
    description:
      'Continuous metabolic insights that connect your nutrition to energy levels, gut microbiome health, and circadian rhythms.',
    icon: HeartPulse,
    color: 'amber',
    gradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
    iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
    renderPreview: () => (
      <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200/80 space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-full bg-amber-100 text-amber-700">
            <Award className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-800">Circadian Digestion Peak</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-snug">
          "Consuming complex carbs earlier today supported steady serotonin synthesis. Optimal dinner window: 7:00 PM."
        </p>
        <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200/60 font-medium text-slate-500">
          <span>Gut Balance Score: <strong className="text-emerald-700">9.4/10</strong></span>
          <span className="text-amber-600">Anti-Inflammatory</span>
        </div>
      </div>
    ),
  },
];

export default function FeaturePreview() {
  return (
    <section id="features" className="py-20 sm:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Intelligent Ecosystem</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            Every bite, tailored for your body and rhythm
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Say goodbye to recipe fatigue, wasted produce, and guesswork nutrition. Zaiqo handles the thinking so you enjoy the food.
          </p>
        </div>

        {/* 4 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.45, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] },
                }}
                viewport={{ once: true, margin: '-50px' }}
                whileHover={{
                  y: -10,
                  transition: {
                    type: 'spring',
                    stiffness: 300,
                    damping: 15,
                    mass: 0.6,
                  },
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 18,
                  mass: 0.6,
                }}
                className="group relative rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm hover:shadow-xl hover:border-slate-300 transition-[border-color,box-shadow] duration-300 flex flex-col justify-between"
              >
                {/* Background soft accent gradient on hover */}
                <div
                  className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
                />

                <div className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs ${feature.iconBg}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {feature.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>

                {/* In-Card Interactive Preview Component */}
                <div className="relative mt-6 pt-4 border-t border-slate-100">
                  {feature.renderPreview()}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

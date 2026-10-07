import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, SlidersHorizontal, Cpu, HeartHandshake, CheckCircle2 } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Share Your Routine & Pantry',
    description:
      'Set dietary preferences, allergies, fitness objectives, or list the ingredients currently sitting in your fridge.',
    icon: SlidersHorizontal,
    highlight: 'Zero guesswork',
    badge: 'Step 1: Input',
  },
  {
    number: '02',
    title: 'Zaiqo Balances Your Plate',
    description:
      'Our culinary intelligence engine synthesizes dietitian-verified nutrition with chef flavors, eliminating food waste automatically.',
    icon: Cpu,
    highlight: 'Real-time calibration',
    badge: 'Step 2: AI Intelligence',
  },
  {
    number: '03',
    title: 'Cook Joyfully & Feel Extraordinary',
    description:
      'Receive organized grocery aisles, intuitive step-by-step cooking steps, and track your all-day metabolic vitality.',
    icon: HeartHandshake,
    highlight: 'Sustainable wellness',
    badge: 'Step 3: Outcome',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-gradient-to-b from-white via-emerald-50/20 to-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Effortless Journey</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            How Zaiqo Transforms Your Kitchen Routine
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            From the moment you open the fridge to your final bite, Zaiqo guides your nourishment with precision and warmth.
          </p>
        </div>

        {/* 3 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.4, delay: idx * 0.15, ease: [0.16, 1, 0.3, 1] },
                }}
                viewport={{ once: true }}
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
                className="relative bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-lg transition-[border-color,box-shadow] duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Step Header */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-3xl font-black text-emerald-600/30">
                      {step.number}
                    </span>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>

                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                    {step.badge}
                  </span>

                  <h3 className="text-xl font-bold text-slate-900 mt-4 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>{step.highlight}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

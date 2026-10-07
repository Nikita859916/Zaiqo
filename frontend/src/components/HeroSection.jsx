import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, ShieldCheck, Utensils, Zap, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AICompanion from './AICompanion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const badgeItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export default function HeroSection() {
  const { isAuthenticated } = useAuth();
  return (
    <section
      id="home"
      className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 lg:pt-40 lg:pb-28 overflow-hidden"
      aria-label="Hero Section"
    >
      {/* Background ambient lighting - strictly constrained to prevent horizontal overflow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[560px] pointer-events-none -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-10 left-6 sm:left-12 w-72 sm:w-96 h-72 sm:h-96 bg-emerald-200/35 rounded-full blur-3xl opacity-70" />
        <div className="absolute top-16 right-6 sm:right-12 w-80 sm:w-[28rem] h-80 sm:h-[28rem] bg-teal-200/30 rounded-full blur-3xl opacity-60" />
        <div className="absolute top-44 left-1/3 w-64 sm:w-80 h-64 sm:h-80 bg-amber-100/40 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Headlines & CTA */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-7 text-center lg:text-left space-y-6 sm:space-y-8"
          >
            {/* Announcement Pill */}
            <motion.div variants={itemVariants} className="inline-block">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-emerald-200/90 shadow-xs text-xs font-semibold text-emerald-900 backdrop-blur-sm">
                <span className="flex h-2 w-2 relative" aria-hidden="true">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Meet Zaiqo 1.0</span>
                <span className="text-slate-300" aria-hidden="true">&bull;</span>
                <span className="text-slate-600 font-normal">Your Intelligent Food &amp; Wellness Companion</span>
              </div>
            </motion.div>

            {/* Main Headline */}
            <motion.div variants={itemVariants} className="space-y-3.5">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.14]">
                Eat with clarity.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700">
                  Cook with joy.
                </span>{' '}
                Thrive effortlessly.
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Zaiqo learns your dietary goals, pantry ingredients, and wellness routine to curate personalized chef-crafted recipes and smart grocery plans in seconds.
              </p>
            </motion.div>

            {/* CTAs with Framer Motion polished interactions */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-1"
            >
              <motion.div
                whileHover={{ scale: 1.025, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <Link
                  to={isAuthenticated ? '/dashboard' : '/signup'}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 shadow-md shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-600/35 transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-600 focus-visible:outline-offset-2 group"
                >
                  <span>{isAuthenticated ? 'Go to Dashboard' : 'Get Started Free'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
              </motion.div>

              <motion.a
                href="#how-it-works"
                whileHover={{ scale: 1.025, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 hover:border-slate-300 shadow-xs hover:shadow-sm transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-600 focus-visible:outline-offset-2 group"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <Play className="w-3 h-3 text-emerald-600 fill-emerald-600 translate-x-[1px]" />
                </div>
                <span>See How It Works</span>
              </motion.a>
            </motion.div>

            {/* Trust and Feature Micro-Badges */}
            <motion.div
              variants={itemVariants}
              className="pt-4 border-t border-slate-200/70 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs text-slate-700"
            >
              <motion.div
                variants={badgeItemVariants}
                whileHover={{ y: -1 }}
                className="flex items-center gap-2 bg-white/70 sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-lg border border-slate-200/50 sm:border-0"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">Dietitian-Approved Logic</span>
              </motion.div>

              <motion.div
                variants={badgeItemVariants}
                whileHover={{ y: -1 }}
                className="flex items-center gap-2 bg-white/70 sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-lg border border-slate-200/50 sm:border-0"
              >
                <Utensils className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">Zero Food-Waste Mindset</span>
              </motion.div>

              <motion.div
                variants={badgeItemVariants}
                whileHover={{ y: -1 }}
                className="flex items-center gap-2 bg-white/70 sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-lg border border-slate-200/50 sm:border-0"
              >
                <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">Micro &amp; Macro Precision</span>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right Column: AI Companion Showcase with smooth entrance */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 flex justify-center lg:justify-end"
          >
            <AICompanion />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

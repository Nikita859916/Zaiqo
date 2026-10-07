import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function WellnessCTA() {
  const { isAuthenticated } = useAuth();

  return (
    <section id="get-started" className="py-16 sm:py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-8 sm:p-14 overflow-hidden shadow-2xl border border-emerald-900/40">
          {/* Ambient lighting inside banner */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-3xl space-y-6 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ready whenever you are</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Transform your relationship with food today.
            </h2>

            <p className="text-slate-300 text-base sm:text-lg max-w-xl">
              Experience the warmth and intelligence of Zaiqo. No restrictive diets, no confusion — just delicious vitality.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <motion.div
                whileHover={{ scale: 1.025, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <Link
                  to={isAuthenticated ? '/dashboard' : '/signup'}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
                >
                  <span>{isAuthenticated ? 'Go to Dashboard' : 'Get Started with Zaiqo'}</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </Link>
              </motion.div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                <span>Free for culinary explorers &bull; No card required</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

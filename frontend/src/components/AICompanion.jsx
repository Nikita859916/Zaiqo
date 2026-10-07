import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Flame, Salad, RefreshCw, CheckCircle2, ChevronRight, MessageSquare, ArrowRight } from 'lucide-react';

const companionPrompts = [
  {
    category: "Pantry Intelligence",
    greeting: "Hi, I'm Zai",
    subtext: "What are we cooking today? Show me your fridge ingredients.",
    badge: "Ready to assist",
    suggestion: "High protein dinner under 25 mins",
  },
  {
    category: "Zero-Waste Cooking",
    greeting: "Pantry check time! 🥑",
    subtext: "Let's rescue what's in your crisper before it expires.",
    badge: "Zero-waste mode",
    suggestion: "Leftover spinach & chickpeas",
  },
  {
    category: "Metabolic Vitality",
    greeting: "Tracking your energy today 🌿",
    subtext: "Calibrating dinner for steady glucose and deep restful sleep.",
    badge: "Circadian sync",
    suggestion: "Post-workout recovery bowl",
  },
  {
    category: "Smart Meal Prep",
    greeting: "Weekly plan ready 🍱",
    subtext: "Your ingredients are organized by supermarket aisle.",
    badge: "3 of 5 prepped",
    suggestion: "Batch prep 3 lunches in 45 mins",
  },
];

export default function AICompanion() {
  const navigate = useNavigate();
  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isHappy, setIsHappy] = useState(false);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [isRotatingIcon, setIsRotatingIcon] = useState(false);

  // Natural blinking & occasional double-blink loop
  useEffect(() => {
    let timeoutId;
    const blinkRoutine = () => {
      setIsBlinking(true);
      timeoutId = setTimeout(() => {
        setIsBlinking(false);
        // 25% chance of an immediate quick double blink
        if (Math.random() < 0.25) {
          setTimeout(() => {
            setIsBlinking(true);
            setTimeout(() => setIsBlinking(false), 120);
          }, 140);
        }
      }, 160);
    };

    const intervalId = setInterval(blinkRoutine, 3600);
    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, []);

  // Subtle intelligent eye tracking & glancing behavior
  useEffect(() => {
    const glanceDirections = [
      { x: 0, y: 0 },
      { x: 2.5, y: -1 },
      { x: -2.5, y: 0 },
      { x: 0, y: 1 },
      { x: 1.5, y: 1.5 },
      { x: 0, y: 0 },
    ];

    let glanceStep = 0;
    const glanceInterval = setInterval(() => {
      glanceStep = (glanceStep + 1) % glanceDirections.length;
      setEyeOffset(glanceDirections[glanceStep]);
    }, 2800);

    return () => clearInterval(glanceInterval);
  }, []);

  const handleNextPrompt = useCallback(() => {
    setIsRotatingIcon(true);
    setIsHappy(true);
    setActivePromptIndex((prev) => (prev + 1) % companionPrompts.length);
    setTimeout(() => setIsHappy(false), 650);
    setTimeout(() => setIsRotatingIcon(false), 400);
  }, []);

  const currentPrompt = companionPrompts[activePromptIndex];

  return (
    <div
      className="relative w-full max-w-sm sm:max-w-md mx-auto flex flex-col items-center select-none"
      role="region"
      aria-label="Interactive Zaiqo AI Culinary Companion"
    >
      {/* Background ambient aura glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-80 sm:h-80 bg-gradient-to-tr from-emerald-400/20 via-teal-300/20 to-amber-200/20 rounded-full blur-3xl pointer-events-none -z-10"
        aria-hidden="true"
      />

      {/* AI Speech Bubble & Dynamic Conversation Card */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full mb-6 z-20"
      >
        <div className="relative bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-xl shadow-emerald-950/5 border border-emerald-100/90 transition-all hover:border-emerald-200">
          {/* Header pill */}
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                AI Kitchen Companion
              </span>
              <span className="text-slate-300">&bull;</span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                {currentPrompt.category}
              </span>
            </div>

            <motion.button
              onClick={handleNextPrompt}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors focus-visible:outline-2 focus-visible:outline-emerald-600 cursor-pointer"
              title="Cycle to next recipe inspiration"
              aria-label="Cycle conversation prompt"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 transition-transform duration-300 ${
                  isRotatingIcon ? 'rotate-180 text-emerald-600' : ''
                }`}
              />
            </motion.button>
          </div>

          {/* Animated Text Content */}
          <div aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePromptIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {currentPrompt.greeting}
                  </h4>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    {currentPrompt.badge}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                  {currentPrompt.subtext}
                </p>

                {/* Interactive Suggestion Chip & Ask Zai Action */}
                <div className="pt-2 space-y-2">
                  <motion.button
                    onClick={() => navigate('/zai', { state: { initialPrompt: currentPrompt.suggestion } })}
                    whileHover={{ scale: 1.015, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full group/chip flex items-center justify-between text-left text-[11px] font-semibold text-emerald-800 bg-emerald-50/90 hover:bg-emerald-100/80 border border-emerald-200/70 hover:border-emerald-300 px-3 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-600"
                    title="Ask Zai this prompt"
                    aria-label={`Ask Zai: ${currentPrompt.suggestion}`}
                  >
                    <div className="flex items-center gap-1.5 truncate pr-2">
                      <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="text-slate-600 font-medium">Try:</span>
                      <span className="truncate text-emerald-900">"{currentPrompt.suggestion}"</span>
                    </div>

                    <div className="shrink-0 flex items-center">
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-600 group-hover/chip:translate-x-0.5 transition-transform" />
                    </div>
                  </motion.button>

                  <motion.button
                    onClick={() => navigate('/zai')}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-600"
                    title="Open Zai Chat"
                    aria-label="Ask Zai"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Ask Zai</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                  </motion.button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots Indicator for prompt slides */}
          <div className="flex items-center justify-center gap-1.5 pt-3 mt-1 border-t border-slate-100/70">
            {companionPrompts.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setActivePromptIndex(i);
                  setIsHappy(true);
                  setTimeout(() => setIsHappy(false), 500);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activePromptIndex === i
                    ? 'w-5 bg-emerald-500'
                    : 'w-1.5 bg-slate-200 hover:bg-slate-300'
                }`}
                aria-label={`Jump to prompt ${i + 1}`}
              />
            ))}
          </div>

          {/* Speech Bubble Arrow Indicator */}
          <div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r border-b border-emerald-100/90"
            aria-hidden="true"
          />
        </div>
      </motion.div>

      {/* Visual Connector Wave between speech card and companion antenna */}
      <div className="relative -mt-4 mb-1 flex flex-col items-center pointer-events-none z-10" aria-hidden="true">
        <motion.div
          animate={{
            opacity: [0.3, 0.8, 0.3],
            scaleY: [0.9, 1.1, 0.9],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-0.5 h-5 bg-gradient-to-b from-emerald-400 to-emerald-500/30 rounded-full"
        />
        <motion.div
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-2 h-2 rounded-full bg-emerald-400/40 -mt-1 blur-[1px]"
        />
      </div>

      {/* AI Companion Visual Character */}
      <motion.div
        animate={{
          y: [-7, 7, -7],
          rotate: [-0.8, 0.8, -0.8],
          scale: [1, 1.012, 1],
        }}
        transition={{
          duration: 4.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        whileHover={{ scale: 1.025 }}
        whileTap={{ scale: 0.98 }}
        className="relative flex items-center justify-center cursor-pointer group"
        onClick={handleNextPrompt}
        title="Click Zaiqo to interact"
        tabIndex={0}
        role="button"
        aria-label="Interact with Zaiqo to get next culinary inspiration"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleNextPrompt();
          }
        }}
      >
        {/* Orbiting Badge 1: Fresh Nutrients */}
        <motion.div
          animate={{
            y: [-4, 4, -4],
            x: [3, -3, 3],
          }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-3 -left-3 sm:-left-7 z-20 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-2xl shadow-lg shadow-emerald-950/10 border border-emerald-100 flex items-center gap-1.5"
        >
          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
            <Salad className="w-3 h-3 text-emerald-700" />
          </div>
          <span className="text-[10px] font-bold text-slate-800 tracking-tight">Fresh Nutrients</span>
        </motion.div>

        {/* Orbiting Badge 2: Precision Macros */}
        <motion.div
          animate={{
            y: [5, -5, 5],
            x: [-3, 3, -3],
          }}
          transition={{ duration: 4.1, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-2 -right-3 sm:-right-7 z-20 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-2xl shadow-lg shadow-amber-950/10 border border-amber-100 flex items-center gap-1.5"
        >
          <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
            <Flame className="w-3 h-3 text-amber-600" />
          </div>
          <span className="text-[10px] font-bold text-slate-800 tracking-tight">Precision Macros</span>
        </motion.div>

        {/* Character Base Sphere */}
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-gradient-to-b from-white via-slate-50 to-emerald-50/80 p-2 shadow-2xl shadow-emerald-950/15 border-4 border-white flex items-center justify-center transition-all group-hover:shadow-emerald-600/20">
          {/* Subtle rim light accent */}
          <div className="absolute inset-1 rounded-full border border-emerald-200/60 pointer-events-none" />

          {/* Left Ear Node (Acoustic Sensor) */}
          <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-8 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center shadow-md">
            <div className="w-1.5 h-4 bg-emerald-400/80 rounded-full shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          </div>

          {/* Right Ear Node (Acoustic Sensor) */}
          <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-8 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center shadow-md">
            <div className="w-1.5 h-4 bg-emerald-400/80 rounded-full shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          </div>

          {/* Sprout / Antenna on Head with glowing beacon */}
          <motion.div
            animate={{
              rotate: [-3, 5, -3],
            }}
            transition={{
              duration: 2.6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute -top-7 flex flex-col items-center"
          >
            {/* Stem */}
            <div className="w-2.5 h-6 bg-emerald-600 rounded-full shadow-xs" />
            {/* Sensor bulb / sprout leaf */}
            <div className="relative w-6 h-4 bg-emerald-500 rounded-full -mt-2 shadow-md shadow-emerald-500/40 flex items-center justify-center">
              <motion.div
                animate={{
                  opacity: [0.6, 1, 0.6],
                  scale: [0.9, 1.15, 0.9],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="w-2 h-2 rounded-full bg-emerald-200 shadow-[0_0_8px_rgba(167,243,208,1)]"
              />
            </div>
          </motion.div>

          {/* Cute Robot / Companion Face Visor */}
          <div className="relative w-40 h-32 sm:w-44 sm:h-36 rounded-[2.5rem] bg-slate-900 p-4 shadow-inner flex flex-col items-center justify-between border-2 border-slate-800/90 overflow-hidden">
            {/* Visor Glare / Glass Reflection */}
            <div className="absolute top-1.5 left-5 right-5 h-3 rounded-full bg-gradient-to-r from-white/20 via-white/10 to-transparent blur-[0.5px] pointer-events-none" />

            {/* Subtle visor grid line / intelligent tech texture */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/20 via-transparent to-transparent pointer-events-none" />

            {/* Eyes Row */}
            <div className="w-full flex items-center justify-around px-2 pt-6 z-10">
              {/* Left Eye */}
              <div className="relative flex flex-col items-center">
                <motion.div
                  animate={{
                    scaleY: isBlinking ? 0.08 : isHappy ? 0.45 : 1,
                    scaleX: isHappy ? 1.15 : 1,
                    x: eyeOffset.x,
                    y: eyeOffset.y,
                  }}
                  transition={{
                    scaleY: { duration: 0.12 },
                    x: { duration: 0.45, ease: 'easeOut' },
                    y: { duration: 0.45, ease: 'easeOut' },
                  }}
                  className="relative flex items-center justify-center"
                >
                  {/* Left Eyelashes - refined, delicate, naturally curved */}
                  <svg
                    className="absolute -top-1.5 -left-2 sm:-top-2 sm:-left-2.5 w-3.5 h-3.5 sm:w-4 sm:h-4 pointer-events-none z-20 overflow-visible drop-shadow-[0_0_3px_rgba(52,211,153,0.7)]"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    {/* Outer corner lash: slightly longer with an elegant upward sweep */}
                    <path
                      d="M13 12C9.5 11 6.5 8.5 3 5"
                      stroke="#34D399"
                      strokeWidth="1.25"
                      strokeLinecap="round"
                    />
                    {/* Upper contour lash: shorter, delicate, following the natural eye curve */}
                    <path
                      d="M13.5 8.5C11 7 8.5 5 6.5 3"
                      stroke="#34D399"
                      strokeWidth="1.05"
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Eye Capsule */}
                  <div className="w-5 h-7 sm:w-6 sm:h-8 rounded-full bg-gradient-to-b from-emerald-300 via-emerald-400 to-teal-400 shadow-[0_0_16px_rgba(52,211,153,0.95)] flex items-center justify-center relative overflow-hidden">
                    {/* Intelligent Specular Sparkle Highlight */}
                    <motion.div
                      animate={{
                        x: eyeOffset.x * 0.4,
                        y: eyeOffset.y * 0.4,
                      }}
                      transition={{ duration: 0.45, ease: 'easeOut' }}
                      className="w-2 h-2 rounded-full bg-white self-start ml-1 mt-1 shadow-xs"
                    />
                    {/* Lower pupil reflection */}
                    <div className="absolute bottom-1 right-1.5 w-1 h-1 rounded-full bg-white/70" />
                  </div>
                </motion.div>
                {/* Soft Warm Blush */}
                <div className="w-4 h-1.5 rounded-full bg-rose-400/40 mt-1.5 blur-[1px]" />
              </div>

              {/* Center Intelligent Sensor Node */}
              <div className="relative flex flex-col items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse" />
                <div className="w-1 h-1 rounded-full bg-teal-400/50" />
              </div>

              {/* Right Eye */}
              <div className="relative flex flex-col items-center">
                <motion.div
                  animate={{
                    scaleY: isBlinking ? 0.08 : isHappy ? 0.45 : 1,
                    scaleX: isHappy ? 1.15 : 1,
                    x: eyeOffset.x,
                    y: eyeOffset.y,
                  }}
                  transition={{
                    scaleY: { duration: 0.12 },
                    x: { duration: 0.45, ease: 'easeOut' },
                    y: { duration: 0.45, ease: 'easeOut' },
                  }}
                  className="relative flex items-center justify-center"
                >
                  {/* Right Eyelashes - refined, delicate, naturally curved */}
                  <svg
                    className="absolute -top-1.5 -right-2 sm:-top-2 sm:-right-2.5 w-3.5 h-3.5 sm:w-4 sm:h-4 pointer-events-none z-20 overflow-visible drop-shadow-[0_0_3px_rgba(52,211,153,0.7)]"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    {/* Outer corner lash: slightly longer with an elegant upward sweep */}
                    <path
                      d="M3 12C6.5 11 9.5 8.5 13 5"
                      stroke="#34D399"
                      strokeWidth="1.25"
                      strokeLinecap="round"
                    />
                    {/* Upper contour lash: shorter, delicate, following the natural eye curve */}
                    <path
                      d="M2.5 8.5C5 7 7.5 5 9.5 3"
                      stroke="#34D399"
                      strokeWidth="1.05"
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Eye Capsule */}
                  <div className="w-5 h-7 sm:w-6 sm:h-8 rounded-full bg-gradient-to-b from-emerald-300 via-emerald-400 to-teal-400 shadow-[0_0_16px_rgba(52,211,153,0.95)] flex items-center justify-center relative overflow-hidden">
                    <motion.div
                      animate={{
                        x: eyeOffset.x * 0.4,
                        y: eyeOffset.y * 0.4,
                      }}
                      transition={{ duration: 0.45, ease: 'easeOut' }}
                      className="w-2 h-2 rounded-full bg-white self-start ml-1 mt-1 shadow-xs"
                    />
                    <div className="absolute bottom-1 right-1.5 w-1 h-1 rounded-full bg-white/70" />
                  </div>
                </motion.div>
                {/* Soft Warm Blush */}
                <div className="w-4 h-1.5 rounded-full bg-rose-400/40 mt-1.5 blur-[1px]" />
              </div>
            </div>

            {/* Sleek Intelligent Smile */}
            <div className="pb-2.5 z-10">
              <motion.svg
                width="30"
                height="12"
                viewBox="0 0 30 12"
                fill="none"
                animate={{
                  scale: isHappy ? 1.2 : 1,
                }}
                transition={{ duration: 0.25 }}
              >
                <path
                  d={isHappy ? "M3 2C8 10 22 10 27 2" : "M3 3C8 9 22 9 27 3"}
                  stroke="#34D399"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </motion.svg>
            </div>
          </div>

          {/* Chest Heart / Core Badge */}
          <motion.div
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.4 }}
            className="absolute -bottom-2 w-9 h-9 rounded-full bg-white shadow-md border-2 border-emerald-200 flex items-center justify-center"
          >
            <Sparkles className="w-4 h-4 text-emerald-600 fill-emerald-100" />
          </motion.div>
        </div>
      </motion.div>

      {/* Floating base ambient ground shadow */}
      <motion.div
        animate={{
          scaleX: [1, 0.85, 1],
          scaleY: [1, 0.8, 1],
          opacity: [0.35, 0.2, 0.35],
        }}
        transition={{
          duration: 4.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="w-36 h-3.5 bg-emerald-950/20 rounded-full blur-md mt-6 pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}

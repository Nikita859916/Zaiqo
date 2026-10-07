import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Salad, Flame } from 'lucide-react';

export default function ZaiCharacter({
  isThinking = false,
  isHappy: isHappyProp = false,
  compact = false,
  showBadges = true,
  onClick,
}) {
  const [isBlinking, setIsBlinking] = useState(false);
  const [internalHappy, setInternalHappy] = useState(false);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });

  const isHappy = isHappyProp || internalHappy;

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

  const handleClick = (e) => {
    setInternalHappy(true);
    setTimeout(() => setInternalHappy(false), 650);
    if (onClick) onClick(e);
  };

  return (
    <motion.div
      animate={{
        y: isThinking ? [-4, 4, -4] : [-7, 7, -7],
        rotate: isThinking ? [-1.2, 1.2, -1.2] : [-0.8, 0.8, -0.8],
        scale: [1, 1.012, 1],
      }}
      transition={{
        duration: isThinking ? 2.2 : 4.8,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      whileHover={{ scale: 1.025 }}
      whileTap={{ scale: 0.98 }}
      className={`relative flex items-center justify-center cursor-pointer select-none group ${
        compact ? 'scale-90 sm:scale-95' : ''
      }`}
      onClick={handleClick}
      title="Click Zai to interact"
      tabIndex={0}
      role="button"
      aria-label="Interact with Zai AI Companion"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e);
        }
      }}
    >
      {/* Orbiting Badge 1: Fresh Nutrients */}
      {showBadges && (
        <motion.div
          animate={{
            y: [-4, 4, -4],
            x: [3, -3, 3],
          }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-3 -left-3 sm:-left-7 z-20 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-2xl shadow-lg shadow-emerald-950/10 border border-emerald-100 flex items-center gap-1.5 pointer-events-none"
        >
          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
            <Salad className="w-3 h-3 text-emerald-700" />
          </div>
          <span className="text-[10px] font-bold text-slate-800 tracking-tight">Fresh Nutrients</span>
        </motion.div>
      )}

      {/* Orbiting Badge 2: Precision Macros */}
      {showBadges && (
        <motion.div
          animate={{
            y: [5, -5, 5],
            x: [-3, 3, -3],
          }}
          transition={{ duration: 4.1, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-2 -right-3 sm:-right-7 z-20 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-2xl shadow-lg shadow-amber-950/10 border border-amber-100 flex items-center gap-1.5 pointer-events-none"
        >
          <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
            <Flame className="w-3 h-3 text-amber-600" />
          </div>
          <span className="text-[10px] font-bold text-slate-800 tracking-tight">Precision Macros</span>
        </motion.div>
      )}

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
            rotate: isThinking ? [-8, 8, -8] : [-3, 5, -3],
          }}
          transition={{
            duration: isThinking ? 1.4 : 2.6,
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
                opacity: isThinking ? [0.4, 1, 0.4] : [0.6, 1, 0.6],
                scale: isThinking ? [0.8, 1.3, 0.8] : [0.9, 1.15, 0.9],
              }}
              transition={{
                duration: isThinking ? 1 : 2,
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
                d={isHappy ? 'M3 2C8 10 22 10 27 2' : 'M3 3C8 9 22 9 27 3'}
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
  );
}

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button, cn } from '@/app/components/ui/Shared';
import { RatingStars } from '@/app/components/ui/RatingStars';
import { useLanguage } from '@/app/context/LanguageContext';
import { Cloud, Sparkles } from 'lucide-react';

interface RatingViewProps {
  rating: number;
  setRating: (r: number) => void;
  onNext: () => void;
  onBack: () => void;
}

// Background & Theme Config
const THEMES = {
  0: { // Default / Initial
    bg: 'bg-white',
    gradient: 'from-slate-50 to-white',
    text: 'text-slate-800',
    button: 'bg-slate-900 text-white hover:bg-slate-800',
    stepBadge: 'bg-slate-100 text-slate-500 border-slate-200'
  },
  1: { // Very Negative
    bg: 'bg-slate-900',
    gradient: 'from-slate-800 to-slate-950',
    text: 'text-slate-200',
    button: 'bg-white text-slate-900 hover:bg-slate-200',
    stepBadge: 'bg-slate-800 text-slate-400 border-slate-700'
  },
  2: { // Negative
    bg: 'bg-slate-100',
    gradient: 'from-gray-100 to-slate-200',
    text: 'text-slate-700',
    button: 'bg-slate-800 text-white hover:bg-slate-700',
    stepBadge: 'bg-white/50 text-slate-600 border-slate-200'
  },
  3: { // Neutral
    bg: 'bg-white',
    gradient: 'from-gray-50 to-white',
    text: 'text-slate-800',
    button: 'bg-slate-900 text-white hover:bg-slate-800',
    stepBadge: 'bg-slate-100 text-slate-500 border-slate-200'
  },
  4: { // Positive
    bg: 'bg-amber-50',
    gradient: 'from-orange-50 to-amber-50',
    text: 'text-amber-900',
    button: 'bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-200/50',
    stepBadge: 'bg-amber-100/50 text-amber-700 border-amber-200'
  },
  5: { // Very Positive
    bg: 'bg-yellow-50',
    gradient: 'from-yellow-50 via-orange-50 to-pink-50',
    text: 'text-orange-950',
    button: 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:shadow-xl hover:scale-[1.02] shadow-lg shadow-orange-200',
    stepBadge: 'bg-white/60 text-orange-700 border-orange-200'
  }
};

// Floating Element Component
const FloatingElement = ({ children, delay = 0, duration = 4, x = 0, y = 0, scale = 1 }: any) => (
  <motion.div
    initial={{ opacity: 0, y: y + 20, x }}
    animate={{ 
      opacity: 1, 
      y: [y, y - 15, y], 
      x: [x, x + 5, x] 
    }}
    exit={{ opacity: 0, scale: 0 }}
    transition={{ 
      opacity: { duration: 0.5, delay },
      y: { duration, repeat: Infinity, ease: "easeInOut" },
      x: { duration: duration * 1.5, repeat: Infinity, ease: "easeInOut" }
    }}
    className="absolute pointer-events-none select-none"
    style={{ scale }}
  >
    {children}
  </motion.div>
);

// Confetti Particle
const Confetti = ({ color, delay, x }: { color: string, delay: number, x: string }) => (
  <motion.div
    initial={{ y: -20, opacity: 1, x }}
    animate={{ y: '120vh', rotate: 360, opacity: 0 }}
    transition={{ duration: 2.5, delay, ease: 'linear' }}
    className={cn("absolute top-0 w-3 h-3 rounded-sm pointer-events-none z-20", color)}
  />
);

export function RatingView({ rating, setRating, onNext, onBack }: RatingViewProps) {
  const { t } = useLanguage();
  const theme = THEMES[rating as keyof typeof THEMES] || THEMES[0];

  const getEmojis = (r: number) => {
    switch(r) {
      case 1: return ['😞', '☁️', '😔', '🌧️'];
      case 2: return ['🙁', '☁️', '😐'];
      case 3: return [];
      case 4: return ['🙂', '✨', '😄'];
      case 5: return ['🤩', '🎉', '💖', '⭐'];
      default: return [];
    }
  };

  const activeEmojis = useMemo(() => getEmojis(rating), [rating]);

  return (
    <motion.div 
      className={cn(
        "flex-1 flex flex-col relative overflow-hidden transition-colors duration-700 ease-in-out",
        theme.bg
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Dynamic Background Gradient */}
      <motion.div 
        className={cn("absolute inset-0 bg-gradient-to-br transition-all duration-700", theme.gradient)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      {/* Atmospheric Effects Layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <AnimatePresence mode="wait">
          {rating === 1 && (
            <motion.div
              key="mood-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              {/* Dark Clouds - 1 Star */}
              <FloatingElement x={-50} y={80} duration={8} delay={0.2}><Cloud size={120} className="text-slate-800/50 fill-slate-800/20 blur-sm" /></FloatingElement>
              <FloatingElement x={280} y={40} duration={10} delay={0.5}><Cloud size={80} className="text-slate-800/40 fill-slate-800/20 blur-md" /></FloatingElement>
              <FloatingElement x={100} y={-40} duration={9} delay={0}><Cloud size={160} className="text-slate-800/30 fill-slate-800/10 blur-xl" /></FloatingElement>
            </motion.div>
          )}
          
          {rating === 2 && (
            <motion.div
              key="mood-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
               {/* Lighter Clouds - 2 Stars */}
               <FloatingElement x={20} y={50} duration={6}><Cloud size={60} className="text-slate-300 fill-slate-200 blur-sm" /></FloatingElement>
               <FloatingElement x={300} y={120} duration={8} delay={0.3}><Cloud size={90} className="text-slate-300/50 fill-slate-200/50 blur-md" /></FloatingElement>
            </motion.div>
          )}

          {rating === 4 && (
            <motion.div key="mood-4">
              {/* Warm Glows - 4 Stars */}
              <FloatingElement x={40} y={80} duration={5}><div className="w-24 h-24 rounded-full bg-orange-200/20 blur-2xl" /></FloatingElement>
              <FloatingElement x={300} y={180} duration={7} delay={0.2}><div className="w-32 h-32 rounded-full bg-yellow-200/20 blur-2xl" /></FloatingElement>
            </motion.div>
          )}

          {rating === 5 && (
            <motion.div key="mood-5">
              {/* Confetti & Sparkles - 5 Stars */}
              {[...Array(12)].map((_, i) => (
                <Confetti 
                  key={i} 
                  color={['bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-yellow-400', 'bg-purple-400'][i % 5]} 
                  delay={i * 0.1} 
                  x={`${Math.random() * 100}%`} 
                />
              ))}
              <FloatingElement x={50} y={80} duration={4}><Sparkles className="text-yellow-400/60" size={32} /></FloatingElement>
              <FloatingElement x={320} y={120} duration={5} delay={0.5}><Sparkles className="text-orange-400/50" size={48} /></FloatingElement>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Emojis - Positioned Higher to avoid overlap with bottom controls */}
        <AnimatePresence>
          {activeEmojis.map((emoji, i) => (
            <FloatingElement 
              key={`${rating}-${i}`} 
              x={i % 2 === 0 ? 40 + (i * 50) : 280 - (i * 40)} 
              y={120 + (i * 50)} 
              delay={i * 0.3}
              duration={5 + i}
            >
              <span className="text-4xl drop-shadow-sm filter backdrop-blur-[1px]">{emoji}</span>
            </FloatingElement>
          ))}
        </AnimatePresence>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col p-6 h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={onBack} 
            className="text-slate-400 text-sm font-medium hover:text-slate-600 transition-colors p-2 -ml-2 hover:bg-black/5 rounded-lg"
          >
            {t('back')}
          </button>
          <span className={cn("text-xs font-semibold px-3 py-1 rounded-full border backdrop-blur-md transition-colors", theme.stepBadge)}>
            {t('step_1')}
          </span>
          <div className="w-8" /> 
        </div>

        {/* Center Content - Shifted Significantly Lower to separate from animations */}
        <div className="flex-1 flex flex-col items-center justify-center pt-32 pb-8">
          <motion.div
            layout
            className="flex flex-col items-center w-full max-w-sm gap-6"
          >
            {/* 1. Star Rating (Primary Interaction) */}
            <div className="w-full bg-white/10 backdrop-blur-sm rounded-3xl p-4 border border-white/20 shadow-xl shadow-black/5">
              <RatingStars 
                rating={rating} 
                setRating={(r) => {
                  setRating(r);
                }} 
              />
            </div>

            {/* 2. Rating Question Text (Bold, below stars) */}
            <motion.h2 
              className={cn("text-xl font-bold text-center transition-colors duration-300 max-w-[280px]", theme.text)}
              key="question"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {t('rating_question')}
            </motion.h2>

          </motion.div>
        </div>

        {/* Footer / Continue Button */}
        <motion.div layout className="w-full mt-auto">
          <Button 
            variant="ghost" 
            size="lg" 
            className={cn(
              "w-full rounded-2xl transition-all duration-300 font-semibold text-lg h-14",
              theme.button,
              rating === 0 && "opacity-50 cursor-not-allowed grayscale"
            )}
            onClick={onNext}
            disabled={rating === 0}
          >
            {t('continue')}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}

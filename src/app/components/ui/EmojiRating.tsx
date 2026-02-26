import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/app/components/ui/Shared';

interface EmojiRatingProps {
  rating: number;
  setRating: (rating: number) => void;
  readOnly?: boolean;
}

const emojis = [
  { value: 1, char: '😠', label: 'Angry' },
  { value: 2, char: '🙁', label: 'Unhappy' },
  { value: 3, char: '😐', label: 'Neutral' },
  { value: 4, char: '🙂', label: 'Satisfied' },
  { value: 5, char: '🤩', label: 'Excellent' },
];

export function EmojiRating({ rating, setRating, readOnly = false }: EmojiRatingProps) {
  return (
    <div className="flex justify-between items-center w-full max-w-xs mx-auto px-2">
      {emojis.map((item) => {
        const isSelected = rating === item.value;
        const isSibling = Math.abs(rating - item.value) === 1;
        
        return (
          <motion.button
            key={item.value}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && setRating(item.value)}
            className={cn(
              "relative flex items-center justify-center w-12 h-12 rounded-full text-4xl select-none focus:outline-none",
              readOnly ? "cursor-default" : "cursor-pointer"
            )}
            initial={false}
            animate={{
              scale: isSelected ? 1.5 : isSibling ? 1.1 : 1,
              opacity: rating === 0 ? 1 : isSelected ? 1 : 0.5,
              y: isSelected ? -10 : 0,
              filter: rating === 0 ? 'grayscale(0%)' : isSelected ? 'grayscale(0%)' : 'grayscale(100%)',
            }}
            whileHover={{ 
              scale: 1.6,
              opacity: 1,
              filter: 'grayscale(0%)',
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <span role="img" aria-label={item.label}>{item.char}</span>
            
            {/* Active Indicator Dot */}
            <AnimatePresence>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute -bottom-2 w-1.5 h-1.5 bg-slate-800 rounded-full"
                />
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}

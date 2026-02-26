import React from 'react';
import { Star } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface RatingStarsProps {
  rating: number;
  setRating: (rating: number) => void;
  max?: number;
  readOnly?: boolean;
}

export function RatingStars({ rating, setRating, max = 5, readOnly = false }: RatingStarsProps) {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);

  return (
    <div className="flex gap-2 justify-center py-4">
      {Array.from({ length: max }).map((_, i) => {
        const starValue = i + 1;
        const isFilled = (hoverRating !== null ? hoverRating : rating) >= starValue;

        return (
          <motion.button
            key={i}
            whileTap={{ scale: 0.9 }}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && setRating(starValue)}
            onMouseEnter={() => !readOnly && setHoverRating(starValue)}
            onMouseLeave={() => !readOnly && setHoverRating(null)}
            className={cn(
              "p-1 focus:outline-none transition-colors duration-200",
              readOnly ? "cursor-default" : "cursor-pointer"
            )}
          >
            <Star
              size={42}
              className={cn(
                "transition-all duration-300",
                isFilled ? "fill-yellow-400 text-yellow-400" : "fill-slate-100 text-slate-300"
              )}
              strokeWidth={isFilled ? 0 : 1.5}
            />
          </motion.button>
        );
      })}
    </div>
  );
}

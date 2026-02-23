'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-8',
};

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = 'md',
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);

  const isInteractive = !readonly && !!onChange;
  const displayValue = hoverValue || value;

  return (
    <div
      className="inline-flex items-center gap-0.5"
      role={isInteractive ? 'radiogroup' : 'img'}
      aria-label={
        isInteractive
          ? 'Rating selection'
          : `Rating: ${value} out of 5 stars`
      }
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= displayValue;
        return isInteractive ? (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === value}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
            className={cn(
              'cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm',
              isFilled
                ? 'text-yellow-400'
                : 'text-muted-foreground/30 hover:text-yellow-300'
            )}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(0)}
          >
            <Star
              className={cn(sizeMap[size], isFilled && 'fill-yellow-400')}
            />
          </button>
        ) : (
          <Star
            key={star}
            className={cn(
              sizeMap[size],
              isFilled
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-none text-muted-foreground/30'
            )}
          />
        );
      })}
    </div>
  );
}

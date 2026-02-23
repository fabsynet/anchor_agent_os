'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StarRating } from '@/components/badge/star-rating';
import { StrengthBadges } from '@/components/badge/strength-badges';

interface TestimonialData {
  rating: number;
  content: string;
  authorName: string;
  isAnonymous: boolean;
  strengths: string[];
  createdAt: string;
  isFeatured: boolean;
}

interface TestimonialCardProps {
  testimonial: TestimonialData;
  variant: 'featured' | 'standard';
  accentColor?: string;
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function TestimonialCard({
  testimonial,
  variant,
  accentColor,
}: TestimonialCardProps) {
  const isFeatured = variant === 'featured';

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-5 transition-shadow',
        isFeatured
          ? 'border-2 shadow-md'
          : 'shadow-sm'
      )}
      style={
        isFeatured && accentColor
          ? { borderColor: accentColor }
          : undefined
      }
    >
      {/* Featured label */}
      {isFeatured && (
        <div className="mb-3 flex items-center gap-1.5">
          <Star
            className="size-4"
            style={{ color: accentColor || 'rgb(250 204 21)', fill: accentColor || 'rgb(250 204 21)' }}
          />
          <span
            className="text-xs font-semibold uppercase tracking-wide"
            style={accentColor ? { color: accentColor } : { color: 'rgb(202 138 4)' }}
          >
            Featured Review
          </span>
        </div>
      )}

      {/* Star rating */}
      <div className="mb-3">
        <StarRating value={testimonial.rating} readonly size={isFeatured ? 'md' : 'sm'} />
      </div>

      {/* Content */}
      <p
        className={cn(
          'text-foreground leading-relaxed mb-3',
          isFeatured ? 'text-base' : 'text-sm'
        )}
      >
        &ldquo;{testimonial.content}&rdquo;
      </p>

      {/* Strengths */}
      {testimonial.strengths.length > 0 && (
        <div className="mb-3">
          <StrengthBadges strengths={testimonial.strengths} size="sm" />
        </div>
      )}

      {/* Author and date */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span className="font-medium">
          {testimonial.isAnonymous ? 'Anonymous' : testimonial.authorName}
        </span>
        <span className="text-xs">
          {formatRelativeDate(testimonial.createdAt)}
        </span>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Eye,
  EyeOff,
  Star,
  Trash2,
  Loader2,
  MessageSquareQuote,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';

import type { Testimonial } from '@anchor/shared';
import { MAX_FEATURED_TESTIMONIALS } from '@anchor/shared';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { StarRating } from './star-rating';
import { StrengthBadges } from './strength-badges';

interface TestimonialManagerProps {
  slug: string;
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

function TestimonialCard({
  testimonial,
  onToggleVisibility,
  onToggleFeatured,
  onDelete,
  featuredCount,
}: {
  testimonial: Testimonial;
  onToggleVisibility: (id: string) => void;
  onToggleFeatured: (id: string) => void;
  onDelete: (id: string) => void;
  featuredCount: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = testimonial.content.length > 200;
  const displayContent =
    isLong && !expanded
      ? testimonial.content.slice(0, 200) + '...'
      : testimonial.content;

  return (
    <Card className={testimonial.isVisible ? '' : 'opacity-60'}>
      <CardContent className="space-y-3 pt-4">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-medium">
              {testimonial.isAnonymous ? 'Anonymous' : testimonial.authorName}
            </span>
            <StarRating value={testimonial.rating} readonly size="sm" />
          </div>
          <span className="text-xs text-muted-foreground">
            {formatRelativeDate(testimonial.createdAt)}
          </span>
        </div>

        {/* Content */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {displayContent}
        </p>
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            {expanded ? (
              <>
                Show less <ChevronUp className="size-3" />
              </>
            ) : (
              <>
                Show more <ChevronDown className="size-3" />
              </>
            )}
          </button>
        )}

        {/* Strengths */}
        {testimonial.strengths.length > 0 && (
          <StrengthBadges strengths={testimonial.strengths} size="sm" />
        )}

        {/* Status badges and actions */}
        <div className="flex items-center justify-between border-t pt-3">
          <div className="flex gap-2">
            {testimonial.isFeatured && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                Featured
              </Badge>
            )}
            {!testimonial.isVisible && (
              <Badge variant="secondary" className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                Hidden
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            <TooltipProvider>
              {/* Visibility toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onToggleVisibility(testimonial.id)}
                  >
                    {testimonial.isVisible ? (
                      <Eye className="size-4" />
                    ) : (
                      <EyeOff className="size-4 text-muted-foreground" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {testimonial.isVisible
                    ? 'Hide from badge page'
                    : 'Show on badge page'}
                </TooltipContent>
              </Tooltip>

              {/* Featured toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onToggleFeatured(testimonial.id)}
                    disabled={
                      !testimonial.isFeatured &&
                      !testimonial.isVisible
                    }
                  >
                    {testimonial.isFeatured ? (
                      <Star className="size-4 fill-yellow-400 text-yellow-400" />
                    ) : (
                      <Star className="size-4 text-muted-foreground" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {testimonial.isFeatured
                    ? 'Remove from featured'
                    : featuredCount >= MAX_FEATURED_TESTIMONIALS
                      ? 'Feature (oldest featured will be replaced)'
                      : 'Feature on badge page'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Delete button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this testimonial?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The testimonial from{' '}
                    {testimonial.isAnonymous
                      ? 'an anonymous client'
                      : testimonial.authorName}{' '}
                    will be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(testimonial.id)}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TestimonialManager({ slug }: TestimonialManagerProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTestimonials = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get<{ data: Testimonial[]; count: number }>('/api/badge/testimonials');
      const data = res.data ?? [];
      // Sort: featured first, then by createdAt DESC
      const sorted = [...data].sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setTestimonials(sorted);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load testimonials';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  const handleToggleVisibility = async (id: string) => {
    try {
      await api.patch(`/api/badge/testimonials/${id}/visibility`);
      await fetchTestimonials();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update visibility';
      toast.error(message);
    }
  };

  const handleToggleFeatured = async (id: string) => {
    try {
      const result = await api.patch<{ isFeatured: boolean; unFeaturedId?: string }>(
        `/api/badge/testimonials/${id}/featured`
      );

      // If an old featured was auto-replaced, notify the user
      const featuredCount = testimonials.filter((t) => t.isFeatured).length;
      if (result.isFeatured && featuredCount >= MAX_FEATURED_TESTIMONIALS) {
        toast.info(
          'Maximum 2 featured testimonials. The oldest featured was unfeatured.'
        );
      }

      await fetchTestimonials();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update featured status';
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/badge/testimonials/${id}`);
      toast.success('Testimonial deleted');
      await fetchTestimonials();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete testimonial';
      toast.error(message);
    }
  };

  const featuredCount = testimonials.filter((t) => t.isFeatured).length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold tracking-tight">Testimonials</h2>
        <Badge variant="secondary">{testimonials.length}</Badge>
      </div>

      {testimonials.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquareQuote className="size-12 text-muted-foreground/40 mb-4" />
            <h3 className="font-medium text-lg">No testimonials yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Share your testimonial link with clients to start collecting reviews.
              They will appear here for you to manage.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {testimonials.map((testimonial) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
              onToggleVisibility={handleToggleVisibility}
              onToggleFeatured={handleToggleFeatured}
              onDelete={handleDelete}
              featuredCount={featuredCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}

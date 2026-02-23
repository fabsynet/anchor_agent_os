'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { submitTestimonialSchema } from '@anchor/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { StarRating } from '@/components/badge/star-rating';
import { StrengthPicker } from '@/components/badge/strength-badges';

/**
 * Explicit form values type: z.coerce.number() in Zod v4 produces `unknown`
 * as the input type, which breaks zodResolver type inference. We define the
 * concrete type manually and cast the resolver.
 */
interface TestimonialFormValues {
  authorName: string;
  authorEmail?: string;
  isAnonymous: boolean;
  rating: number;
  content: string;
  strengths: string[];
}

interface TestimonialFormProps {
  slug: string;
  agentName: string;
}

export function TestimonialForm({ slug, agentName }: TestimonialFormProps) {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<TestimonialFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(submitTestimonialSchema) as any,
    defaultValues: {
      authorName: '',
      authorEmail: '',
      isAnonymous: false,
      rating: 0,
      content: '',
      strengths: [],
    },
  });

  const contentValue = form.watch('content') || '';

  const onSubmit = async (data: TestimonialFormValues) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(
        `${apiUrl}/api/public/badge/${slug}/testimonials`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: 'Something went wrong. Please try again.',
        }));
        throw new Error(error.message);
      }

      setSubmitted(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to submit review'
      );
    }
  };

  if (submitted) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex items-center justify-center size-16 rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="size-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-semibold">Thank you for your review!</h2>
          <p className="text-muted-foreground max-w-sm">
            Your testimonial for {agentName} has been submitted and will appear
            on their profile shortly.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Share Your Experience</CardTitle>
        <CardDescription>
          Your honest feedback helps {agentName} serve clients better.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <FormField
              control={form.control}
              name="authorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="authorEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="jane@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Only used to prevent duplicate submissions. Never displayed.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Anonymous toggle */}
            <FormField
              control={form.control}
              name="isAnonymous"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-3">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="mt-0.5 size-4 rounded border-border accent-primary cursor-pointer"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer">
                      Submit anonymously
                    </FormLabel>
                    <FormDescription>
                      Your name won&apos;t be displayed on the testimonial.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Star Rating */}
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating</FormLabel>
                  <FormControl>
                    <StarRating
                      value={field.value || 0}
                      onChange={field.onChange}
                      size="lg"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Strengths */}
            <FormField
              control={form.control}
              name="strengths"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What stood out?</FormLabel>
                  <FormControl>
                    <StrengthPicker
                      selected={field.value || []}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Select up to 5 strengths.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Testimonial Content */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Review</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell others about your experience..."
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <div className="flex items-center justify-between">
                    <FormMessage />
                    <span className="text-xs text-muted-foreground ml-auto">
                      {contentValue.length}/2000
                    </span>
                  </div>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Review'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

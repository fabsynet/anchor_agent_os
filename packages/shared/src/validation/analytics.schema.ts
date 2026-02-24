import { z } from 'zod';

/**
 * Schema for analytics query parameters.
 * Accepts optional date range filtering via ISO date strings.
 */
export const analyticsQuerySchema = z.object({
  startDate: z.string().datetime({ offset: true }).optional(),
  endDate: z.string().datetime({ offset: true }).optional(),
  timeRange: z.enum(['3mo', '6mo', 'ytd', '12mo', 'all']).optional(),
});

export type AnalyticsQueryInput = z.input<typeof analyticsQuerySchema>;

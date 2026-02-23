import { z } from 'zod';

export const createExpenseSchema = z
  .object({
    amount: z.coerce.number().positive('Amount must be positive'),
    category: z.string().min(1, 'Category is required'),
    date: z.coerce.date(),
    description: z.string().optional().or(z.literal('')),
    isRecurring: z.boolean().default(false),
    recurrence: z.enum(['weekly', 'monthly', 'yearly']).optional(),
  })
  .refine(
    (data) => !data.isRecurring || data.recurrence !== undefined,
    {
      message: 'Recurrence frequency is required for recurring expenses',
      path: ['recurrence'],
    },
  );

export const updateExpenseSchema = z
  .object({
    amount: z.coerce.number().positive('Amount must be positive').optional(),
    category: z.string().min(1).optional(),
    date: z.coerce.date().optional(),
    description: z.string().optional().or(z.literal('')),
    isRecurring: z.boolean().optional(),
    recurrence: z.enum(['weekly', 'monthly', 'yearly']).optional(),
  })
  .refine(
    (data) => {
      if (data.isRecurring === true && data.recurrence === undefined) {
        return false;
      }
      return true;
    },
    {
      message: 'Recurrence frequency is required for recurring expenses',
      path: ['recurrence'],
    },
  );

export type CreateExpenseInput = z.input<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.input<typeof updateExpenseSchema>;

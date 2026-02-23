import { z } from 'zod';

const budgetCategorySchema = z.object({
  category: z.string().min(1, 'Category is required'),
  limitAmount: z.coerce.number().positive('Limit must be positive'),
});

export const createBudgetSchema = z.object({
  month: z.number().int().min(1, 'Month must be 1-12').max(12, 'Month must be 1-12'),
  year: z.number().int().min(2020).max(2100),
  totalLimit: z.coerce.number().positive('Total limit must be positive'),
  categories: z.array(budgetCategorySchema).optional().default([]),
});

export const updateBudgetSchema = z.object({
  totalLimit: z.coerce.number().positive('Total limit must be positive').optional(),
  categories: z.array(budgetCategorySchema).optional(),
});

export type CreateBudgetInput = z.input<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.input<typeof updateBudgetSchema>;

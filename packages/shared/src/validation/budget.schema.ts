import { z } from 'zod';

export const createBudgetSchema = z
  .object({
    name: z.string().min(1, 'Budget name is required').max(100),
    totalLimit: z.coerce.number().positive('Total limit must be positive'),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    },
  );

export const updateBudgetSchema = z
  .object({
    name: z.string().min(1, 'Budget name is required').max(100).optional(),
    totalLimit: z.coerce.number().positive('Total limit must be positive').optional(),
    startDate: z.coerce.date().optional().nullable(),
    endDate: z.coerce.date().optional().nullable(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    },
  );

export type CreateBudgetInput = z.input<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.input<typeof updateBudgetSchema>;

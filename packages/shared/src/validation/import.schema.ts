import { z } from 'zod';

/**
 * Schema for validating a single import row (client + policy data).
 */
export const importRowSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  province: z.string().optional().or(z.literal('')),
  postalCode: z.string().optional().or(z.literal('')),
  policyType: z.string().min(1, 'Policy type is required'),
  carrier: z.string().optional().or(z.literal('')),
  policyNumber: z.string().optional().or(z.literal('')),
  premium: z.string().optional().or(z.literal('')),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
  status: z.string().optional().or(z.literal('')),
});

/**
 * Schema for validating a batch of import rows.
 */
export const importBatchSchema = z.object({
  rows: z.array(importRowSchema).min(1, 'At least one row is required').max(5000, 'Maximum 5000 rows per import'),
});

export type ImportRowInput = z.input<typeof importRowSchema>;
export type ImportBatchInput = z.input<typeof importBatchSchema>;

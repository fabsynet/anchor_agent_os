import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional().or(z.literal('')),
  status: z.enum(['todo', 'in_progress', 'waiting', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  dueDate: z.string().optional().or(z.literal('')),
  assigneeId: z.string().uuid().optional().or(z.literal('')),
  clientId: z.string().uuid().optional().or(z.literal('')),
  policyId: z.string().uuid().optional().or(z.literal('')),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().or(z.literal('')),
  status: z.enum(['todo', 'in_progress', 'waiting', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().optional().or(z.literal('')),
  assigneeId: z.string().uuid().optional().or(z.literal('')),
  clientId: z.string().uuid().optional().or(z.literal('')),
  policyId: z.string().uuid().optional().or(z.literal('')),
});

export type CreateTaskInput = z.input<typeof createTaskSchema>;
export type UpdateTaskInput = z.input<typeof updateTaskSchema>;

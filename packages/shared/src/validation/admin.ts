import { z } from 'zod';

export const agencySuspendSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason too long'),
});
export type AgencySuspendInput = z.input<typeof agencySuspendSchema>;

export const agencyUnsuspendSchema = z.object({
  reason: z.string().min(1).max(500).optional(),
});
export type AgencyUnsuspendInput = z.input<typeof agencyUnsuspendSchema>;

export const agencyUpdateLimitsSchema = z.object({
  userCap: z.number().int().min(1).max(50).optional(),
  storageCap: z.number().int().min(100).max(10000).optional(),
});
export type AgencyUpdateLimitsInput = z.input<typeof agencyUpdateLimitsSchema>;

export const userRoleChangeSchema = z.object({
  role: z.enum(['admin', 'agent']),
});
export type UserRoleChangeInput = z.input<typeof userRoleChangeSchema>;

export const userDeactivateSchema = z.object({
  reason: z.string().min(1).max(500).optional(),
});
export type UserDeactivateInput = z.input<typeof userDeactivateSchema>;

export const auditLogQuerySchema = z.object({
  action: z.string().optional(),
  targetType: z.string().optional(),
  superAdminId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});
export type AuditLogQueryInput = z.input<typeof auditLogQuerySchema>;

export const agencyListQuerySchema = z.object({
  search: z.string().optional(),
  isSuspended: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.enum(['name', 'createdAt', 'userCap']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});
export type AgencyListQueryInput = z.input<typeof agencyListQuerySchema>;

export const inviteSuperAdminSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});
export type InviteSuperAdminInput = z.input<typeof inviteSuperAdminSchema>;

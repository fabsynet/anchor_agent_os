import { z } from 'zod';

export const tenantSetupSchema = z.object({
  phone: z.string().optional(),
  address: z.string().optional(),
  province: z.string().optional(),
});

export type TenantSetupInput = z.infer<typeof tenantSetupSchema>;

import { z } from 'zod';

/** Schema for upload metadata (not the file itself -- file comes via FormData) */
export const uploadDocumentSchema = z.object({
  clientId: z.string().uuid(),
  policyId: z.string().uuid().optional(),
  category: z.enum([
    'policy_document', 'application', 'id_license', 'claim_form',
    'proof_of_insurance', 'endorsement', 'cancellation_notice', 'correspondence',
  ]).default('correspondence'),
});

export type UploadDocumentInput = z.input<typeof uploadDocumentSchema>;

export const searchDocumentsSchema = z.object({
  policyId: z.string().uuid().optional(),
  category: z.enum([
    'policy_document', 'application', 'id_license', 'claim_form',
    'proof_of_insurance', 'endorsement', 'cancellation_notice', 'correspondence',
  ]).optional(),
});

export type SearchDocumentsInput = z.input<typeof searchDocumentsSchema>;

export const searchComplianceSchema = z.object({
  clientId: z.string().uuid().optional(),
  type: z.string().optional(),
  userId: z.string().uuid().optional(),
  policyId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(25),
});

export type SearchComplianceInput = z.input<typeof searchComplianceSchema>;

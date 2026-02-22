export type PolicyType =
  | 'auto'
  | 'home'
  | 'life'
  | 'health'
  | 'commercial'
  | 'travel'
  | 'umbrella'
  | 'other';

export type PolicyStatus =
  | 'draft'
  | 'active'
  | 'pending_renewal'
  | 'renewed'
  | 'expired'
  | 'cancelled';

export type PaymentFrequency =
  | 'monthly'
  | 'quarterly'
  | 'semi_annual'
  | 'annual';

/**
 * Full Policy record as returned from the API.
 * Decimal fields (premium, coverageAmount, deductible, brokerCommission) are
 * serialized as strings by Prisma. Use parseFloat() only for display purposes.
 */
export interface Policy {
  id: string;
  tenantId: string;
  clientId: string;
  type: PolicyType;
  /** Free-text type when type is 'other' */
  customType: string | null;
  carrier: string | null;
  policyNumber: string | null;
  /** ISO date string (YYYY-MM-DD) or null */
  startDate: string | null;
  /** ISO date string (YYYY-MM-DD) or null */
  endDate: string | null;
  /** Decimal serialized as string, e.g. "1250.00" */
  premium: string | null;
  /** Decimal serialized as string */
  coverageAmount: string | null;
  /** Decimal serialized as string */
  deductible: string | null;
  paymentFrequency: PaymentFrequency | null;
  /** Decimal serialized as string, percentage e.g. "15.00" */
  brokerCommission: string | null;
  status: PolicyStatus;
  notes: string | null;
  createdById: string;
  /** ISO datetime string */
  createdAt: string;
  /** ISO datetime string */
  updatedAt: string;
}

/**
 * Policy with embedded client info, used for cross-client policy listings.
 */
export interface PolicyWithClient extends Policy {
  client: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

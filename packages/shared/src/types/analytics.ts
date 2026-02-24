/** Time range filter values for analytics queries */
export type TimeRange = '3mo' | '6mo' | 'ytd' | '12mo' | 'all';

/** Policy type breakdown with count and total premium */
export interface PolicyBreakdown {
  type: string;
  count: number;
  totalPremium: number;
}

/** Monthly renewal pipeline data */
export interface RenewalPipelineMonth {
  month: string;
  active: number;
  expiring: number;
  expired: number;
}

/** Cross-sell opportunity for a client with coverage gaps */
export interface CrossSellOpportunity {
  clientId: string;
  clientName: string;
  activeTypes: string[];
  gaps: string[];
  fewPolicies: boolean;
}

/** Client statistics summary */
export interface ClientStats {
  totalClients: number;
  activeClients: number;
  leads: number;
  newThisPeriod: number;
}

/** Expense summary for analytics */
export interface ExpenseSummary {
  totalApproved: number;
  totalPending: number;
  byCategory: { category: string; amount: number }[];
  budgetUsage: number | null;
}

/** Compliance activity summary */
export interface ComplianceSummary {
  totalEvents: number;
  byType: { type: string; count: number }[];
  byUser: { userId: string; userName: string; count: number }[];
}

/** Overview stats for the analytics overview tab */
export interface OverviewStats {
  totalClients: number;
  activePolicies: number;
  totalPremiumYtd: number;
  renewalRate: number;
}

/** A single row of import data from CSV */
export interface ImportRow {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  policyType: string;
  carrier?: string;
  policyNumber?: string;
  premium?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

/** Result of a batch import operation */
export interface ImportResult {
  clientsCreated: number;
  policiesCreated: number;
  duplicatesSkipped: number;
  duplicates: {
    firstName: string;
    lastName: string;
    email?: string;
    existingId: string;
  }[];
  errors: { row: number; message: string }[];
}

export type ExpenseStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected';
export type RecurrenceFrequency = 'weekly' | 'monthly' | 'yearly';

export interface Expense {
  id: string;
  tenantId: string;
  amount: string; // Decimal-as-string
  currency: string;
  category: string;
  description: string | null;
  date: string;
  status: ExpenseStatus;
  submittedById: string;
  approvedById: string | null;
  approvedAt: string | null;
  rejectionNote: string | null;
  isRecurring: boolean;
  recurrence: RecurrenceFrequency | null;
  nextOccurrence: string | null;
  parentExpenseId: string | null;
  budgetId: string | null;
  createdAt: string;
  updatedAt: string;
  submittedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  approvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export interface ExpenseReceipt {
  id: string;
  expenseId: string;
  tenantId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  storagePath: string;
  createdAt: string;
}

export interface ExpenseListItem extends Expense {
  receipts: ExpenseReceipt[];
  submittedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

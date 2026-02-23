export interface BudgetCategory {
  id: string;
  budgetId: string;
  category: string;
  limitAmount: string; // Decimal-as-string
}

export interface Budget {
  id: string;
  tenantId: string;
  month: number;
  year: number;
  totalLimit: string; // Decimal-as-string
  isActive: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  categories: BudgetCategory[];
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface Budget {
  id: string;
  tenantId: string;
  name: string;
  totalLimit: string; // Decimal-as-string
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

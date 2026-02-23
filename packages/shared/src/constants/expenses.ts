import type { ExpenseStatus, RecurrenceFrequency } from '../types/expense';

export const EXPENSE_CATEGORIES = [
  { value: 'office_rent', label: 'Office Rent & Lease' },
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'technology', label: 'Technology & Software' },
  { value: 'marketing', label: 'Marketing & Advertising' },
  { value: 'licensing', label: 'Licensing & Regulatory Fees' },
  { value: 'eo_insurance', label: 'E&O Insurance' },
  { value: 'travel', label: 'Travel & Mileage' },
  { value: 'professional_development', label: 'Professional Development' },
  { value: 'salaries', label: 'Salaries & Commissions' },
  { value: 'client_entertainment', label: 'Client Entertainment' },
  { value: 'telephone', label: 'Telephone & Internet' },
  { value: 'postage', label: 'Postage & Shipping' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'other', label: 'Other' },
] as const;

export const EXPENSE_STATUSES: readonly { value: ExpenseStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
] as const;

export const RECURRENCE_FREQUENCIES: readonly { value: RecurrenceFrequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
] as const;

export const RECEIPT_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export const RECEIPT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

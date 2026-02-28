// Types - Auth
export type { UserRole, UserProfile, SessionUser } from './types/auth';
export type { Tenant } from './types/tenant';

// Types - Client & Policy Management
export type { ClientStatus, Client, ClientListItem } from './types/client';
export type {
  PolicyType,
  PolicyStatus,
  PaymentFrequency,
  Policy,
  PolicyWithClient,
} from './types/policy';
export type {
  ActivityEventType,
  ActivityEvent,
  Note,
} from './types/activity';

// Constants - Auth
export { ROLES, NAV_ITEMS, PERMISSIONS } from './constants/roles';
export type { NavItem } from './constants/roles';

// Constants - Insurance
export {
  POLICY_TYPES,
  POLICY_STATUSES,
  CANADIAN_PROVINCES,
  COMMON_CARRIERS,
  PAYMENT_FREQUENCIES,
} from './constants/insurance';

// Validation schemas - Auth
export {
  signupSchema,
  loginSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  acceptInviteSchema,
} from './validation/auth.schema';
export type {
  SignupInput,
  LoginInput,
  ResetPasswordInput,
  UpdatePasswordInput,
  AcceptInviteInput,
} from './validation/auth.schema';

export { tenantSetupSchema } from './validation/tenant.schema';
export type { TenantSetupInput } from './validation/tenant.schema';

// Validation schemas - Client & Policy Management
export {
  createClientSchema,
  updateClientSchema,
} from './validation/client.schema';
export type {
  CreateClientInput,
  UpdateClientInput,
} from './validation/client.schema';

export {
  createPolicySchema,
  updatePolicySchema,
} from './validation/policy.schema';
export type {
  CreatePolicyInput,
  UpdatePolicyInput,
} from './validation/policy.schema';

export { createNoteSchema } from './validation/note.schema';
export type { CreateNoteInput } from './validation/note.schema';

// Types - Tasks
export type {
  TaskStatus,
  TaskPriority,
  TaskType,
  Task,
  TaskWithRelations,
} from './types/task';

// Constants - Tasks
export { TASK_STATUSES, TASK_PRIORITIES, RENEWAL_MILESTONES } from './constants/tasks';

// Validation schemas - Tasks
export { createTaskSchema, updateTaskSchema } from './validation/task.schema';
export type { CreateTaskInput, UpdateTaskInput } from './validation/task.schema';

// Types - Documents
export type { DocumentCategory, Document, DocumentListItem } from './types/document';

// Constants - Documents
export { DOCUMENT_CATEGORIES, MAX_FILE_SIZE, ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS } from './constants/documents';

// Validation schemas - Documents & Compliance
export { uploadDocumentSchema, searchDocumentsSchema, searchComplianceSchema } from './validation/document.schema';
export type { UploadDocumentInput, SearchDocumentsInput, SearchComplianceInput } from './validation/document.schema';

// Types - Expenses & Budgets
export type { ExpenseStatus, RecurrenceFrequency, Expense, ExpenseReceipt, ExpenseListItem } from './types/expense';
export type { Budget } from './types/budget';
export type { InAppNotification } from './types/notification';

// Constants - Expenses
export { EXPENSE_CATEGORIES, EXPENSE_STATUSES, RECURRENCE_FREQUENCIES, RECEIPT_ALLOWED_MIME_TYPES, RECEIPT_MAX_FILE_SIZE } from './constants/expenses';

// Validation schemas - Expenses & Budgets
export { createExpenseSchema, updateExpenseSchema } from './validation/expense.schema';
export type { CreateExpenseInput, UpdateExpenseInput } from './validation/expense.schema';
export { createBudgetSchema, updateBudgetSchema } from './validation/budget.schema';
export type { CreateBudgetInput, UpdateBudgetInput } from './validation/budget.schema';

// Types - Badge & Testimonials
export type {
  AgentProfile,
  Testimonial,
  PublicBadgeProfile,
  CustomLink,
  TestimonialWithProfile,
} from './types/badge';

// Constants - Badge
export {
  STRENGTH_CATEGORIES,
  INSURANCE_PRODUCTS,
  ACCENT_COLOR_PRESETS,
  MAX_FEATURED_TESTIMONIALS,
  COVER_PHOTO_MAX_SIZE,
  COVER_PHOTO_ALLOWED_TYPES,
  BADGE_ASSETS_BUCKET,
} from './constants/badge';
export type { StrengthCategory } from './constants/badge';

// Validation schemas - Badge & Testimonials
export {
  submitTestimonialSchema,
  updateAgentProfileSchema,
} from './validation/badge.schema';
export type {
  SubmitTestimonialInput,
  UpdateAgentProfileInput,
} from './validation/badge.schema';

// Types - Analytics
export type {
  TimeRange,
  PolicyBreakdown,
  RenewalPipelineMonth,
  CrossSellOpportunity,
  ClientStats,
  ExpenseSummary,
  ComplianceSummary,
  OverviewStats,
  ImportRow,
  ImportResult,
} from './types/analytics';

// Constants - Analytics
export {
  CROSS_SELL_BUNDLES,
  MIN_POLICY_TYPES_FOR_CROSSSELL,
  TIME_RANGES,
  IMPORT_POLICY_TYPE_MAP,
  IMPORT_EXPECTED_FIELDS,
} from './constants/analytics';

// Validation schemas - Analytics & Import
export { analyticsQuerySchema } from './validation/analytics.schema';
export type { AnalyticsQueryInput } from './validation/analytics.schema';
export { importRowSchema, importBatchSchema } from './validation/import.schema';
export type { ImportRowInput, ImportBatchInput } from './validation/import.schema';

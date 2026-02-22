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

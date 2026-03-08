import type { UserRole } from './auth';

/** Super admin profile as returned from the API */
export interface SuperAdminProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  /** ISO datetime string */
  createdAt: string;
}

/** Admin audit log entry with optional super admin details */
export interface AdminAuditLogEntry {
  id: string;
  superAdminId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  /** ISO datetime string */
  createdAt: string;
  superAdmin?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

/** Aggregate platform metrics for the admin dashboard */
export interface PlatformMetrics {
  totalAgencies: number;
  totalUsers: number;
  totalPolicies: number;
  totalClients: number;
  /** Decimal string for large currency values */
  totalPremiumValue: string;
}

/** Monthly growth data point for trend charts */
export interface PlatformGrowthPoint {
  /** Month label, e.g. "2026-01" */
  month: string;
  agencies: number;
  users: number;
  clients: number;
}

/** Health alert for platform monitoring */
export interface HealthAlert {
  type: string;
  severity: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
}

/** Agency summary for list views (includes aggregated counts) */
export interface AgencyListItem {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  province: string | null;
  isSuspended: boolean;
  /** ISO datetime string or null */
  suspendedAt: string | null;
  userCap: number;
  storageCap: number;
  /** ISO datetime string */
  createdAt: string;
  _count: {
    users: number;
    clients: number;
    policies: number;
  };
}

/** Detailed agency view with users and activity summary */
export interface AgencyDetail extends AgencyListItem {
  users: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isActive: boolean;
    /** ISO datetime string or null */
    deactivatedAt: string | null;
    /** ISO datetime string */
    createdAt: string;
  }[];
  activitySummary: {
    totalActivities: number;
    lastActivityAt: string | null;
  };
}

/** User list item for admin user management */
export interface AdminUserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  /** ISO datetime string or null */
  deactivatedAt: string | null;
  tenantId: string;
  tenant: {
    name: string;
  };
  /** ISO datetime string */
  createdAt: string;
}

/** Impersonation session metadata */
export interface ImpersonationSession {
  tokenHash: string;
  email: string;
  /** ISO datetime string */
  expiresAt: string;
  tenantId: string;
  tenantName: string;
}

/** Filters for querying audit logs */
export interface AuditLogFilters {
  action?: string;
  targetType?: string;
  superAdminId?: string;
  /** ISO datetime string */
  startDate?: string;
  /** ISO datetime string */
  endDate?: string;
  page: number;
  limit: number;
}

/** Filters for querying agency list */
export interface AgencyListFilters {
  search?: string;
  isSuspended?: boolean;
  page: number;
  limit: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

/** All auditable admin actions */
export const ADMIN_ACTIONS = {
  USER_DISABLE: 'user.disable',
  USER_ENABLE: 'user.enable',
  USER_DEACTIVATE: 'user.deactivate',
  USER_ROLE_CHANGE: 'user.role_change',
  USER_PASSWORD_RESET: 'user.password_reset',
  AGENCY_SUSPEND: 'agency.suspend',
  AGENCY_UNSUSPEND: 'agency.unsuspend',
  AGENCY_EXPORT: 'agency.export',
  AGENCY_UPDATE_LIMITS: 'agency.update_limits',
  IMPERSONATION_START: 'impersonation.start',
  IMPERSONATION_END: 'impersonation.end',
  SUPERADMIN_INVITE: 'superadmin.invite',
  SUPERADMIN_REMOVE: 'superadmin.remove',
} as const;

/** Target types for audit log entries */
export const ADMIN_TARGET_TYPES = {
  USER: 'user',
  TENANT: 'tenant',
  SUPER_ADMIN: 'super_admin',
} as const;

/** Thresholds for platform health monitoring */
export const HEALTH_THRESHOLDS = {
  /** Maximum acceptable email failure rate (10%) */
  emailFailureRate: 0.1,
  /** Days of inactivity before flagging an agency */
  inactiveDays: 30,
  /** Storage usage percentage that triggers a warning */
  storageWarningPercent: 80,
} as const;

/** Duration of an impersonation session in milliseconds (30 minutes) */
export const IMPERSONATION_DURATION_MS = 30 * 60 * 1000;

/** Available page size options for admin list views */
export const ADMIN_PAGE_SIZES = [10, 25, 50, 100] as const;

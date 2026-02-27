export type UserRole = 'admin' | 'agent';

export interface UserProfile {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl: string | null;
  setupCompleted: boolean;
  digestOptOut: boolean;
}

export interface SessionUser {
  id: string;
  email: string;
  tenantId: string;
  role: UserRole;
}

import { UserRole } from '../types/auth';

export const ROLES = {
  ADMIN: 'admin' as const,
  AGENT: 'agent' as const,
} satisfies Record<string, UserRole>;

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  adminOnly: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/', icon: 'LayoutDashboard', adminOnly: false },
  { id: 'clients', label: 'Clients', href: '/clients', icon: 'Users', adminOnly: false },
  { id: 'policies', label: 'Policies', href: '/policies', icon: 'Shield', adminOnly: false },
  { id: 'tasks', label: 'Tasks', href: '/tasks', icon: 'CheckSquare', adminOnly: false },
  { id: 'compliance', label: 'Compliance', href: '/compliance', icon: 'FileText', adminOnly: false },
  { id: 'expenses', label: 'Expenses', href: '/expenses', icon: 'DollarSign', adminOnly: false },
  { id: 'settings', label: 'Settings', href: '/settings', icon: 'Settings', adminOnly: true },
];

/**
 * Permissions map: which nav items each role can access.
 * Admin: all items
 * Agent: all items EXCEPT settings/team management
 * Note: Expenses is accessible to ALL roles -- agents can submit expenses per user decision.
 */
export const PERMISSIONS: Record<UserRole, string[]> = {
  admin: NAV_ITEMS.map((item) => item.id),
  agent: NAV_ITEMS.filter((item) => !item.adminOnly).map((item) => item.id),
};

'use client';

import { format } from 'date-fns';
import type { AdminUserListItem } from '@anchor/shared';
import { UserActionsMenu } from './user-actions-menu';

interface UserTableProps {
  users: AdminUserListItem[];
  onRefresh: () => void;
  onImpersonate: (user: AdminUserListItem) => void;
  onToast: (message: string, type: 'success' | 'error') => void;
}

function getStatusLabel(user: AdminUserListItem): {
  label: string;
  className: string;
} {
  if (user.deactivatedAt) {
    return {
      label: 'Deactivated',
      className: 'bg-red-500/10 text-red-400',
    };
  }
  if (!user.isActive) {
    return {
      label: 'Disabled',
      className: 'bg-yellow-500/10 text-yellow-400',
    };
  }
  return {
    label: 'Active',
    className: 'bg-green-500/10 text-green-400',
  };
}

function getRoleBadge(role: string) {
  if (role === 'ADMIN') {
    return 'bg-[#2563eb]/10 text-[#60a5fa]';
  }
  return 'bg-[#334155] text-[#94a3b8]';
}

export function UserTable({
  users,
  onRefresh,
  onImpersonate,
  onToast,
}: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-[#334155] bg-[#1e293b]">
        <p className="text-sm text-[#94a3b8]">No users found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[#334155]">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#334155] bg-[#1e293b]">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#94a3b8]">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#94a3b8]">
              Email
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#94a3b8]">
              Agency
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#94a3b8]">
              Role
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#94a3b8]">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#94a3b8]">
              Created
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[#94a3b8]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#334155]">
          {users.map((user) => {
            const status = getStatusLabel(user);
            return (
              <tr
                key={user.id}
                className="bg-[#0f172a] transition hover:bg-[#1e293b]/50"
              >
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-white">
                  {user.firstName} {user.lastName}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-[#94a3b8]">
                  {user.email}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-[#94a3b8]">
                  {user.tenant.name}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getRoleBadge(user.role)}`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
                  >
                    {status.label}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-[#94a3b8]">
                  {format(new Date(user.createdAt), 'MMM d, yyyy')}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <UserActionsMenu
                    user={user}
                    onRefresh={onRefresh}
                    onImpersonate={onImpersonate}
                    onToast={onToast}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

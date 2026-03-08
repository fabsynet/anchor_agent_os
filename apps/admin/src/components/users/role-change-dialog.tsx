'use client';

import { useState } from 'react';
import type { AdminUserListItem } from '@anchor/shared';
import { api } from '@/lib/api';

interface RoleChangeDialogProps {
  user: AdminUserListItem;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RoleChangeDialog({
  user,
  open,
  onClose,
  onSuccess,
}: RoleChangeDialogProps) {
  const [selectedRole, setSelectedRole] = useState(user.role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit() {
    if (selectedRole === user.role) {
      onClose();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.patch(`/admin/users/${user.id}/role`, { role: selectedRole });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change role');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-lg border border-[#334155] bg-[#1e293b] p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-white">Change User Role</h2>
        <p className="mt-1 text-sm text-[#94a3b8]">
          Change role for{' '}
          <span className="font-medium text-white">
            {user.firstName} {user.lastName}
          </span>{' '}
          ({user.email})
        </p>

        <div className="mt-4 space-y-3">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#334155] p-3 transition hover:border-[#2563eb]">
            <input
              type="radio"
              name="role"
              value="ADMIN"
              checked={selectedRole === 'admin'}
              onChange={() => setSelectedRole('admin' as typeof selectedRole)}
              className="h-4 w-4 accent-[#2563eb]"
            />
            <div>
              <p className="text-sm font-medium text-white">Admin</p>
              <p className="text-xs text-[#94a3b8]">
                Full access to agency settings, team, and all data
              </p>
            </div>
          </label>

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#334155] p-3 transition hover:border-[#2563eb]">
            <input
              type="radio"
              name="role"
              value="AGENT"
              checked={selectedRole === 'agent'}
              onChange={() => setSelectedRole('agent' as typeof selectedRole)}
              className="h-4 w-4 accent-[#2563eb]"
            />
            <div>
              <p className="text-sm font-medium text-white">Agent</p>
              <p className="text-xs text-[#94a3b8]">
                Can manage clients, policies, and tasks
              </p>
            </div>
          </label>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-400">{error}</p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-[#334155] px-4 py-2 text-sm text-[#94a3b8] transition hover:bg-[#334155] hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || selectedRole === user.role}
            className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1d4ed8] disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Change Role'}
          </button>
        </div>
      </div>
    </div>
  );
}

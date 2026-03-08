'use client';

import { useState } from 'react';
import type { AdminUserListItem } from '@anchor/shared';
import { api } from '@/lib/api';

interface DeactivateDialogProps {
  user: AdminUserListItem;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeactivateDialog({
  user,
  open,
  onClose,
  onSuccess,
}: DeactivateDialogProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleDeactivate() {
    setLoading(true);
    setError(null);

    try {
      await api.post(`/admin/users/${user.id}/deactivate`, {
        reason: reason.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate user');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-lg border border-red-500/30 bg-[#1e293b] p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
            <svg
              className="h-5 w-5 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              Deactivate User
            </h2>
            <p className="text-sm text-[#94a3b8]">
              This action is permanent and cannot be undone.
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm text-[#94a3b8]">
          You are about to deactivate{' '}
          <span className="font-medium text-white">
            {user.firstName} {user.lastName}
          </span>{' '}
          ({user.email}). This will permanently disable their account and revoke
          all access.
        </p>

        <div className="mt-4">
          <label
            htmlFor="deactivate-reason"
            className="block text-sm font-medium text-[#94a3b8]"
          >
            Reason (optional)
          </label>
          <textarea
            id="deactivate-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for deactivation..."
            rows={3}
            className="mt-1 w-full rounded-lg border border-[#334155] bg-[#0f172a] px-3 py-2 text-sm text-white placeholder-[#64748b] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
          />
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
            onClick={handleDeactivate}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Deactivating...' : 'Deactivate User'}
          </button>
        </div>
      </div>
    </div>
  );
}

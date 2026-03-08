'use client';

import { useState, useRef, useEffect } from 'react';
import type { AdminUserListItem } from '@anchor/shared';
import { api } from '@/lib/api';
import { RoleChangeDialog } from './role-change-dialog';
import { DeactivateDialog } from './deactivate-dialog';

interface UserActionsMenuProps {
  user: AdminUserListItem;
  onRefresh: () => void;
  onImpersonate: (user: AdminUserListItem) => void;
  onToast: (message: string, type: 'success' | 'error') => void;
}

export function UserActionsMenu({
  user,
  onRefresh,
  onImpersonate,
  onToast,
}: UserActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
        setConfirmDisable(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  async function handlePasswordReset() {
    setActionLoading(true);
    try {
      await api.post(`/admin/users/${user.id}/password-reset`);
      onToast(`Password reset sent to ${user.email}`, 'success');
    } catch (err) {
      onToast(
        err instanceof Error ? err.message : 'Failed to send password reset',
        'error',
      );
    } finally {
      setActionLoading(false);
      setOpen(false);
    }
  }

  async function handleDisable() {
    if (!confirmDisable) {
      setConfirmDisable(true);
      return;
    }

    setActionLoading(true);
    try {
      await api.post(`/admin/users/${user.id}/disable`);
      onToast(`${user.firstName} ${user.lastName} has been disabled`, 'success');
      onRefresh();
    } catch (err) {
      onToast(
        err instanceof Error ? err.message : 'Failed to disable user',
        'error',
      );
    } finally {
      setActionLoading(false);
      setOpen(false);
      setConfirmDisable(false);
    }
  }

  async function handleEnable() {
    setActionLoading(true);
    try {
      await api.post(`/admin/users/${user.id}/enable`);
      onToast(`${user.firstName} ${user.lastName} has been enabled`, 'success');
      onRefresh();
    } catch (err) {
      onToast(
        err instanceof Error ? err.message : 'Failed to enable user',
        'error',
      );
    } finally {
      setActionLoading(false);
      setOpen(false);
    }
  }

  const isDeactivated = !!user.deactivatedAt;

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => {
            setOpen(!open);
            setConfirmDisable(false);
          }}
          disabled={actionLoading}
          className="rounded-lg p-1.5 text-[#94a3b8] transition hover:bg-[#334155] hover:text-white disabled:opacity-50"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-[#334155] bg-[#1e293b] py-1 shadow-xl">
            {/* Password Reset */}
            <button
              onClick={handlePasswordReset}
              disabled={actionLoading || isDeactivated}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#94a3b8] transition hover:bg-[#334155] hover:text-white disabled:opacity-40"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
              Reset Password
            </button>

            {/* Disable / Enable */}
            {user.isActive && !isDeactivated ? (
              <button
                onClick={handleDisable}
                disabled={actionLoading}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#94a3b8] transition hover:bg-[#334155] hover:text-white disabled:opacity-40"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
                {confirmDisable ? 'Click to confirm' : 'Disable'}
              </button>
            ) : !isDeactivated ? (
              <button
                onClick={handleEnable}
                disabled={actionLoading}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#94a3b8] transition hover:bg-[#334155] hover:text-white disabled:opacity-40"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Enable
              </button>
            ) : null}

            {/* Change Role */}
            <button
              onClick={() => {
                setOpen(false);
                setShowRoleDialog(true);
              }}
              disabled={actionLoading || isDeactivated}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#94a3b8] transition hover:bg-[#334155] hover:text-white disabled:opacity-40"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Change Role
            </button>

            <div className="my-1 border-t border-[#334155]" />

            {/* Impersonate */}
            <button
              onClick={() => {
                setOpen(false);
                onImpersonate(user);
              }}
              disabled={actionLoading || isDeactivated || !user.isActive}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-amber-400 transition hover:bg-[#334155] disabled:opacity-40"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              Impersonate
            </button>

            {/* Deactivate */}
            {!isDeactivated && (
              <>
                <div className="my-1 border-t border-[#334155]" />
                <button
                  onClick={() => {
                    setOpen(false);
                    setShowDeactivateDialog(true);
                  }}
                  disabled={actionLoading}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 transition hover:bg-[#334155] disabled:opacity-40"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Deactivate
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <RoleChangeDialog
        user={user}
        open={showRoleDialog}
        onClose={() => setShowRoleDialog(false)}
        onSuccess={onRefresh}
      />

      <DeactivateDialog
        user={user}
        open={showDeactivateDialog}
        onClose={() => setShowDeactivateDialog(false)}
        onSuccess={onRefresh}
      />
    </>
  );
}

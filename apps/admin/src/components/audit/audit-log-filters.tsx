'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { ADMIN_ACTIONS, ADMIN_TARGET_TYPES } from '@anchor/shared';
import type { SuperAdminProfile } from '@anchor/shared';

/** Human-readable labels for admin actions */
const ACTION_LABELS: Record<string, string> = {
  [ADMIN_ACTIONS.USER_DISABLE]: 'User Disable',
  [ADMIN_ACTIONS.USER_ENABLE]: 'User Enable',
  [ADMIN_ACTIONS.USER_DEACTIVATE]: 'User Deactivate',
  [ADMIN_ACTIONS.USER_ROLE_CHANGE]: 'User Role Change',
  [ADMIN_ACTIONS.USER_PASSWORD_RESET]: 'User Password Reset',
  [ADMIN_ACTIONS.AGENCY_SUSPEND]: 'Agency Suspend',
  [ADMIN_ACTIONS.AGENCY_UNSUSPEND]: 'Agency Unsuspend',
  [ADMIN_ACTIONS.AGENCY_EXPORT]: 'Agency Export',
  [ADMIN_ACTIONS.AGENCY_UPDATE_LIMITS]: 'Agency Update Limits',
  [ADMIN_ACTIONS.IMPERSONATION_START]: 'Impersonation Start',
  [ADMIN_ACTIONS.IMPERSONATION_END]: 'Impersonation End',
  [ADMIN_ACTIONS.SUPERADMIN_INVITE]: 'Super-Admin Invite',
  [ADMIN_ACTIONS.SUPERADMIN_REMOVE]: 'Super-Admin Remove',
};

export { ACTION_LABELS };

const TARGET_TYPE_OPTIONS = [
  { value: ADMIN_TARGET_TYPES.USER, label: 'User' },
  { value: ADMIN_TARGET_TYPES.TENANT, label: 'Tenant' },
  { value: ADMIN_TARGET_TYPES.SUPER_ADMIN, label: 'Super Admin' },
];

export interface AuditFilters {
  action: string;
  targetType: string;
  superAdminId: string;
  startDate: string;
  endDate: string;
}

interface AuditLogFiltersProps {
  filters: AuditFilters;
  onFiltersChange: (filters: AuditFilters) => void;
  superAdmins: SuperAdminProfile[];
}

const selectClass =
  'rounded-md border border-[#334155] bg-[#0f172a] px-3 py-2 text-sm text-[#e2e8f0] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]';

const inputClass =
  'rounded-md border border-[#334155] bg-[#0f172a] px-3 py-2 text-sm text-[#e2e8f0] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]';

export function AuditLogFilters({
  filters,
  onFiltersChange,
  superAdmins,
}: AuditLogFiltersProps) {
  function update(patch: Partial<AuditFilters>) {
    onFiltersChange({ ...filters, ...patch });
  }

  function reset() {
    onFiltersChange({
      action: '',
      targetType: '',
      superAdminId: '',
      startDate: '',
      endDate: '',
    });
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  return (
    <div className="rounded-lg border border-[#334155] bg-[#1e293b] p-4">
      <div className="flex flex-wrap items-end gap-4">
        {/* Action type */}
        <div className="min-w-[180px]">
          <label className="mb-1.5 block text-xs font-medium text-[#94a3b8]">
            Action
          </label>
          <select
            value={filters.action}
            onChange={(e) => update({ action: e.target.value })}
            className={selectClass}
          >
            <option value="">All actions</option>
            {Object.entries(ADMIN_ACTIONS).map(([, value]) => (
              <option key={value} value={value}>
                {ACTION_LABELS[value] ?? value}
              </option>
            ))}
          </select>
        </div>

        {/* Target type */}
        <div className="min-w-[140px]">
          <label className="mb-1.5 block text-xs font-medium text-[#94a3b8]">
            Target Type
          </label>
          <select
            value={filters.targetType}
            onChange={(e) => update({ targetType: e.target.value })}
            className={selectClass}
          >
            <option value="">All types</option>
            {TARGET_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Super-admin */}
        <div className="min-w-[180px]">
          <label className="mb-1.5 block text-xs font-medium text-[#94a3b8]">
            Admin
          </label>
          <select
            value={filters.superAdminId}
            onChange={(e) => update({ superAdminId: e.target.value })}
            className={selectClass}
          >
            <option value="">All admins</option>
            {superAdmins.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {admin.firstName} {admin.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* Date range */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#94a3b8]">
            Start Date
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => update({ startDate: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#94a3b8]">
            End Date
          </label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => update({ endDate: e.target.value })}
            className={inputClass}
          />
        </div>

        {/* Reset */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 rounded-md border border-[#334155] px-3 py-2 text-sm text-[#94a3b8] hover:bg-[#334155] hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

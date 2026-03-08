'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AdminUserListItem, AgencyListItem } from '@anchor/shared';
import { api } from '@/lib/api';
import { UserTable } from '@/components/users/user-table';
import { useImpersonation } from '@/components/impersonation/impersonation-provider';

interface UsersResponse {
  users: AdminUserListItem[];
  total: number;
  page: number;
  limit: number;
}

interface AgenciesResponse {
  agencies: AgencyListItem[];
  total: number;
}

type StatusFilter = 'all' | 'active' | 'disabled' | 'deactivated';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [agencyFilter, setAgencyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [agencies, setAgencies] = useState<{ id: string; name: string }[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error') => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    [],
  );

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (search) params.set('search', search);
      if (agencyFilter) params.set('tenantId', agencyFilter);
      if (statusFilter === 'active') params.set('isActive', 'true');
      if (statusFilter === 'disabled') params.set('isActive', 'false');

      const data = await api.get<UsersResponse>(
        `/admin/users?${params.toString()}`,
      );

      let filtered = data.users;
      // Client-side filter for deactivated (subset of isActive=false)
      if (statusFilter === 'deactivated') {
        filtered = filtered.filter((u) => u.deactivatedAt !== null);
      } else if (statusFilter === 'disabled') {
        filtered = filtered.filter((u) => !u.deactivatedAt);
      }

      setUsers(filtered);
      setTotal(data.total);
    } catch {
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, agencyFilter, statusFilter, showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Load agencies for filter dropdown
  useEffect(() => {
    async function loadAgencies() {
      try {
        const data = await api.get<AgenciesResponse>(
          '/admin/agencies?limit=100',
        );
        setAgencies(
          data.agencies.map((a) => ({ id: a.id, name: a.name })),
        );
      } catch {
        // non-critical, ignore
      }
    }
    loadAgencies();
  }, []);

  const { startImpersonation } = useImpersonation();

  async function handleImpersonate(user: AdminUserListItem) {
    try {
      await startImpersonation(user.id);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to start impersonation',
        'error',
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      <div className="fixed right-4 top-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`animate-in slide-in-from-right rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
              toast.type === 'success'
                ? 'bg-green-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="mt-1 text-sm text-[#94a3b8]">
          {total} user{total !== 1 ? 's' : ''} across all agencies
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-[#334155] bg-[#1e293b] py-2 pl-10 pr-3 text-sm text-white placeholder-[#64748b] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
          />
        </div>

        {/* Agency filter */}
        <select
          value={agencyFilter}
          onChange={(e) => {
            setAgencyFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-[#334155] bg-[#1e293b] px-3 py-2 text-sm text-white focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
        >
          <option value="">All Agencies</option>
          {agencies.map((agency) => (
            <option key={agency.id} value={agency.id}>
              {agency.name}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as StatusFilter);
            setPage(1);
          }}
          className="rounded-lg border border-[#334155] bg-[#1e293b] px-3 py-2 text-sm text-white focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
          <option value="deactivated">Deactivated</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-[#334155] bg-[#1e293b]">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2563eb] border-t-transparent" />
        </div>
      ) : (
        <UserTable
          users={users}
          onRefresh={fetchUsers}
          onImpersonate={handleImpersonate}
          onToast={showToast}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#94a3b8]">
            Showing {(page - 1) * limit + 1} to{' '}
            {Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="rounded-lg border border-[#334155] px-3 py-1.5 text-sm text-[#94a3b8] transition hover:bg-[#334155] hover:text-white disabled:opacity-40"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`rounded-lg px-3 py-1.5 text-sm transition ${
                    page === pageNum
                      ? 'bg-[#2563eb] text-white'
                      : 'border border-[#334155] text-[#94a3b8] hover:bg-[#334155] hover:text-white'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-[#334155] px-3 py-1.5 text-sm text-[#94a3b8] transition hover:bg-[#334155] hover:text-white disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

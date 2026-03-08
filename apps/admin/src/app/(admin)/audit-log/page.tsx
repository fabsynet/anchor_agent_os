'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { AdminAuditLogEntry, SuperAdminProfile } from '@anchor/shared';
import {
  AuditLogFilters,
  type AuditFilters,
} from '@/components/audit/audit-log-filters';
import { AuditLogTable } from '@/components/audit/audit-log-table';

interface AuditLogResponse {
  data: AdminAuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const EMPTY_FILTERS: AuditFilters = {
  action: '',
  targetType: '',
  superAdminId: '',
  startDate: '',
  endDate: '',
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AdminAuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuditFilters>(EMPTY_FILTERS);
  const [superAdmins, setSuperAdmins] = useState<SuperAdminProfile[]>([]);

  // Fetch super-admins for filter dropdown
  useEffect(() => {
    api
      .get<SuperAdminProfile[]>('/admin/super-admins')
      .then(setSuperAdmins)
      .catch(() => {});
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));

      if (filters.action) params.set('action', filters.action);
      if (filters.targetType) params.set('targetType', filters.targetType);
      if (filters.superAdminId)
        params.set('superAdminId', filters.superAdminId);
      if (filters.startDate)
        params.set('startDate', new Date(filters.startDate).toISOString());
      if (filters.endDate)
        params.set('endDate', new Date(filters.endDate).toISOString());

      const res = await api.get<AuditLogResponse>(
        `/admin/audit-logs?${params.toString()}`,
      );
      setLogs(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset page when filters change
  function handleFiltersChange(newFilters: AuditFilters) {
    setFilters(newFilters);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Audit Log</h1>
        <p className="mt-1 text-sm text-[#94a3b8]">
          Track all super-admin actions across the platform
        </p>
      </div>

      <AuditLogFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        superAdmins={superAdmins}
      />

      <AuditLogTable
        data={logs}
        pagination={{ page, limit, total }}
        onPageChange={setPage}
        loading={loading}
      />
    </div>
  );
}

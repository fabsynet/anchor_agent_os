'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { api } from '@/lib/api';
import { AgencyTable, type AgencyRow } from '@/components/agencies/agency-table';
import type { SortingState } from '@tanstack/react-table';

interface AgencyListResponse {
  agencies: AgencyRow[];
  total: number;
  page: number;
  limit: number;
}

type StatusFilter = 'all' | 'active' | 'suspended';

export default function AgenciesPage() {
  const router = useRouter();
  const [agencies, setAgencies] = useState<AgencyRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ]);
  const [loading, setLoading] = useState(true);

  const fetchAgencies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));

      if (search.trim()) {
        params.set('search', search.trim());
      }

      if (statusFilter === 'active') {
        params.set('isSuspended', 'false');
      } else if (statusFilter === 'suspended') {
        params.set('isSuspended', 'true');
      }

      if (sorting.length > 0) {
        params.set('sortBy', sorting[0].id);
        params.set('sortDir', sorting[0].desc ? 'desc' : 'asc');
      }

      const data = await api.get<AgencyListResponse>(
        `/admin/agencies?${params.toString()}`,
      );
      setAgencies(data.agencies);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to fetch agencies:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, sorting]);

  useEffect(() => {
    fetchAgencies();
  }, [fetchAgencies]);

  // Reset page when search or filter changes
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const filterButtons: { label: string; value: StatusFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Suspended', value: 'suspended' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Agencies</h1>
        <p className="mt-1 text-sm text-[#94a3b8]">
          {total} {total === 1 ? 'agency' : 'agencies'} registered
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agencies..."
            className="w-full rounded-md border border-[#334155] bg-[#0f172a] py-2 pl-10 pr-4 text-sm text-[#e2e8f0] placeholder:text-[#64748b] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
          />
        </div>

        <div className="flex gap-1 rounded-lg border border-[#334155] bg-[#0f172a] p-1">
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              type="button"
              onClick={() => setStatusFilter(btn.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                statusFilter === btn.value
                  ? 'bg-[#2563eb] text-white'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <AgencyTable
        agencies={agencies}
        pagination={{ page, limit, total }}
        onPageChange={setPage}
        sorting={sorting}
        onSortingChange={setSorting}
        loading={loading}
        onRowClick={(agency) => router.push(`/agencies/${agency.id}`)}
      />
    </div>
  );
}

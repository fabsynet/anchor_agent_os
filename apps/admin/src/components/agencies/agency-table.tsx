'use client';

import { useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { format } from 'date-fns';
import { DataTable } from '@/components/ui/data-table';
import type { SortingState, OnChangeFn } from '@tanstack/react-table';

export interface AgencyRow {
  id: string;
  name: string;
  province: string | null;
  isSuspended: boolean;
  createdAt: string;
  _count: {
    users: number;
    clients: number;
    policies: number;
  };
}

interface AgencyTableProps {
  agencies: AgencyRow[];
  pagination: { page: number; limit: number; total: number };
  onPageChange: (page: number) => void;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  loading: boolean;
  onRowClick: (agency: AgencyRow) => void;
}

const columnHelper = createColumnHelper<AgencyRow>();

export function AgencyTable({
  agencies,
  pagination,
  onPageChange,
  sorting,
  onSortingChange,
  loading,
  onRowClick,
}: AgencyTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => (
          <span className="font-medium text-white">{info.getValue()}</span>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor('province', {
        header: 'Province',
        cell: (info) => info.getValue() ?? '-',
        enableSorting: false,
      }),
      columnHelper.accessor((row) => row._count.users, {
        id: 'users',
        header: 'Users',
        cell: (info) => info.getValue(),
        enableSorting: false,
      }),
      columnHelper.accessor((row) => row._count.clients, {
        id: 'clients',
        header: 'Clients',
        cell: (info) => info.getValue(),
        enableSorting: false,
      }),
      columnHelper.accessor((row) => row._count.policies, {
        id: 'policies',
        header: 'Policies',
        cell: (info) => info.getValue(),
        enableSorting: false,
      }),
      columnHelper.accessor('isSuspended', {
        header: 'Status',
        cell: (info) => {
          const suspended = info.getValue();
          return (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                suspended
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {suspended ? 'Suspended' : 'Active'}
            </span>
          );
        },
        enableSorting: false,
      }),
      columnHelper.accessor('createdAt', {
        header: 'Created',
        cell: (info) => format(new Date(info.getValue()), 'MMM d, yyyy'),
        enableSorting: true,
      }),
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={agencies}
      pagination={pagination}
      onPaginationChange={onPageChange}
      sorting={sorting}
      onSortingChange={onSortingChange}
      loading={loading}
      onRowClick={onRowClick}
    />
  );
}

'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { AdminAuditLogEntry } from '@anchor/shared';
import { DataTable } from '@/components/ui/data-table';
import { ACTION_LABELS } from './audit-log-filters';

interface AuditLogTableProps {
  data: AdminAuditLogEntry[];
  pagination: { page: number; limit: number; total: number };
  onPageChange: (page: number) => void;
  loading: boolean;
}

function truncateUuid(uuid: string): string {
  return uuid.length > 8 ? `${uuid.slice(0, 8)}...` : uuid;
}

export function AuditLogTable({
  data,
  pagination,
  onPageChange,
  loading,
}: AuditLogTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const columns: ColumnDef<AdminAuditLogEntry, unknown>[] = [
    {
      id: 'expand',
      header: '',
      cell: ({ row }) => {
        const hasMetadata =
          row.original.metadata &&
          Object.keys(row.original.metadata).length > 0;
        if (!hasMetadata) return null;
        const isExpanded = expandedRow === row.original.id;
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpandedRow(isExpanded ? null : row.original.id);
            }}
            className="text-[#94a3b8] hover:text-white"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        );
      },
      size: 40,
    },
    {
      accessorKey: 'createdAt',
      header: 'Timestamp',
      cell: ({ getValue }) =>
        format(new Date(getValue() as string), 'MMM d, yyyy HH:mm'),
    },
    {
      id: 'admin',
      header: 'Admin',
      cell: ({ row }) => {
        const sa = row.original.superAdmin;
        return sa ? `${sa.firstName} ${sa.lastName}` : 'Unknown';
      },
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ getValue }) => {
        const action = getValue() as string;
        return (
          <span className="rounded-full bg-[#334155] px-2.5 py-0.5 text-xs font-medium text-[#e2e8f0]">
            {ACTION_LABELS[action] ?? action}
          </span>
        );
      },
    },
    {
      accessorKey: 'targetType',
      header: 'Target Type',
      cell: ({ getValue }) => {
        const tt = getValue() as string;
        return tt.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      },
    },
    {
      accessorKey: 'targetId',
      header: 'Target ID',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-[#94a3b8]" title={getValue() as string}>
          {truncateUuid(getValue() as string)}
        </span>
      ),
    },
    {
      accessorKey: 'ipAddress',
      header: 'IP Address',
      cell: ({ getValue }) => {
        const ip = getValue() as string | null;
        return ip ? (
          <span className="font-mono text-xs text-[#94a3b8]">{ip}</span>
        ) : (
          <span className="text-[#64748b]">--</span>
        );
      },
    },
  ];

  return (
    <div>
      <DataTable
        columns={columns}
        data={data}
        pagination={pagination}
        onPaginationChange={onPageChange}
        loading={loading}
      />

      {/* Expanded metadata */}
      {expandedRow && (() => {
        const entry = data.find((d) => d.id === expandedRow);
        if (!entry?.metadata) return null;
        return (
          <div className="mt-2 rounded-lg border border-[#334155] bg-[#0f172a] p-4">
            <p className="mb-2 text-xs font-medium text-[#94a3b8]">Metadata</p>
            <pre className="overflow-x-auto text-xs text-[#e2e8f0]">
              {JSON.stringify(entry.metadata, null, 2)}
            </pre>
          </div>
        );
      })()}
    </div>
  );
}

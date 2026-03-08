'use client';

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type OnChangeFn,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

interface PaginationState {
  page: number;
  limit: number;
  total: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  pagination?: PaginationState;
  onPaginationChange?: (page: number) => void;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  loading?: boolean;
  onRowClick?: (row: TData) => void;
}

export function DataTable<TData>({
  columns,
  data,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  loading = false,
  onRowClick,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    state: {
      sorting: sorting ?? [],
    },
    onSortingChange,
    rowCount: pagination?.total ?? data.length,
  });

  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.limit)
    : 1;

  return (
    <div className="rounded-lg border border-[#334155] bg-[#1e293b]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-[#334155]"
              >
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();

                  return (
                    <th
                      key={header.id}
                      className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#94a3b8] ${
                        canSort ? 'cursor-pointer select-none hover:text-white' : ''
                      }`}
                      onClick={
                        canSort
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      <div className="flex items-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                        {canSort && (
                          <span className="ml-1">
                            {sorted === 'asc' ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : sorted === 'desc' ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronsUpDown className="h-3.5 w-3.5 text-[#64748b]" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-[#94a3b8]"
                >
                  Loading...
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-[#94a3b8]"
                >
                  No results found.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b border-[#334155] last:border-b-0 ${
                    onRowClick
                      ? 'cursor-pointer hover:bg-[#334155]/50'
                      : ''
                  }`}
                  onClick={
                    onRowClick
                      ? () => onRowClick(row.original)
                      : undefined
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 text-[#e2e8f0]"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[#334155] px-4 py-3">
          <p className="text-sm text-[#94a3b8]">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
            of {pagination.total}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onPaginationChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="rounded-md border border-[#334155] px-3 py-1.5 text-sm text-[#e2e8f0] hover:bg-[#334155] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => onPaginationChange?.(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
              className="rounded-md border border-[#334155] px-3 py-1.5 text-sm text-[#e2e8f0] hover:bg-[#334155] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

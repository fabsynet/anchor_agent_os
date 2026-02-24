"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface ComplianceEvent {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  user?: { firstName: string; lastName: string } | null;
  client?: { id: string; firstName: string; lastName: string } | null;
  policyId?: string | null;
  policy?: { id: string; policyNumber?: string; type: string } | null;
  metadata?: Record<string, unknown> | null;
}

interface ComplianceTableProps {
  data: ComplianceEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

/**
 * Action type badge color mapping by category.
 * document events = blue, policy events = green, task events = amber,
 * client events = purple, note events = gray.
 */
function getActionBadgeClass(type: string): string {
  if (type.startsWith("document_")) {
    return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
  }
  if (type.startsWith("policy_")) {
    return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
  }
  if (type.startsWith("task_")) {
    return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
  }
  if (type.startsWith("client_")) {
    return "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300";
  }
  if (type.startsWith("note_")) {
    return "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300";
  }
  return "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300";
}

function formatActionLabel(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const columns: ColumnDef<ComplianceEvent>[] = [
  {
    accessorKey: "createdAt",
    header: "Date/Time",
    cell: ({ row }) => {
      try {
        return format(new Date(row.original.createdAt), "MMM d, yyyy h:mm a");
      } catch {
        return "--";
      }
    },
  },
  {
    accessorKey: "type",
    header: "Action",
    cell: ({ row }) => {
      const type = row.original.type;
      return (
        <Badge
          variant="outline"
          className={`border-transparent text-[10px] font-medium ${getActionBadgeClass(type)}`}
        >
          {formatActionLabel(type)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <span className="max-w-xs truncate block">
        {row.original.description}
      </span>
    ),
  },
  {
    id: "client",
    header: "Client",
    cell: ({ row }) => {
      const client = row.original.client;
      if (!client) return <span className="text-muted-foreground">--</span>;
      return (
        <Link
          href={`/clients/${client.id}`}
          className="text-primary hover:underline"
        >
          {client.firstName} {client.lastName}
        </Link>
      );
    },
  },
  {
    id: "user",
    header: "User",
    cell: ({ row }) => {
      const user = row.original.user;
      if (!user) return <span className="text-muted-foreground">--</span>;
      return (
        <span>
          {user.firstName} {user.lastName}
        </span>
      );
    },
  },
  {
    id: "policy",
    header: "Policy",
    cell: ({ row }) => {
      const policy = row.original.policy;
      if (!policy) return <span className="text-muted-foreground">-</span>;
      const label = policy.policyNumber
        ? `${policy.type.charAt(0).toUpperCase() + policy.type.slice(1)} #${policy.policyNumber}`
        : policy.type.charAt(0).toUpperCase() + policy.type.slice(1);
      return <span className="text-xs">{label}</span>;
    },
  },
];

export function ComplianceTable({
  data,
  total,
  page,
  totalPages,
  onPageChange,
  loading = false,
}: ComplianceTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <p className="text-muted-foreground">No compliance events found.</p>
        <p className="text-xs text-muted-foreground">
          Try adjusting your filters or check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} total event{total !== 1 ? "s" : ""}
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(Math.max(1, page - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

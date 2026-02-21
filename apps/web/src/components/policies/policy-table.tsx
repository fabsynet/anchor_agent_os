"use client";

import { format } from "date-fns";
import {
  Car,
  Home,
  Heart,
  Activity,
  Building2,
  Plane,
  Umbrella,
  FileText,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  flexRender,
} from "@tanstack/react-table";
import { useState } from "react";
import type { Policy, PolicyType } from "@anchor/shared";
import { POLICY_TYPES } from "@anchor/shared";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PolicyStatusBadge } from "./policy-status-badge";

interface PolicyTableProps {
  policies: Policy[];
  clientId: string;
  onEdit: (policy: Policy) => void;
  onDelete: (policy: Policy) => void;
}

const iconMap: Record<PolicyType, React.ComponentType<{ className?: string }>> = {
  auto: Car,
  home: Home,
  life: Heart,
  health: Activity,
  commercial: Building2,
  travel: Plane,
  umbrella: Umbrella,
  other: FileText,
};

function formatCurrency(value: string | null): string {
  if (!value) return "--";
  const num = parseFloat(value);
  if (isNaN(num)) return "--";
  return `$${num.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value: string | null): string {
  if (!value) return "--";
  try {
    return format(new Date(value), "MMM d, yyyy");
  } catch {
    return "--";
  }
}

export function PolicyTable({ policies, onEdit, onDelete }: PolicyTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<Policy>[] = [
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const policy = row.original;
        const typeInfo = POLICY_TYPES.find((pt) => pt.value === policy.type);
        const Icon = iconMap[policy.type] ?? FileText;
        const label =
          policy.type === "other" && policy.customType
            ? policy.customType
            : typeInfo?.label ?? policy.type;

        return (
          <div className="flex items-center gap-2">
            <Icon className="size-4 text-muted-foreground" />
            <span>{label}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "carrier",
      header: "Carrier",
      cell: ({ row }) => row.original.carrier || "--",
    },
    {
      accessorKey: "policyNumber",
      header: "Policy #",
      cell: ({ row }) => row.original.policyNumber || "--",
    },
    {
      accessorKey: "premium",
      header: "Premium",
      cell: ({ row }) => formatCurrency(row.original.premium),
    },
    {
      accessorKey: "startDate",
      header: "Start Date",
      cell: ({ row }) => formatDate(row.original.startDate),
    },
    {
      accessorKey: "endDate",
      header: "End Date",
      cell: ({ row }) => formatDate(row.original.endDate),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <PolicyStatusBadge status={row.original.status} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const policy = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(policy)}>
                <Pencil className="size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(policy)}
              >
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: policies,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
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
        {table.getRowModel().rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={columns.length}
              className="h-24 text-center text-muted-foreground"
            >
              No policies found.
            </TableCell>
          </TableRow>
        ) : (
          table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

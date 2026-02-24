"use client";

import { useState } from "react";
import Link from "next/link";
import { format, isPast, isToday } from "date-fns";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle2,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Minus,
  AlertTriangle,
} from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  flexRender,
} from "@tanstack/react-table";
import type { TaskWithRelations, TaskStatus, TaskPriority } from "@anchor/shared";

import { Badge } from "@/components/ui/badge";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TaskTableProps {
  data: TaskWithRelations[];
  onEdit: (task: TaskWithRelations) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; className: string }> = {
  todo: { label: "To Do", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  in_progress: { label: "In Progress", className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  waiting: { label: "Waiting", className: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
  done: { label: "Done", className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
};

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  urgent: { label: "Urgent", icon: AlertTriangle, className: "text-red-600 dark:text-red-400" },
  high: { label: "High", icon: ArrowUp, className: "text-orange-600 dark:text-orange-400" },
  medium: { label: "Medium", icon: Minus, className: "text-yellow-600 dark:text-yellow-400" },
  low: { label: "Low", icon: ArrowDown, className: "text-slate-500 dark:text-slate-400" },
};

function isOverdue(dueDate: string | null, status: TaskStatus): boolean {
  if (!dueDate || status === "done") return false;
  const date = new Date(dueDate);
  return isPast(date) && !isToday(date);
}

export function TaskTable({ data, onEdit, onDelete, onStatusChange }: TaskTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const columns: ColumnDef<TaskWithRelations>[] = [
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const config = STATUS_CONFIG[status];
        return (
          <Badge variant="outline" className={config.className}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => {
        const priority = row.original.priority;
        const config = PRIORITY_CONFIG[priority];
        const Icon = config.icon;
        return (
          <span className={`inline-flex items-center gap-1 text-sm ${config.className}`}>
            <Icon className="size-4" />
            {config.label}
          </span>
        );
      },
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => {
        const { title, type } = row.original;
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{title}</span>
            {type === "renewal" && (
              <Badge variant="secondary" className="bg-blue-50 text-blue-600 text-xs dark:bg-blue-950 dark:text-blue-400">
                Renewal
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "client",
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
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => {
        const { dueDate, status } = row.original;
        if (!dueDate) return <span className="text-muted-foreground">--</span>;
        const overdue = isOverdue(dueDate, status);
        try {
          return (
            <span className={overdue ? "font-medium text-red-600 dark:text-red-400" : ""}>
              {format(new Date(dueDate), "MMM d, yyyy")}
            </span>
          );
        } catch {
          return <span className="text-muted-foreground">--</span>;
        }
      },
    },
    {
      accessorKey: "assignee",
      header: "Assignee",
      cell: ({ row }) => {
        const assignee = row.original.assignee;
        if (!assignee) return <span className="text-muted-foreground">Unassigned</span>;
        return (
          <span>{assignee.firstName} {assignee.lastName}</span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const task = row.original;
        const isRenewal = task.type === "renewal";
        const isDone = task.status === "done";
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isRenewal && (
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Pencil className="size-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {isRenewal && (
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Pencil className="size-4" />
                  Change Status
                </DropdownMenuItem>
              )}
              {isDone ? (
                <DropdownMenuItem onClick={() => onStatusChange(task.id, "todo")}>
                  <RotateCcw className="size-4" />
                  Reopen
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onStatusChange(task.id, "done")}>
                  <CheckCircle2 className="size-4" />
                  Mark as Done
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                variant="destructive"
                onClick={() =>
                  setDeleteTarget({ id: task.id, title: task.title })
                }
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
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <>
      <div className="overflow-x-auto">
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
                No tasks found.
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
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium">{deleteTarget?.title}</span>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  onDelete(deleteTarget.id);
                  setDeleteTarget(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

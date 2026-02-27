"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Search, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import type {
  TaskWithRelations,
  TaskStatus,
  TaskPriority,
  TaskType,
} from "@anchor/shared";
import { TASK_STATUSES, TASK_PRIORITIES } from "@anchor/shared";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskViewToggle, type TaskViewMode } from "./task-view-toggle";
import { TaskTable } from "./task-table";
import { TaskKanban } from "./task-kanban";
import { TaskForm } from "./task-form";

interface PaginatedResponse {
  data: TaskWithRelations[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const STORAGE_KEY = "anchor-task-view-mode";

function getStoredViewMode(): TaskViewMode {
  if (typeof window === "undefined") return "table";
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "kanban" ? "kanban" : "table";
}

export function TaskList() {
  const [viewMode, setViewMode] = useState<TaskViewMode>("table");
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");
  const [typeFilter, setTypeFilter] = useState<TaskType | "all">("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load persisted view mode on mount
  useEffect(() => {
    setViewMode(getStoredViewMode());
  }, []);

  // Persist view mode changes
  const handleViewModeChange = (mode: TaskViewMode) => {
    setViewMode(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  };

  // Debounce search input by 300ms
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (debouncedSearch.trim()) {
        params.set("search", debouncedSearch.trim());
      }
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (priorityFilter !== "all") {
        params.set("priority", priorityFilter);
      }
      if (typeFilter !== "all") {
        params.set("type", typeFilter);
      }
      const result = await api.get<PaginatedResponse>(
        `/api/tasks?${params.toString()}`
      );
      setTasks(result.data);
      setTotalPages(result.totalPages);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load tasks"
      );
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, priorityFilter, typeFilter, page]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    try {
      await api.patch(`/api/tasks/${id}`, { status });
      toast.success("Task status updated");
      fetchTasks();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update task"
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/tasks/${id}`);
      toast.success("Task deleted");
      fetchTasks();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete task"
      );
    }
  };

  const handleEdit = (task: TaskWithRelations) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    fetchTasks();
  };

  const handleFilterReset = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
    setTypeFilter("all");
    setSearchQuery("");
    setPage(1);
  };

  const hasActiveFilters =
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    typeFilter !== "all" ||
    debouncedSearch.trim() !== "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
        <Button onClick={() => setIsFormOpen(true)} className="w-full sm:w-auto">
          <Plus className="size-4" />
          New Task
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-sm sm:flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as TaskStatus | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[calc(50%-6px)] sm:w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {TASK_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={priorityFilter}
          onValueChange={(v) => {
            setPriorityFilter(v as TaskPriority | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[calc(50%-6px)] sm:w-[140px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {TASK_PRIORITIES.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v as TaskType | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[calc(50%-6px)] sm:w-[130px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="renewal">Renewal</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleFilterReset}>
            Clear filters
          </Button>
        )}

        <div className="ml-auto">
          <TaskViewToggle mode={viewMode} onChange={handleViewModeChange} />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          hasFilters={hasActiveFilters}
          onNewTask={() => setIsFormOpen(true)}
        />
      ) : viewMode === "table" ? (
        <TaskTable
          data={tasks}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <TaskKanban
          tasks={tasks}
          onEdit={handleEdit}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Pagination (table view only) */}
      {viewMode === "table" && !loading && tasks.length > 0 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Task form dialog */}
      <TaskForm
        open={isFormOpen}
        task={editingTask}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}

function EmptyState({
  hasFilters,
  onNewTask,
}: {
  hasFilters: boolean;
  onNewTask: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <CheckSquare className="size-6 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground">
        {hasFilters
          ? "No tasks match your filters."
          : "No tasks yet. Create your first task to get started."}
      </p>
      {!hasFilters && (
        <Button onClick={onNewTask}>
          <Plus className="size-4" />
          New Task
        </Button>
      )}
    </div>
  );
}

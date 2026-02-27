"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Receipt,
  Check,
  X,
  Pencil,
  Eye,
  Send,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { ExpenseListItem, ExpenseStatus } from "@anchor/shared";
import { EXPENSE_CATEGORIES } from "@anchor/shared";

import { api } from "@/lib/api";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ExpenseCategoryBadge } from "./expense-category-badge";

// ─── Types ───────────────────────────────────────────────
interface PaginatedExpenses {
  data: ExpenseListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface CategoryOption {
  value: string;
  label: string;
}

interface ExpenseListProps {
  onView: (expense: ExpenseListItem) => void;
  onEdit: (expense: ExpenseListItem) => void;
  refreshKey?: number;
}

// ─── Helpers ─────────────────────────────────────────────
const cadFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
});

const statusColors: Record<ExpenseStatus, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300",
  pending_approval:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  approved:
    "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

const statusLabels: Record<ExpenseStatus, string> = {
  draft: "Draft",
  pending_approval: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

function truncate(str: string | null, maxLength: number): string {
  if (!str) return "-";
  return str.length > maxLength ? str.slice(0, maxLength) + "..." : str;
}

// ─── Component ───────────────────────────────────────────
export function ExpenseList({ onView, onEdit, refreshKey }: ExpenseListProps) {
  const { isAdmin } = useUser();

  // ─── State ─────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("_none");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState<PaginatedExpenses | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  // Rejection dialog state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ─── Fetch categories ──────────────────────────────────
  useEffect(() => {
    api
      .get<CategoryOption[]>("/api/expenses/categories")
      .then(setCategories)
      .catch(() => {
        // Fallback to preset categories
        setCategories(
          EXPENSE_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))
        );
      });
  }, []);

  // ─── Fetch pending count ───────────────────────────────
  const fetchPendingCount = useCallback(async () => {
    try {
      const result = await api.get<{ count: number }>(
        "/api/expenses/pending-count"
      );
      setPendingCount(result.count);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount]);

  // Default to Pending tab if admin and there are pending expenses
  useEffect(() => {
    if (isAdmin && pendingCount > 0 && activeTab === "all") {
      setActiveTab("pending_approval");
    }
    // Only run once when pending count first loads
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, pendingCount]);

  // ─── Fetch expenses ────────────────────────────────────
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (activeTab !== "all") {
        params.set("status", activeTab);
      }
      if (categoryFilter !== "_none") {
        params.set("category", categoryFilter);
      }
      if (dateFrom) {
        params.set("dateFrom", dateFrom);
      }
      if (dateTo) {
        params.set("dateTo", dateTo);
      }
      const result = await api.get<PaginatedExpenses>(
        `/api/expenses?${params.toString()}`
      );
      setResponse(result);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load expenses"
      );
    } finally {
      setLoading(false);
    }
  }, [activeTab, categoryFilter, dateFrom, dateTo, page]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses, refreshKey]);

  // ─── Actions ───────────────────────────────────────────
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPage(1);
  };

  const handleSubmit = async (id: string) => {
    setActionLoading(id);
    try {
      await api.post(`/api/expenses/${id}/submit`);
      toast.success("Expense submitted for approval");
      fetchExpenses();
      fetchPendingCount();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit expense"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await api.post(`/api/expenses/${id}/approve`);
      toast.success("Expense approved");
      fetchExpenses();
      fetchPendingCount();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to approve expense"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    setActionLoading(rejectingId);
    try {
      await api.post(`/api/expenses/${rejectingId}/reject`, {
        rejectionNote: rejectionNote.trim() || undefined,
      });
      toast.success("Expense rejected");
      setRejectingId(null);
      setRejectionNote("");
      fetchExpenses();
      fetchPendingCount();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to reject expense"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    try {
      await api.delete(`/api/expenses/${id}`);
      toast.success("Expense deleted");
      fetchExpenses();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete expense"
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Render helpers ────────────────────────────────────
  const data = response?.data ?? [];
  const totalPages = response?.totalPages ?? 1;

  const renderSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );

  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Receipt className="size-6 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground">No expenses found</p>
    </div>
  );

  const renderActions = (expense: ExpenseListItem) => {
    const isLoading = actionLoading === expense.id;
    const canEdit =
      expense.status === "draft" || expense.status === "rejected";
    const canSubmit = expense.status === "draft";
    const canApprove =
      isAdmin && expense.status === "pending_approval";
    const canDelete =
      expense.status === "draft" || expense.status === "rejected";

    return (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={(e) => {
            e.stopPropagation();
            onView(expense);
          }}
          title="View"
        >
          <Eye className="size-4" />
        </Button>
        {canEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(expense);
            }}
            title="Edit"
          >
            <Pencil className="size-4" />
          </Button>
        )}
        {canSubmit && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={isLoading}
            onClick={(e) => {
              e.stopPropagation();
              handleSubmit(expense.id);
            }}
            title="Submit for approval"
          >
            <Send className="size-4" />
          </Button>
        )}
        {canApprove && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-green-600 hover:text-green-700 hover:bg-green-50"
              disabled={isLoading}
              onClick={(e) => {
                e.stopPropagation();
                handleApprove(expense.id);
              }}
              title="Approve"
            >
              <Check className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              disabled={isLoading}
              onClick={(e) => {
                e.stopPropagation();
                setRejectingId(expense.id);
              }}
              title="Reject"
            >
              <X className="size-4" />
            </Button>
          </>
        )}
        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            disabled={isLoading}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(expense.id);
            }}
            title="Delete"
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
    );
  };

  const renderTable = () => (
    <div className="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Submitted By</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((expense) => (
          <TableRow
            key={expense.id}
            className="cursor-pointer"
            onClick={() => onView(expense)}
          >
            <TableCell>
              {format(new Date(expense.date), "MMM d, yyyy")}
            </TableCell>
            <TableCell>
              <ExpenseCategoryBadge category={expense.category} />
            </TableCell>
            <TableCell className="max-w-[200px]">
              <span className="truncate block">
                {truncate(expense.description, 50)}
              </span>
            </TableCell>
            <TableCell className="text-right font-medium">
              {cadFormatter.format(parseFloat(expense.amount))}
            </TableCell>
            <TableCell>
              {expense.submittedBy.firstName} {expense.submittedBy.lastName}
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={`border-transparent text-[10px] font-medium ${statusColors[expense.status]}`}
              >
                {statusLabels[expense.status]}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              {renderActions(expense)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </div>
  );

  const tabContent = loading ? renderSkeleton() : data.length === 0 ? renderEmpty() : renderTable();

  return (
    <div className="space-y-4">
      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="overflow-x-auto">
            <TabsList className="flex-nowrap">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending_approval" className="gap-1">
                Pending
                {pendingCount > 0 && (
                  <Badge className="ml-1 size-5 items-center justify-center rounded-full p-0 text-[10px]">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-end gap-3 pt-4">
          <div className="w-48">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Category
            </label>
            <Select
              value={categoryFilter}
              onValueChange={(val) => {
                setCategoryFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              From
            </label>
            <Input
              type="date"
              className="h-9 w-40"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              To
            </label>
            <Input
              type="date"
              className="h-9 w-40"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* Tab content - all tabs show same table, filtered by activeTab */}
        <TabsContent value={activeTab} className="pt-2">
          {tabContent}
        </TabsContent>
        {/* Radix Tabs requires matching content for each trigger.
            We use activeTab as a dynamic value, so add forceMount for the dynamic key */}
      </Tabs>

      {/* Pagination */}
      {!loading && (response?.total ?? 0) > 0 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-muted-foreground">
            {response?.total ?? 0} total
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
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
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

      {/* Rejection Note Dialog */}
      <Dialog
        open={rejectingId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRejectingId(null);
            setRejectionNote("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Expense</DialogTitle>
            <DialogDescription>
              Optionally provide a reason for rejecting this expense.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Rejection note (optional)..."
            value={rejectionNote}
            onChange={(e) => setRejectionNote(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectingId(null);
                setRejectionNote("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading !== null}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject Expense"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

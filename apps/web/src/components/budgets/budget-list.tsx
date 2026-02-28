'use client';

import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, Wallet, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import type { Budget } from '@anchor/shared';
import { api } from '@/lib/api';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { BudgetProgressBar } from './budget-progress-bar';
import { BudgetFormDialog } from './budget-form-dialog';

interface ActiveBudgetResponse {
  budget: Budget;
  spending: {
    totalSpent: number;
  };
}

const currencyFormatter = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatDateRange(startDate: string | null, endDate: string | null): string | null {
  if (!startDate && !endDate) return null;
  const start = startDate ? format(new Date(startDate), 'MMM d, yyyy') : 'Open';
  const end = endDate ? format(new Date(endDate), 'MMM d, yyyy') : 'Ongoing';
  return `${start} — ${end}`;
}

export function BudgetList() {
  const { isAdmin } = useUser();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [activeBudgets, setActiveBudgets] = useState<ActiveBudgetResponse[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>(
    undefined
  );
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);
  const [renewingId, setRenewingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [budgetsData, activeData] = await Promise.all([
        api.get<Budget[]>('/api/budgets'),
        api.get<ActiveBudgetResponse[]>('/api/budgets/active'),
      ]);
      setBudgets(budgetsData);
      setActiveBudgets(activeData);
    } catch (error) {
      console.error('Failed to load budgets:', error);
      toast.error('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/budgets/${deleteTarget.id}`);
      toast.success('Budget deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to delete budget';
      toast.error(message);
    }
  };

  const handleRenew = async (budgetId: string) => {
    setRenewingId(budgetId);
    try {
      await api.post(`/api/budgets/${budgetId}/renew`);
      toast.success('Budget renewed successfully');
      fetchData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to renew budget';
      toast.error(message);
    } finally {
      setRenewingId(null);
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingBudget(undefined);
    setFormOpen(true);
  };

  // Build a spending map from active budgets response
  const spendingMap = new Map<string, number>();
  for (const item of activeBudgets) {
    spendingMap.set(item.budget.id, item.spending.totalSpent);
  }

  // Separate active and inactive budgets
  const active = budgets.filter((b) => b.isActive);
  const inactive = budgets.filter((b) => !b.isActive);
  const sortedBudgets = [...active, ...inactive];

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-2 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Empty state
  if (budgets.length === 0) {
    return (
      <>
        <Card className="max-w-lg mx-auto text-center">
          <CardHeader>
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-muted">
              <Wallet className="size-6 text-muted-foreground" />
            </div>
            <CardTitle>No budgets set up yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Create a budget to track spending against limits.
            </p>
            {isAdmin && (
              <Button onClick={handleCreate}>
                <Plus className="size-4" />
                Create Budget
              </Button>
            )}
          </CardContent>
        </Card>

        <BudgetFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          budget={editingBudget}
          onSaved={fetchData}
        />
      </>
    );
  }

  return (
    <>
      {/* Header with create button */}
      {isAdmin && (
        <div className="flex justify-end mb-4">
          <Button onClick={handleCreate}>
            <Plus className="size-4" />
            Create Budget
          </Button>
        </div>
      )}

      {/* Budget cards */}
      <div className="space-y-4">
        {sortedBudgets.map((budget) => {
          const totalSpent = spendingMap.get(budget.id) ?? 0;
          const totalLimit = Number(budget.totalLimit);
          const dateRange = formatDateRange(budget.startDate, budget.endDate);

          return (
            <Card key={budget.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <CardTitle className="text-base">
                        {budget.name}
                      </CardTitle>
                      {dateRange && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {dateRange}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={budget.isActive ? 'default' : 'secondary'}
                      className={
                        budget.isActive
                          ? 'bg-green-600 hover:bg-green-600'
                          : ''
                      }
                    >
                      {budget.isActive ? 'Active' : 'Retired'}
                    </Badge>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleRenew(budget.id)}
                        disabled={renewingId === budget.id}
                        title="Renew budget"
                      >
                        <RefreshCw
                          className={`size-4 ${renewingId === budget.id ? 'animate-spin' : ''}`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleEdit(budget)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteTarget(budget)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Overall budget progress */}
                <BudgetProgressBar
                  category="Overall Budget"
                  spent={totalSpent}
                  limit={totalLimit}
                />

                {/* Budget info footer for inactive */}
                {!budget.isActive && (
                  <p className="text-xs text-muted-foreground">
                    Limit: {currencyFormatter.format(totalLimit)}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Form dialog */}
      <BudgetFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        budget={editingBudget}
        onSaved={fetchData}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Budget</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;?
              Linked expenses will be unlinked (not deleted). This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

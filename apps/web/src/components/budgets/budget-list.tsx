'use client';

import { useEffect, useState, useCallback } from 'react';
import { format, setMonth, setYear } from 'date-fns';
import { Plus, Pencil, Trash2, Wallet } from 'lucide-react';
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

interface CurrentBudgetResponse {
  budget: Budget | null;
  spending: {
    totalSpent: number;
    byCategory: { category: string; spent: number }[];
  } | null;
}

function formatMonthYear(month: number, year: number): string {
  // Create a date for the first of the given month
  let date = new Date(year, month - 1, 1);
  return format(date, 'MMMM yyyy');
}

const currencyFormatter = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function BudgetList() {
  const { isAdmin } = useUser();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [currentBudget, setCurrentBudget] =
    useState<CurrentBudgetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>(
    undefined
  );
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [budgetsData, currentData] = await Promise.all([
        api.get<Budget[]>('/api/budgets'),
        api.get<CurrentBudgetResponse>('/api/budgets/current'),
      ]);
      setBudgets(budgetsData);
      setCurrentBudget(currentData);
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

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingBudget(undefined);
    setFormOpen(true);
  };

  // Separate active and inactive budgets
  const activeBudgets = budgets.filter((b) => b.isActive);
  const inactiveBudgets = budgets.filter((b) => !b.isActive);
  const sortedBudgets = [...activeBudgets, ...inactiveBudgets];

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
              <Skeleton className="h-2 w-1/2" />
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
              Create a monthly budget to track spending against limits.
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
          const isCurrentMonth =
            currentBudget?.budget?.id === budget.id;
          const spending = isCurrentMonth ? currentBudget?.spending : null;
          const totalSpent = spending?.totalSpent ?? 0;
          const totalLimit = Number(budget.totalLimit);

          return (
            <Card key={budget.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base">
                      {formatMonthYear(budget.month, budget.year)}
                    </CardTitle>
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

                {/* Per-category progress bars (only for current active month) */}
                {isCurrentMonth &&
                  spending?.byCategory &&
                  spending.byCategory.length > 0 && (
                    <div className="space-y-3 border-t pt-4">
                      <p className="text-sm font-medium text-muted-foreground">
                        Category Breakdown
                      </p>
                      {budget.categories.map((cat) => {
                        const categorySpending =
                          spending.byCategory.find(
                            (s) => s.category === cat.category
                          )?.spent ?? 0;
                        return (
                          <BudgetProgressBar
                            key={cat.id}
                            category={cat.category}
                            spent={categorySpending}
                            limit={Number(cat.limitAmount)}
                          />
                        );
                      })}
                    </div>
                  )}

                {/* Budget info footer */}
                {!isCurrentMonth && (
                  <p className="text-xs text-muted-foreground">
                    Limit: {currencyFormatter.format(totalLimit)}
                    {budget.categories.length > 0 &&
                      ` (${budget.categories.length} category limits)`}
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
              Are you sure you want to delete the budget for{' '}
              {deleteTarget &&
                formatMonthYear(deleteTarget.month, deleteTarget.year)}
              ? This action cannot be undone.
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

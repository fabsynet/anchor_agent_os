'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, Receipt } from 'lucide-react';
import type { ExpenseListItem } from '@anchor/shared';

import { useUser } from '@/hooks/use-user';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExpenseList } from '@/components/expenses/expense-list';
import { ExpenseFormDialog } from '@/components/expenses/expense-form-dialog';

type DialogMode = 'create' | 'edit' | 'view';

export default function ExpensesPage() {
  const { isAdmin } = useUser();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>('create');
  const [selectedExpense, setSelectedExpense] = useState<ExpenseListItem | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddExpense = useCallback(() => {
    setSelectedExpense(null);
    setDialogMode('create');
    setDialogOpen(true);
  }, []);

  const handleView = useCallback((expense: ExpenseListItem) => {
    setSelectedExpense(expense);
    setDialogMode('view');
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((expense: ExpenseListItem) => {
    setSelectedExpense(expense);
    setDialogMode('edit');
    setDialogOpen(true);
  }, []);

  const handleSaved = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            Track and manage agency expenses
          </p>
        </div>
        <Button onClick={handleAddExpense}>
          <Plus className="size-4" />
          Add Expense
        </Button>
      </div>

      {/* Sub-navigation */}
      <div className="flex gap-4 border-b">
        <Link
          href="/expenses"
          className={cn(
            'pb-2 text-sm font-medium transition-colors hover:text-foreground',
            pathname === '/expenses'
              ? 'border-b-2 border-primary text-foreground'
              : 'text-muted-foreground'
          )}
        >
          Expenses
        </Link>
        <Link
          href="/expenses/budgets"
          className={cn(
            'pb-2 text-sm font-medium transition-colors hover:text-foreground',
            pathname === '/expenses/budgets'
              ? 'border-b-2 border-primary text-foreground'
              : 'text-muted-foreground'
          )}
        >
          Budgets
        </Link>
      </div>

      {/* Expense List */}
      <ExpenseList
        onView={handleView}
        onEdit={handleEdit}
        refreshKey={refreshKey}
      />

      {/* Expense Form Dialog */}
      <ExpenseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        expense={selectedExpense}
        mode={dialogMode}
        onSaved={handleSaved}
      />
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { BudgetList } from '@/components/budgets/budget-list';

export default function BudgetsPage() {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
        <p className="text-muted-foreground">
          Track and manage agency expenses and budgets
        </p>
      </div>

      {/* Sub-navigation */}
      <div className="flex gap-4 border-b overflow-x-auto">
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

      {/* Budget List */}
      <BudgetList />
    </div>
  );
}

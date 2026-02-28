'use client';

import { useEffect, useState } from 'react';
import { DollarSign } from 'lucide-react';

import { useUser } from '@/hooks/use-user';
import { api } from '@/lib/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BudgetProgressBar } from '@/components/budgets/budget-progress-bar';
import { ExpenseDonutChart } from './expense-donut-chart';

interface FinancialData {
  totalSpent: number;
  expenseCount: number;
  topCategory: string | null;
  budgetTotal: number | null;
  budgetUsedPercentage: number | null;
  categories: {
    name: string;
    spent: number;
  }[];
  month: number;
  year: number;
}

const currencyFormatter = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function FinancialWidget() {
  const { profile, isAdmin, isLoading: userLoading } = useUser();
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (userLoading) return;
    if (!profile) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    async function fetchFinancial() {
      try {
        const result = await api.get<FinancialData>(
          '/api/dashboard/financial'
        );
        setData(result);
        setHasAccess(true);
      } catch (error) {
        // 403 means no access -- hide widget silently
        if (error instanceof Error && error.message.includes('permission')) {
          setHasAccess(false);
        } else {
          console.error('Failed to load financial data:', error);
          setHasAccess(false);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchFinancial();
  }, [profile, isAdmin, userLoading]);

  // Don't render at all if user doesn't have access
  if (hasAccess === false) return null;

  // Loading state
  if (loading || hasAccess === null) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-24" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-[200px]" />
            <div className="space-y-3">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-2 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state (no data and admin)
  if (
    data &&
    data.totalSpent === 0 &&
    !data.budgetTotal &&
    data.categories.length === 0
  ) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="size-4 text-muted-foreground" />
            Financial Overview
          </CardTitle>
          <CardDescription>
            {MONTH_NAMES[data.month - 1]} {data.year}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? 'No expenses or budgets yet this month. Set up your first budget from the Expenses page.'
              : 'No financial data available for this month.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  // Prepare chart data from categories
  const chartData = data.categories
    .filter((c) => c.spent > 0)
    .map((c) => ({ name: c.name, value: c.spent }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="size-4 text-muted-foreground" />
          Financial Overview
        </CardTitle>
        <CardDescription>
          {MONTH_NAMES[data.month - 1]} {data.year}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Top section: Donut chart + Summary */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Donut chart */}
          <ExpenseDonutChart data={chartData} total={data.totalSpent} />

          {/* Summary numbers */}
          <div className="flex flex-col justify-center space-y-4">
            {/* Total Spent */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Spent
              </p>
              <p className="text-2xl font-bold">
                {currencyFormatter.format(data.totalSpent)}
              </p>
            </div>

            {/* Expense Count */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Approved Expenses
              </p>
              <p className="text-lg font-semibold">{data.expenseCount}</p>
            </div>

            {/* Top Category */}
            {data.topCategory && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Top Category
                </p>
                <Badge variant="secondary" className="mt-1 capitalize">
                  {data.topCategory.replace(/_/g, ' ')}
                </Badge>
              </div>
            )}

            {/* Budget Usage */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Budget Usage
              </p>
              {data.budgetTotal ? (
                <div className="mt-1 space-y-1">
                  <p className="text-sm font-medium">
                    {data.budgetUsedPercentage}% of{' '}
                    {currencyFormatter.format(data.budgetTotal)}
                  </p>
                  <BudgetProgressBar
                    category=""
                    spent={data.totalSpent}
                    limit={data.budgetTotal}
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  No budget set
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

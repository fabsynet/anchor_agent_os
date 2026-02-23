'use client';

import { cn } from '@/lib/utils';

const currencyFormatter = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

interface BudgetProgressBarProps {
  category: string;
  spent: number;
  limit: number;
}

export function BudgetProgressBar({
  category,
  spent,
  limit,
}: BudgetProgressBarProps) {
  const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;

  // Color coding: < 80% = primary (navy/blue), >= 80% = yellow-500, >= 100% = red-500
  const indicatorColor =
    percentage >= 100
      ? 'bg-red-500'
      : percentage >= 80
        ? 'bg-yellow-500'
        : 'bg-primary';

  const trackColor =
    percentage >= 100
      ? 'bg-red-500/20'
      : percentage >= 80
        ? 'bg-yellow-500/20'
        : 'bg-primary/20';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium capitalize">
          {category.replace(/_/g, ' ')}
        </span>
        <span className="text-muted-foreground">
          {currencyFormatter.format(spent)} / {currencyFormatter.format(limit)}
        </span>
      </div>
      <div
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full',
          trackColor
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            indicatorColor
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PremiumIncome {
  currentMonth: number;
  ytd: number;
  previousMonth: number;
  trendPercentage: number;
}

interface PremiumIncomeProps {
  income: PremiumIncome | null;
  loading: boolean;
}

const currencyFormatter = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function TrendIndicator({ percentage }: { percentage: number }) {
  if (percentage > 0) {
    return (
      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
        <TrendingUp className="size-4" />
        <span className="text-sm font-medium">+{percentage}%</span>
        <span className="text-xs text-muted-foreground">vs last month</span>
      </div>
    );
  }
  if (percentage < 0) {
    return (
      <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
        <TrendingDown className="size-4" />
        <span className="text-sm font-medium">{percentage}%</span>
        <span className="text-xs text-muted-foreground">vs last month</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      <Minus className="size-4" />
      <span className="text-sm font-medium">0%</span>
      <span className="text-xs text-muted-foreground">vs last month</span>
    </div>
  );
}

export function PremiumIncomeCard({ income, loading }: PremiumIncomeProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="size-4 text-muted-foreground" />
          Premium Income
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-32" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* This Month */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                This Month
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(income?.currentMonth ?? 0)}
              </p>
            </div>

            {/* Year to Date */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Year to Date
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(income?.ytd ?? 0)}
              </p>
            </div>

            {/* Trend */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Trend
              </p>
              <TrendIndicator percentage={income?.trendPercentage ?? 0} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

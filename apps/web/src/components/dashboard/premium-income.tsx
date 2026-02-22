'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Stub -- full implementation in Task 2
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

export function PremiumIncomeCard({ income, loading }: PremiumIncomeProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Premium Income</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            ${(income?.currentMonth ?? 0).toLocaleString()} this month
          </p>
        )}
      </CardContent>
    </Card>
  );
}

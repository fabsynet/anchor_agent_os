'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Stub -- full implementation in Task 2
export interface UpcomingRenewal {
  id: string;
  type: string;
  carrier: string | null;
  endDate: string;
  daysRemaining: number;
  client: { id: string; firstName: string; lastName: string };
}

interface RenewalsWidgetProps {
  renewals: UpcomingRenewal[] | null;
  loading: boolean;
}

export function RenewalsWidget({ renewals, loading }: RenewalsWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Upcoming Renewals</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : !renewals || renewals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming renewals</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {renewals.length} renewal(s) upcoming
          </p>
        )}
      </CardContent>
    </Card>
  );
}

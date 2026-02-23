'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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

function DaysRemainingBadge({ days }: { days: number }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        days <= 7
          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          : days <= 30
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      )}
    >
      {days}d
    </span>
  );
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

const PAGE_SIZE = 5;

export function RenewalsWidget({ renewals, loading }: RenewalsWidgetProps) {
  const [page, setPage] = useState(0);
  const allRenewals = renewals ?? [];
  const totalPages = Math.ceil(allRenewals.length / PAGE_SIZE);
  const displayRenewals = allRenewals.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  );

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="size-4 text-muted-foreground" />
          Upcoming Renewals
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-5 w-10" />
              </div>
            ))}
          </div>
        ) : displayRenewals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CalendarClock className="size-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              No upcoming renewals
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-2 text-xs font-medium text-muted-foreground border-b pb-2">
              <span>Policy / Client</span>
              <span className="text-right">Expiry</span>
              <span className="text-right">Days</span>
            </div>

            {displayRenewals.map((renewal) => (
              <div
                key={renewal.id}
                className="grid grid-cols-[1fr_auto_auto] gap-2 items-center text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {capitalize(renewal.type)}
                    {renewal.carrier ? ` - ${renewal.carrier}` : ''}
                  </p>
                  <Link
                    href={`/clients/${renewal.client.id}`}
                    className="text-xs text-muted-foreground hover:text-foreground hover:underline truncate block"
                  >
                    {renewal.client.firstName} {renewal.client.lastName}
                  </Link>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(parseISO(renewal.endDate), 'MMM d, yyyy')}
                </span>
                <DaysRemainingBadge days={renewal.daysRemaining} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
      {allRenewals.length > 0 && (
        <CardFooter className="flex items-center justify-between pt-0">
          {totalPages > 1 ? (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={page <= 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {page + 1}/{totalPages}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          ) : (
            <span />
          )}
          <Link
            href="/policies?status=pending_renewal"
            className="text-xs text-primary hover:underline"
          >
            View all
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}

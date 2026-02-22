'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  Clock,
  CalendarClock,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DashboardSummary {
  overdueCount: number;
  dueTodayCount: number;
  renewalsIn30Days: number;
  activeClients: number;
}

interface SummaryCardsProps {
  summary: DashboardSummary | null;
  loading: boolean;
}

interface StatCardProps {
  title: string;
  value: number | null;
  icon: React.ReactNode;
  loading: boolean;
  urgent?: boolean;
}

function StatCard({ title, value, icon, loading, urgent }: StatCardProps) {
  return (
    <Card
      className={cn(
        urgent && 'border-red-500 dark:border-red-400'
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div
          className={cn(
            'text-muted-foreground',
            urgent && 'text-red-500 dark:text-red-400'
          )}
        >
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div
            className={cn(
              'text-3xl font-bold',
              urgent && 'text-red-600 dark:text-red-400'
            )}
          >
            {value ?? 0}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SummaryCards({ summary, loading }: SummaryCardsProps) {
  const overdueIsUrgent = (summary?.overdueCount ?? 0) > 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Overdue Tasks"
        value={summary?.overdueCount ?? null}
        icon={<AlertTriangle className="size-5" />}
        loading={loading}
        urgent={overdueIsUrgent}
      />
      <StatCard
        title="Due Today"
        value={summary?.dueTodayCount ?? null}
        icon={<Clock className="size-5" />}
        loading={loading}
      />
      <StatCard
        title="Renewals (30 Days)"
        value={summary?.renewalsIn30Days ?? null}
        icon={<CalendarClock className="size-5" />}
        loading={loading}
      />
      <StatCard
        title="Active Clients"
        value={summary?.activeClients ?? null}
        icon={<Users className="size-5" />}
        loading={loading}
      />
    </div>
  );
}

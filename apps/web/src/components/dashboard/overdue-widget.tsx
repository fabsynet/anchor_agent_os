'use client';

import Link from 'next/link';
import { differenceInDays, parseISO } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface OverdueTask {
  id: string;
  title: string;
  priority: string;
  dueDate: string;
  type: string;
  client: { id: string; firstName: string; lastName: string } | null;
}

interface OverdueWidgetProps {
  tasks: OverdueTask[] | null;
  loading: boolean;
}

const priorityConfig: Record<
  string,
  { label: string; className: string }
> = {
  urgent: {
    label: 'Urgent',
    className:
      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-transparent',
  },
  high: {
    label: 'High',
    className:
      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-transparent',
  },
  medium: {
    label: 'Medium',
    className:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-transparent',
  },
  low: {
    label: 'Low',
    className:
      'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-transparent',
  },
};

function getOverdueDuration(dueDate: string): string {
  const days = differenceInDays(new Date(), parseISO(dueDate));
  if (days === 0) return 'Due today';
  if (days === 1) return '1 day overdue';
  return `${days} days overdue`;
}

export function OverdueWidget({ tasks, loading }: OverdueWidgetProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle
            className={cn(
              'size-4',
              tasks && tasks.length > 0
                ? 'text-red-500'
                : 'text-muted-foreground'
            )}
          />
          Overdue Tasks
          {tasks && tasks.length > 0 && (
            <Badge
              variant="destructive"
              className="ml-auto text-xs"
            >
              {tasks.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
            ))}
          </div>
        ) : !tasks || tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="size-8 text-green-500/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              No overdue tasks -- you&apos;re all caught up!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const priority = priorityConfig[task.priority] ?? priorityConfig.low;
              return (
                <div
                  key={task.id}
                  className="flex items-start gap-3 rounded-md border p-3"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">
                        {task.title}
                      </p>
                      {task.type === 'renewal' && (
                        <RefreshCw className="size-3 text-muted-foreground shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {task.client
                        ? (
                          <Link
                            href={`/clients/${task.client.id}`}
                            className="hover:text-foreground hover:underline"
                          >
                            {task.client.firstName} {task.client.lastName}
                          </Link>
                        )
                        : 'No client'}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {getOverdueDuration(task.dueDate)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn('shrink-0 text-xs', priority.className)}
                  >
                    {priority.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

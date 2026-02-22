'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Stub -- full implementation in Task 2
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

export function OverdueWidget({ tasks, loading }: OverdueWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Overdue Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : !tasks || tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No overdue tasks</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {tasks.length} overdue task(s)
          </p>
        )}
      </CardContent>
    </Card>
  );
}

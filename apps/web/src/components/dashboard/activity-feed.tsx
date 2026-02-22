'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Stub -- full implementation in Task 2
export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  client: { id: string; firstName: string; lastName: string };
  user: { id: string; firstName: string; lastName: string };
}

interface ActivityFeedProps {
  activities: ActivityItem[] | null;
  loading: boolean;
}

export function ActivityFeed({ activities, loading }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : !activities || activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {activities.length} recent event(s)
          </p>
        )}
      </CardContent>
    </Card>
  );
}

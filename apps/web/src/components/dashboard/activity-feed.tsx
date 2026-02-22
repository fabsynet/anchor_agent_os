'use client';

import Link from 'next/link';
import { formatDistanceToNow, parseISO } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  UserPlus,
  Shield,
  CheckSquare,
  Edit,
  FileText,
  Activity,
  ListPlus,
  Trash2,
} from 'lucide-react';

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

function getActivityIcon(type: string) {
  switch (type) {
    case 'client_created':
      return <UserPlus className="size-4 text-green-500" />;
    case 'client_updated':
      return <Edit className="size-4 text-blue-500" />;
    case 'policy_created':
      return <Shield className="size-4 text-indigo-500" />;
    case 'policy_updated':
      return <Edit className="size-4 text-blue-500" />;
    case 'policy_cancelled':
    case 'policy_deleted':
      return <Trash2 className="size-4 text-red-500" />;
    case 'task_created':
      return <ListPlus className="size-4 text-purple-500" />;
    case 'task_completed':
      return <CheckSquare className="size-4 text-green-500" />;
    case 'note_added':
      return <FileText className="size-4 text-amber-500" />;
    default:
      return <Activity className="size-4 text-muted-foreground" />;
  }
}

export function ActivityFeed({ activities, loading }: ActivityFeedProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="size-4 text-muted-foreground" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="size-4 rounded-full shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : !activities || activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="size-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  {getActivityIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="text-sm leading-snug">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Link
                      href={`/clients/${item.client.id}`}
                      className="hover:text-foreground hover:underline truncate"
                    >
                      {item.client.firstName} {item.client.lastName}
                    </Link>
                    <span>by {item.user.firstName} {item.user.lastName}</span>
                    <span className="ml-auto whitespace-nowrap">
                      {formatDistanceToNow(parseISO(item.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

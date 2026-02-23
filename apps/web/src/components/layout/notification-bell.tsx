'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}

export function NotificationBell() {
  const [mounted, setMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hydration guard
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await api.get<{ count: number }>('/api/alerts/unread-count');
      setUnreadCount(data.count);
    } catch {
      // Silently fail -- bell is non-critical
    }
  }, []);

  // Poll unread count every 60 seconds
  useEffect(() => {
    if (!mounted) return;
    fetchUnreadCount();
    intervalRef.current = setInterval(fetchUnreadCount, 60000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [mounted, fetchUnreadCount]);

  // Fetch notifications when dropdown opens
  const fetchNotifications = useCallback(async () => {
    setLoadingNotifications(true);
    try {
      const data = await api.get<Notification[]>('/api/alerts?limit=10');
      setNotifications(data);
    } catch {
      // Silently fail
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  // Mark a single notification as read
  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/api/alerts/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Silently fail
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await api.post('/api/alerts/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Silently fail
    }
  };

  if (!mounted) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        {/* Header */}
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-primary hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />

        {/* Notification list */}
        <div className="max-h-80 overflow-y-auto">
          {loadingNotifications ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => {
                  if (!notification.isRead) {
                    handleMarkAsRead(notification.id);
                  }
                }}
                className={cn(
                  'flex w-full gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors',
                  !notification.isRead && 'bg-accent/50'
                )}
              >
                {/* Unread indicator dot */}
                <div className="mt-1.5 shrink-0">
                  <div
                    className={cn(
                      'size-2 rounded-full',
                      notification.isRead
                        ? 'bg-transparent'
                        : 'bg-primary'
                    )}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ActivityEvent, ActivityEventType } from "@anchor/shared";

import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ClientComplianceTabProps {
  clientId: string;
}

interface ComplianceResponse {
  data: ActivityEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const PAGE_SIZE = 20;

const eventTypeColors: Record<string, string> = {
  client_created: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  client_updated: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  client_status_changed: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  note_added: "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300",
  policy_created: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  policy_updated: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  policy_status_changed: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  policy_deleted: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  task_created: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
  task_completed: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  task_status_changed: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  document_uploaded: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  document_deleted: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

const eventTypeLabels: Record<string, string> = {
  client_created: "Client Created",
  client_updated: "Client Updated",
  client_status_changed: "Status Changed",
  note_added: "Note Added",
  policy_created: "Policy Created",
  policy_updated: "Policy Updated",
  policy_status_changed: "Policy Status",
  policy_deleted: "Policy Deleted",
  task_created: "Task Created",
  task_completed: "Task Completed",
  task_status_changed: "Task Status",
  document_uploaded: "Document Uploaded",
  document_deleted: "Document Deleted",
};

export function ClientComplianceTab({ clientId }: ClientComplianceTabProps) {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.get<ComplianceResponse>(
        `/api/compliance?clientId=${clientId}&page=${page}&limit=${PAGE_SIZE}`
      );
      setEvents(result.data);
      setTotalPages(result.totalPages);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load compliance events"
      );
    } finally {
      setLoading(false);
    }
  }, [clientId, page]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  if (loading && events.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!loading && events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ShieldCheck className="size-10 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">
          No compliance events for this client
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Compliance Activity</h3>

      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-start gap-3 rounded-md border p-3"
          >
            <Badge
              variant="outline"
              className={`border-transparent text-[10px] font-medium shrink-0 mt-0.5 ${
                eventTypeColors[event.type] ?? "bg-gray-100 text-gray-800"
              }`}
            >
              {eventTypeLabels[event.type] ?? event.type}
            </Badge>
            <div className="flex-1 min-w-0">
              <p className="text-sm">{event.description}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                {event.user && (
                  <span>
                    {event.user.firstName} {event.user.lastName}
                  </span>
                )}
                <span>
                  {(() => {
                    try {
                      return format(
                        new Date(event.createdAt),
                        "MMM d, yyyy 'at' h:mm a"
                      );
                    } catch {
                      return "--";
                    }
                  })()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

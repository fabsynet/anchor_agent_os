"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NoteForm } from "@/components/timeline/note-form";
import { TimelineList } from "@/components/timeline/timeline-list";
import { TimelineExpanded } from "@/components/timeline/timeline-expanded";
import { List, LayoutGrid, Loader2, MessageSquare } from "lucide-react";

/**
 * Unified timeline item type that merges activity events and notes.
 * The API returns items with a `kind` discriminator field.
 */
export interface TimelineItem {
  id: string;
  kind: "event" | "note";
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
  };
  // Event fields
  type?: string;
  description?: string;
  metadata?: Record<string, unknown> | null;
  // Note fields
  content?: string;
}

interface TimelineResponse {
  data: TimelineItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type ViewMode = "compact" | "expanded";

interface ClientTimelineTabProps {
  clientId: string;
}

export function ClientTimelineTab({ clientId }: ClientTimelineTabProps) {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("compact");

  const fetchTimeline = useCallback(
    async (pageNum: number, append: boolean = false) => {
      try {
        const data = await api.get<TimelineResponse>(
          `/api/clients/${clientId}/timeline?page=${pageNum}&limit=50`
        );
        if (append) {
          setItems((prev) => [...prev, ...data.data]);
        } else {
          setItems(data.data);
        }
        setPage(data.page);
        setTotalPages(data.totalPages);
      } catch {
        // Silently fail -- empty timeline is fine
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [clientId]
  );

  useEffect(() => {
    fetchTimeline(1);
  }, [fetchTimeline]);

  function handleNoteAdded() {
    // Reset to page 1 to see the new note at the top
    setPage(1);
    fetchTimeline(1);
  }

  function handleLoadMore() {
    if (page < totalPages) {
      setLoadingMore(true);
      fetchTimeline(page + 1, true);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Note Form */}
      <NoteForm clientId={clientId} onNoteAdded={handleNoteAdded} />

      {/* View toggle + header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Activity Timeline
        </h3>
        <div className="flex items-center gap-1 rounded-md border p-1">
          <Button
            variant={viewMode === "compact" ? "secondary" : "ghost"}
            size="icon-xs"
            onClick={() => setViewMode("compact")}
            title="Compact view"
          >
            <List className="size-3.5" />
          </Button>
          <Button
            variant={viewMode === "expanded" ? "secondary" : "ghost"}
            size="icon-xs"
            onClick={() => setViewMode("expanded")}
            title="Expanded view"
          >
            <LayoutGrid className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Timeline content */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <MessageSquare className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No activity yet. Add a note to start the timeline.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[600px] overflow-auto">
          {viewMode === "compact" ? (
            <TimelineList items={items} />
          ) : (
            <TimelineExpanded items={items} />
          )}

          {/* Load more */}
          {page < totalPages && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <Loader2 className="animate-spin" />
                ) : null}
                Load more
              </Button>
            </div>
          )}
        </ScrollArea>
      )}
    </div>
  );
}

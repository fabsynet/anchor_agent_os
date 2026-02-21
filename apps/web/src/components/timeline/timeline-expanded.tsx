"use client";

import { format } from "date-fns";
import { ActivityIcon } from "./activity-icon";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import type { TimelineItem } from "@/components/clients/client-timeline-tab";

const EVENT_TYPE_LABELS: Record<string, string> = {
  client_created: "Client Created",
  client_updated: "Client Updated",
  client_status_changed: "Status Changed",
  note_added: "Note Added",
  policy_created: "Policy Created",
  policy_updated: "Policy Updated",
  policy_status_changed: "Policy Status Changed",
  policy_deleted: "Policy Deleted",
};

interface TimelineExpandedProps {
  items: TimelineItem[];
}

export function TimelineExpanded({ items }: TimelineExpandedProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isNote = item.kind === "note";
        const typeLabel = isNote
          ? "Note"
          : EVENT_TYPE_LABELS[item.type ?? ""] ?? "Activity";
        const authorName =
          item.user
            ? `${item.user.firstName} ${item.user.lastName}`
            : null;

        return (
          <Card key={item.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <ActivityIcon
                  type={isNote ? "note_added" : item.type ?? ""}
                />
                <span className="text-sm font-medium">{typeLabel}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {format(new Date(item.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm">
                {isNote ? item.content : item.description}
              </p>
              {authorName && (
                <p className="mt-1 text-xs text-muted-foreground">
                  By {authorName}
                </p>
              )}
              {!isNote && item.metadata && (
                <div className="mt-2 rounded-md bg-muted/50 p-2">
                  <pre className="text-xs text-muted-foreground overflow-x-auto">
                    {JSON.stringify(item.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

"use client";

import { formatDistanceToNow } from "date-fns";
import { ActivityIcon } from "./activity-icon";
import type { TimelineItem } from "@/components/clients/client-timeline-tab";

interface TimelineListProps {
  items: TimelineItem[];
}

export function TimelineList({ items }: TimelineListProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="relative space-y-0">
      {/* Vertical timeline line */}
      <div className="absolute left-[17px] top-2 bottom-2 w-px bg-border" />

      {items.map((item) => {
        const isNote = item.kind === "note";
        const description = isNote
          ? item.content
          : item.description;
        const authorName =
          item.user
            ? `${item.user.firstName} ${item.user.lastName}`
            : null;

        return (
          <div
            key={item.id}
            className="relative flex items-start gap-3 py-2 pl-0"
          >
            {/* Icon circle */}
            <div className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border bg-background">
              <ActivityIcon
                type={isNote ? "note_added" : item.type ?? ""}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-1">
              <p className="text-sm leading-snug">
                {description}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {authorName && (
                  <span className="text-xs text-muted-foreground">
                    {authorName}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(item.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

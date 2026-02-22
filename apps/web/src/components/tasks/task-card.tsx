"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format, formatDistanceToNow, isPast, isToday } from "date-fns";
import { AlertTriangle, ArrowUp, ArrowDown, Minus, Calendar } from "lucide-react";
import type { TaskWithRelations, TaskPriority } from "@anchor/shared";

import { Badge } from "@/components/ui/badge";

interface TaskCardProps {
  task: TaskWithRelations;
  onEdit?: (task: TaskWithRelations) => void;
  overlay?: boolean;
}

const PRIORITY_CONFIG: Record<TaskPriority, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  urgent: { color: "bg-red-500", icon: AlertTriangle },
  high: { color: "bg-orange-500", icon: ArrowUp },
  medium: { color: "bg-yellow-500", icon: Minus },
  low: { color: "bg-slate-400", icon: ArrowDown },
};

function getDueDateInfo(dueDate: string | null, status: string) {
  if (!dueDate) return null;
  const date = new Date(dueDate);
  const overdue = status !== "done" && isPast(date) && !isToday(date);
  const distance = formatDistanceToNow(date, { addSuffix: true });
  const formatted = format(date, "MMM d");
  return { overdue, distance, formatted };
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function TaskCard({ task, onEdit, overlay }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const PriorityIcon = priorityConfig.icon;
  const dueDateInfo = getDueDateInfo(task.dueDate, task.status);

  const cardContent = (
    <div className="space-y-2">
      {/* Title row */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium leading-tight line-clamp-2">
          {task.title}
        </h4>
        <div className={`size-2 shrink-0 rounded-full mt-1.5 ${priorityConfig.color}`} />
      </div>

      {/* Type badge for renewal tasks */}
      {task.type === "renewal" && (
        <Badge variant="secondary" className="bg-blue-50 text-blue-600 text-xs dark:bg-blue-950 dark:text-blue-400">
          Renewal
        </Badge>
      )}

      {/* Client name */}
      {task.client && (
        <p className="text-xs text-muted-foreground truncate">
          {task.client.firstName} {task.client.lastName}
        </p>
      )}

      {/* Bottom row: due date + assignee */}
      <div className="flex items-center justify-between gap-2">
        {dueDateInfo ? (
          <span
            className={`inline-flex items-center gap-1 text-xs ${
              dueDateInfo.overdue
                ? "font-medium text-red-600 dark:text-red-400"
                : "text-muted-foreground"
            }`}
          >
            <Calendar className="size-3" />
            {dueDateInfo.formatted}
          </span>
        ) : (
          <span />
        )}

        {task.assignee ? (
          <div
            className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
            title={`${task.assignee.firstName} ${task.assignee.lastName}`}
          >
            <span className="text-[10px] font-medium">
              {getInitials(task.assignee.firstName, task.assignee.lastName)}
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">--</span>
        )}
      </div>
    </div>
  );

  // When used as overlay (DragOverlay), don't use sortable hooks
  if (overlay) {
    return (
      <div className="rounded-lg border bg-card p-3 shadow-lg cursor-grabbing">
        {cardContent}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="rounded-lg border bg-card p-3 shadow-sm cursor-grab hover:shadow-md transition-shadow active:cursor-grabbing"
      onClick={() => onEdit?.(task)}
    >
      {cardContent}
    </div>
  );
}

"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { TaskWithRelations, TaskStatus } from "@anchor/shared";

import { TaskCard } from "./task-card";

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: TaskWithRelations[];
  label: string;
  color: string;
  onEdit: (task: TaskWithRelations) => void;
}

export function KanbanColumn({
  status,
  tasks,
  label,
  color,
  onEdit,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const taskIds = tasks.map((t) => t.id);

  return (
    <div
      className={`flex min-h-[200px] w-full min-w-[260px] flex-col rounded-lg border bg-muted/30 ${
        isOver ? "ring-2 ring-primary/30" : ""
      }`}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 border-b px-3 py-2.5">
        <div className={`size-2.5 rounded-full ${color}`} />
        <h3 className="text-sm font-medium">{label}</h3>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {tasks.length}
        </span>
      </div>

      {/* Cards container */}
      <div ref={setNodeRef} className="flex flex-1 flex-col gap-2 p-2">
        <SortableContext
          items={taskIds}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={onEdit} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex flex-1 items-center justify-center py-8">
            <p className="text-xs text-muted-foreground">No tasks</p>
          </div>
        )}
      </div>
    </div>
  );
}

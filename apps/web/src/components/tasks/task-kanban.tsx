"use client";

import type { TaskWithRelations, TaskStatus } from "@anchor/shared";

interface TaskKanbanProps {
  tasks: TaskWithRelations[];
  onEdit: (task: TaskWithRelations) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

export function TaskKanban({ tasks, onEdit, onStatusChange }: TaskKanbanProps) {
  // Placeholder -- full implementation in Task 2
  return (
    <div className="text-center py-12 text-muted-foreground">
      Kanban view loading...
    </div>
  );
}

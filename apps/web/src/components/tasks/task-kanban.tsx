"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { TaskWithRelations, TaskStatus } from "@anchor/shared";

import { KanbanColumn } from "./kanban-column";
import { TaskCard } from "./task-card";

interface TaskKanbanProps {
  tasks: TaskWithRelations[];
  onEdit: (task: TaskWithRelations) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: "todo", label: "To Do", color: "bg-slate-500" },
  { status: "in_progress", label: "In Progress", color: "bg-blue-500" },
  { status: "waiting", label: "Waiting", color: "bg-amber-500" },
  { status: "done", label: "Done", color: "bg-green-500" },
];

export function TaskKanban({ tasks, onEdit, onStatusChange }: TaskKanbanProps) {
  const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, TaskWithRelations[]> = {
      todo: [],
      in_progress: [],
      waiting: [],
      done: [],
    };
    for (const task of tasks) {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    }
    return grouped;
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Determine target column status
    // "over" can be either a column (droppable) or another task card (sortable)
    let targetStatus: TaskStatus | null = null;

    // Check if dropped over a column directly
    const columnStatuses = COLUMNS.map((c) => c.status);
    if (columnStatuses.includes(over.id as TaskStatus)) {
      targetStatus = over.id as TaskStatus;
    } else {
      // Dropped over another task card -- find which column that task belongs to
      const overTask = tasks.find((t) => t.id === over.id);
      if (overTask) {
        targetStatus = overTask.status;
      }
    }

    // Only update if status actually changed
    if (targetStatus && targetStatus !== task.status) {
      onStatusChange(taskId, targetStatus);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            tasks={tasksByStatus[col.status]}
            label={col.label}
            color={col.color}
            onEdit={onEdit}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}

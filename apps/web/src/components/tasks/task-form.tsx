"use client";

import type { TaskWithRelations } from "@anchor/shared";

interface TaskFormProps {
  open: boolean;
  task: TaskWithRelations | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function TaskForm({ open, task, onClose, onSuccess }: TaskFormProps) {
  // Placeholder -- full implementation in Task 2
  if (!open) return null;
  return null;
}

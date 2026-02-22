export type TaskStatus = 'todo' | 'in_progress' | 'waiting' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskType = 'manual' | 'renewal';

export interface Task {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  dueDate: string | null;
  assigneeId: string | null;
  clientId: string | null;
  policyId: string | null;
  createdById: string;
  renewalDaysBefore: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskWithRelations extends Task {
  assignee?: { id: string; firstName: string; lastName: string } | null;
  client?: { id: string; firstName: string; lastName: string } | null;
  policy?: {
    id: string;
    type: string;
    carrier: string | null;
    policyNumber: string | null;
  } | null;
}

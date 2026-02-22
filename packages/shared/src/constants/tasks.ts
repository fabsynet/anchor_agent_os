export const TASK_STATUSES = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'done', label: 'Done' },
] as const;

export const TASK_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const;

export const RENEWAL_MILESTONES = [
  { daysBefore: 60, priority: 'medium' as const, label: '60-day reminder' },
  { daysBefore: 30, priority: 'high' as const, label: '30-day reminder' },
  { daysBefore: 7, priority: 'urgent' as const, label: '7-day reminder' },
] as const;

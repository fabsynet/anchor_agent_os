export type ActivityEventType =
  | 'client_created'
  | 'client_updated'
  | 'client_status_changed'
  | 'note_added'
  | 'policy_created'
  | 'policy_updated'
  | 'policy_status_changed'
  | 'policy_deleted'
  | 'task_created'
  | 'task_completed'
  | 'task_status_changed'
  | 'document_uploaded'
  | 'document_deleted';

/** Immutable activity event record for the client timeline. */
export interface ActivityEvent {
  id: string;
  clientId: string;
  userId: string;
  policyId?: string | null;
  type: ActivityEventType;
  description: string;
  /** Old/new values for change tracking, or null */
  metadata: Record<string, unknown> | null;
  /** ISO datetime string */
  createdAt: string;
  /** Populated when fetching timeline with user details */
  user?: {
    firstName: string;
    lastName: string;
  };
  /** Populated when fetching compliance/audit views */
  client?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

/** Immutable note record attached to a client. */
export interface Note {
  id: string;
  clientId: string;
  userId: string;
  content: string;
  /** ISO datetime string */
  createdAt: string;
  /** Populated when fetching notes with user details */
  user?: {
    firstName: string;
    lastName: string;
  };
}

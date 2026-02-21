import {
  UserPlus,
  Pencil,
  ArrowRightLeft,
  MessageSquare,
  FilePlus,
  FileEdit,
  RefreshCw,
  Trash2,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  client_created: UserPlus,
  client_updated: Pencil,
  client_status_changed: ArrowRightLeft,
  note_added: MessageSquare,
  policy_created: FilePlus,
  policy_updated: FileEdit,
  policy_status_changed: RefreshCw,
  policy_deleted: Trash2,
};

interface ActivityIconProps {
  type: string;
  className?: string;
}

export function ActivityIcon({ type, className }: ActivityIconProps) {
  const Icon = ICON_MAP[type] ?? Activity;
  return <Icon className={cn("size-4 text-muted-foreground", className)} />;
}

"use client";

import { List, Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type TaskViewMode = "table" | "kanban";

interface TaskViewToggleProps {
  mode: TaskViewMode;
  onChange: (mode: TaskViewMode) => void;
}

export function TaskViewToggle({ mode, onChange }: TaskViewToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-md border p-1">
      <Button
        variant={mode === "table" ? "secondary" : "ghost"}
        size="icon-sm"
        onClick={() => onChange("table")}
        aria-label="Table view"
      >
        <List className="size-4" />
      </Button>
      <Button
        variant={mode === "kanban" ? "secondary" : "ghost"}
        size="icon-sm"
        onClick={() => onChange("kanban")}
        aria-label="Kanban view"
      >
        <Columns3 className="size-4" />
      </Button>
    </div>
  );
}

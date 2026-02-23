"use client";

import { FolderOpen, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FolderPolicy {
  id: string;
  policyNumber?: string;
  type: string;
  carrier?: string;
}

interface DocumentFolderViewProps {
  clientId: string;
  policies: FolderPolicy[];
  selectedFolder: string | null;
  onFolderSelect: (folder: string | null) => void;
  documentCounts: Record<string, number>;
}

export function DocumentFolderView({
  policies,
  selectedFolder,
  onFolderSelect,
  documentCounts,
}: DocumentFolderViewProps) {
  // Build the list of folders: General + per-policy
  const folders: {
    id: string;
    label: string;
    sublabel?: string;
    count: number;
  }[] = [
    {
      id: "general",
      label: "General",
      sublabel: "Documents without a specific policy",
      count: documentCounts["general"] ?? 0,
    },
    ...policies.map((p) => ({
      id: p.id,
      label: p.policyNumber ? `${p.type} - #${p.policyNumber}` : p.type,
      sublabel: p.carrier ?? undefined,
      count: documentCounts[p.id] ?? 0,
    })),
  ];

  // Breadcrumb when a folder is selected
  if (selectedFolder) {
    const folder = folders.find((f) => f.id === selectedFolder);
    return (
      <nav className="flex items-center gap-1 text-sm mb-4">
        <button
          type="button"
          onClick={() => onFolderSelect(null)}
          className="text-primary hover:underline font-medium"
        >
          Documents
        </button>
        <ChevronRight className="size-4 text-muted-foreground" />
        <span className="text-muted-foreground">
          {folder?.label ?? selectedFolder}
        </span>
      </nav>
    );
  }

  // Root folder grid
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {folders.map((folder) => (
        <Card
          key={folder.id}
          className="cursor-pointer transition-colors hover:bg-muted/50 py-3"
          onClick={() => onFolderSelect(folder.id)}
        >
          <CardContent className="flex items-center gap-3 p-4">
            <FolderOpen className="size-8 text-amber-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{folder.label}</p>
              {folder.sublabel && (
                <p className="text-xs text-muted-foreground truncate">
                  {folder.sublabel}
                </p>
              )}
            </div>
            {folder.count > 0 && (
              <Badge variant="secondary" className="shrink-0">
                {folder.count}
              </Badge>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

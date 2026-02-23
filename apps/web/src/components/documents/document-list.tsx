"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  FileText,
  Image,
  File,
  Eye,
  Download,
  Trash2,
} from "lucide-react";
import type { DocumentListItem } from "@anchor/shared";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DocumentCategoryBadge } from "./document-category-badge";

interface DocumentListProps {
  documents: DocumentListItem[];
  onPreview: (doc: DocumentListItem) => void;
  onDownload: (doc: DocumentListItem) => void;
  onDelete: (doc: DocumentListItem) => void;
  loading?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPreviewable(mimeType: string): boolean {
  return (
    mimeType === "application/pdf" ||
    mimeType.startsWith("image/")
  );
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType === "application/pdf") {
    return <FileText className="size-5 text-red-500 shrink-0" />;
  }
  if (mimeType.startsWith("image/")) {
    return <Image className="size-5 text-blue-500 shrink-0" />;
  }
  return <File className="size-5 text-muted-foreground shrink-0" />;
}

export function DocumentList({
  documents,
  onPreview,
  onDownload,
  onDelete,
  loading = false,
}: DocumentListProps) {
  const [deleteTarget, setDeleteTarget] = useState<DocumentListItem | null>(
    null
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-md border p-3">
            <Skeleton className="size-5" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-8 w-8" />
          </div>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="size-10 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">
          No documents in this folder
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Use the upload zone above to add files
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center gap-3 rounded-md border p-3 hover:bg-muted/50 transition-colors"
          >
            <FileIcon mimeType={doc.mimeType} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{doc.fileName}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatFileSize(doc.fileSize)}</span>
                <span>-</span>
                {doc.uploadedBy && (
                  <>
                    <span>
                      {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}
                    </span>
                    <span>-</span>
                  </>
                )}
                <span>
                  {(() => {
                    try {
                      return format(new Date(doc.createdAt), "MMM d, yyyy");
                    } catch {
                      return "--";
                    }
                  })()}
                </span>
              </div>
            </div>
            <DocumentCategoryBadge category={doc.category} />
            <div className="flex items-center gap-1 shrink-0">
              {isPreviewable(doc.mimeType) && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onPreview(doc)}
                  title="Preview"
                >
                  <Eye className="size-4" />
                  <span className="sr-only">Preview</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onDownload(doc)}
                title="Download"
              >
                <Download className="size-4" />
                <span className="sr-only">Download</span>
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setDeleteTarget(doc)}
                title="Delete"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-4" />
                <span className="sr-only">Delete</span>
              </Button>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium">{deleteTarget?.fileName}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  onDelete(deleteTarget);
                  setDeleteTarget(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

"use client";

import { useState, useCallback } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import type { DocumentCategory, Document as AnchorDocument } from "@anchor/shared";
import { DOCUMENT_CATEGORIES } from "@anchor/shared";

import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DocumentUploadZone } from "./document-upload-zone";

interface DocumentUploadDialogProps {
  clientId: string;
  policyId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete: () => void;
}

interface FileEntry {
  file: File;
  category: DocumentCategory;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentUploadDialog({
  clientId,
  policyId,
  open,
  onOpenChange,
  onUploadComplete,
}: DocumentUploadDialogProps) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFilesSelected = useCallback((files: File[]) => {
    setEntries((prev) => [
      ...prev,
      ...files.map((file) => ({
        file,
        category: "correspondence" as DocumentCategory,
      })),
    ]);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleCategoryChange = useCallback(
    (index: number, category: DocumentCategory) => {
      setEntries((prev) =>
        prev.map((entry, i) => (i === index ? { ...entry, category } : entry))
      );
    },
    []
  );

  const handleUpload = useCallback(async () => {
    if (entries.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      for (const entry of entries) {
        formData.append("files", entry.file);
      }
      if (policyId) {
        formData.append("policyId", policyId);
      }
      formData.append(
        "categories",
        JSON.stringify(entries.map((e) => e.category))
      );

      await api.upload<AnchorDocument[]>(
        `/api/clients/${clientId}/documents`,
        formData
      );

      toast.success(
        `${entries.length} document${entries.length > 1 ? "s" : ""} uploaded`
      );
      setEntries([]);
      onUploadComplete();
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload documents"
      );
    } finally {
      setUploading(false);
    }
  }, [entries, clientId, policyId, onUploadComplete, onOpenChange]);

  const handleClose = useCallback(
    (nextOpen: boolean) => {
      if (!uploading) {
        if (!nextOpen) setEntries([]);
        onOpenChange(nextOpen);
      }
    },
    [uploading, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
          <DialogDescription>
            {entries.length === 0
              ? "Select files to upload"
              : `${entries.length} file${entries.length > 1 ? "s" : ""} selected`}
          </DialogDescription>
        </DialogHeader>

        {entries.length === 0 ? (
          <DocumentUploadZone
            onFilesSelected={handleFilesSelected}
            disabled={uploading}
          />
        ) : (
          <div className="space-y-3">
            {/* File list */}
            <div className="max-h-64 overflow-y-auto space-y-2">
              {entries.map((entry, index) => (
                <div
                  key={`${entry.file.name}-${index}`}
                  className="flex items-center gap-3 rounded-md border p-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {entry.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(entry.file.size)}
                    </p>
                  </div>
                  <Select
                    value={entry.category}
                    onValueChange={(val) =>
                      handleCategoryChange(index, val as DocumentCategory)
                    }
                  >
                    <SelectTrigger className="w-44 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleRemoveFile(index)}
                    disabled={uploading}
                    className="shrink-0"
                  >
                    <X className="size-4" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>
              ))}
            </div>

            {/* Add more files */}
            <DocumentUploadZone
              onFilesSelected={handleFilesSelected}
              disabled={uploading}
            />
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={uploading || entries.length === 0}
          >
            {uploading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Uploading...
              </>
            ) : (
              `Upload ${entries.length} file${entries.length > 1 ? "s" : ""}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

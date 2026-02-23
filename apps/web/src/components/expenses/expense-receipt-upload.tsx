"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import {
  RECEIPT_ALLOWED_MIME_TYPES,
  RECEIPT_MAX_FILE_SIZE,
} from "@anchor/shared";
import type { ExpenseReceipt } from "@anchor/shared";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ExpenseReceiptPreview } from "./expense-receipt-preview";

interface ExpenseReceiptUploadProps {
  onFilesSelected: (files: File[]) => void;
  pendingFiles?: File[];
  onRemovePending?: (index: number) => void;
  existingReceipts?: ExpenseReceipt[];
  onReceiptDeleted?: () => void;
  disabled?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ACCEPT_STRING = RECEIPT_ALLOWED_MIME_TYPES.join(",");

export function ExpenseReceiptUpload({
  onFilesSelected,
  pendingFiles = [],
  onRemovePending,
  existingReceipts = [],
  onReceiptDeleted,
  disabled = false,
}: ExpenseReceiptUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndEmit = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      const validFiles: File[] = [];
      let rejected = 0;

      for (const file of files) {
        if (
          !RECEIPT_ALLOWED_MIME_TYPES.includes(
            file.type as (typeof RECEIPT_ALLOWED_MIME_TYPES)[number]
          )
        ) {
          rejected++;
          toast.error(
            `"${file.name}" is not a supported file type. Please use JPEG, PNG, WebP, or PDF.`
          );
        } else if (file.size > RECEIPT_MAX_FILE_SIZE) {
          rejected++;
          toast.error(
            `"${file.name}" exceeds the 10MB size limit (${formatFileSize(file.size)})`
          );
        } else {
          validFiles.push(file);
        }
      }

      if (rejected > 0 && validFiles.length > 0) {
        toast.info(
          `${validFiles.length} file(s) accepted, ${rejected} rejected`
        );
      }

      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    },
    [onFilesSelected]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setIsDragging(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (disabled) return;
      if (e.dataTransfer.files.length > 0) {
        validateAndEmit(e.dataTransfer.files);
      }
    },
    [disabled, validateAndEmit]
  );

  const handleClick = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        validateAndEmit(e.target.files);
        e.target.value = "";
      }
    },
    [validateAndEmit]
  );

  return (
    <div className="space-y-3">
      {/* Existing receipts (edit mode) */}
      {existingReceipts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Uploaded Receipts
          </p>
          <ExpenseReceiptPreview
            receipts={existingReceipts}
            onDeleted={onReceiptDeleted}
            disabled={disabled}
          />
        </div>
      )}

      {/* Pending files (not yet uploaded) */}
      {pendingFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            New Files ({pendingFiles.length})
          </p>
          <div className="space-y-1">
            {pendingFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-2 rounded-md border p-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                {onRemovePending && !disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                    onClick={() => onRemovePending(index)}
                  >
                    <X className="size-4" />
                    <span className="sr-only">Remove</span>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drop zone */}
      {!disabled && (
        <div
          role="button"
          tabIndex={0}
          onClick={handleClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleClick();
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          <Upload
            className={cn(
              "size-8",
              isDragging ? "text-primary" : "text-muted-foreground"
            )}
          />
          <div>
            <p className="text-sm font-medium">
              Drop receipts here or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPEG, PNG, WebP, or PDF up to 10MB
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPT_STRING}
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}

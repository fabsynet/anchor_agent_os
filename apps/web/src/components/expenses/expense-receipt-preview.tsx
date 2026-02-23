"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Image as ImageIcon, Loader2, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { ExpenseReceipt } from "@anchor/shared";

import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface ExpenseReceiptPreviewProps {
  receipts: ExpenseReceipt[];
  onDeleted?: () => void;
  disabled?: boolean;
}

interface ReceiptUrl {
  receiptId: string;
  url: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPdfMime(mimeType: string): boolean {
  return mimeType === "application/pdf";
}

function isImageMime(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

export function ExpenseReceiptPreview({
  receipts,
  onDeleted,
  disabled = false,
}: ExpenseReceiptPreviewProps) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loadingUrls, setLoadingUrls] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch signed URLs for all receipts
  useEffect(() => {
    if (receipts.length === 0) {
      setLoadingUrls(false);
      return;
    }

    let cancelled = false;

    async function fetchUrls() {
      const urlMap: Record<string, string> = {};
      await Promise.allSettled(
        receipts.map(async (receipt) => {
          try {
            const result = await api.get<{ url: string }>(
              `/api/expenses/receipts/${receipt.id}/url`
            );
            if (!cancelled) {
              urlMap[receipt.id] = result.url;
            }
          } catch {
            // Failed to get URL -- will show fallback
          }
        })
      );
      if (!cancelled) {
        setUrls(urlMap);
        setLoadingUrls(false);
      }
    }

    fetchUrls();
    return () => {
      cancelled = true;
    };
  }, [receipts]);

  const handleDelete = useCallback(
    async (receiptId: string) => {
      setDeletingId(receiptId);
      try {
        await api.delete(`/api/expenses/receipts/${receiptId}`);
        toast.success("Receipt deleted");
        onDeleted?.();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to delete receipt"
        );
      } finally {
        setDeletingId(null);
      }
    },
    [onDeleted]
  );

  const handleOpen = useCallback(
    (receiptId: string) => {
      const url = urls[receiptId];
      if (url) {
        window.open(url, "_blank");
      }
    },
    [urls]
  );

  if (loadingUrls) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading receipts...
      </div>
    );
  }

  if (receipts.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {receipts.map((receipt) => {
        const url = urls[receipt.id];
        const isImage = isImageMime(receipt.mimeType);
        const isPdf = isPdfMime(receipt.mimeType);
        const isDeleting = deletingId === receipt.id;

        return (
          <div
            key={receipt.id}
            className="group relative rounded-lg border overflow-hidden"
          >
            {/* Thumbnail / Icon area */}
            <div
              className="flex items-center justify-center h-24 bg-muted cursor-pointer"
              onClick={() => handleOpen(receipt.id)}
            >
              {isImage && url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={url}
                  alt={receipt.fileName}
                  className="h-full w-full object-cover"
                />
              ) : isPdf ? (
                <FileText className="size-10 text-red-500" />
              ) : (
                <ImageIcon className="size-10 text-muted-foreground" />
              )}
            </div>

            {/* File info */}
            <div className="p-2">
              <p className="text-xs font-medium truncate" title={receipt.fileName}>
                {receipt.fileName}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {formatFileSize(receipt.fileSize)}
              </p>
            </div>

            {/* Action buttons overlay */}
            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {url && (
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="size-6"
                  onClick={() => handleOpen(receipt.id)}
                  title="Open in new tab"
                >
                  <ExternalLink className="size-3" />
                </Button>
              )}
              {!disabled && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="size-6"
                  disabled={isDeleting}
                  onClick={() => handleDelete(receipt.id)}
                  title="Delete receipt"
                >
                  {isDeleting ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Trash2 className="size-3" />
                  )}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

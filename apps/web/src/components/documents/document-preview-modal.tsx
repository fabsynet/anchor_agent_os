"use client";

import { Download, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DocumentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string | null;
  mimeType: string;
  fileName: string;
}

export function DocumentPreviewModal({
  open,
  onOpenChange,
  url,
  mimeType,
  fileName,
}: DocumentPreviewModalProps) {
  const isPdf = mimeType === "application/pdf";
  const isImage = mimeType.startsWith("image/");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">{fileName}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto min-h-0">
          {!url ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground text-sm">
                Loading preview...
              </p>
            </div>
          ) : isPdf ? (
            <iframe
              src={`${url}#toolbar=1`}
              className="w-full h-[70vh] rounded-md border"
              title={fileName}
            />
          ) : isImage ? (
            <img
              src={url}
              alt={fileName}
              className="max-w-full max-h-[70vh] mx-auto object-contain rounded-md"
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <FileText className="size-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Preview not available for this file type
              </p>
              <p className="text-xs text-muted-foreground">
                Click download below to view the file
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {url && (
            <Button asChild variant="outline">
              <a href={url} download={fileName} target="_blank" rel="noopener noreferrer">
                <Download className="size-4" />
                Download
              </a>
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

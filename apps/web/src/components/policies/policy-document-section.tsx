"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { DocumentListItem } from "@anchor/shared";

import { api } from "@/lib/api";
import { DocumentUploadZone } from "@/components/documents/document-upload-zone";
import { DocumentUploadDialog } from "@/components/documents/document-upload-dialog";
import { DocumentList } from "@/components/documents/document-list";
import { DocumentPreviewModal } from "@/components/documents/document-preview-modal";

interface PolicyDocumentSectionProps {
  clientId: string;
  policyId: string;
}

export function PolicyDocumentSection({
  clientId,
  policyId,
}: PolicyDocumentSectionProps) {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Preview modal state
  const [previewDoc, setPreviewDoc] = useState<DocumentListItem | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.get<{ data: DocumentListItem[]; total: number }>(
        `/api/clients/${clientId}/documents?policyId=${policyId}`
      );
      setDocuments(result.data);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load documents"
      );
    } finally {
      setLoading(false);
    }
  }, [clientId, policyId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handlePreview = useCallback(
    async (doc: DocumentListItem) => {
      setPreviewDoc(doc);
      setPreviewUrl(null);
      try {
        const result = await api.get<{ url: string }>(
          `/api/clients/${clientId}/documents/${doc.id}/url`
        );
        setPreviewUrl(result.url);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to get preview URL"
        );
        setPreviewDoc(null);
      }
    },
    [clientId]
  );

  const handleDownload = useCallback(
    async (doc: DocumentListItem) => {
      try {
        const result = await api.get<{ url: string }>(
          `/api/clients/${clientId}/documents/${doc.id}/url`
        );
        window.open(result.url, "_blank");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to get download URL"
        );
      }
    },
    [clientId]
  );

  const handleDelete = useCallback(
    async (doc: DocumentListItem) => {
      try {
        await api.delete(`/api/clients/${clientId}/documents/${doc.id}`);
        toast.success("Document deleted");
        fetchDocuments();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to delete document"
        );
      }
    },
    [clientId, fetchDocuments]
  );

  return (
    <div className="space-y-3">
      {/* Upload zone -- opens upload dialog when files are selected */}
      <DocumentUploadZone
        onFilesSelected={() => setUploadOpen(true)}
      />

      {/* Document list */}
      <DocumentList
        documents={documents}
        onPreview={handlePreview}
        onDownload={handleDownload}
        onDelete={handleDelete}
        loading={loading}
      />

      {/* Upload dialog */}
      <DocumentUploadDialog
        clientId={clientId}
        policyId={policyId}
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploadComplete={fetchDocuments}
      />

      {/* Preview modal */}
      {previewDoc && (
        <DocumentPreviewModal
          open={!!previewDoc}
          onOpenChange={(open) => {
            if (!open) {
              setPreviewDoc(null);
              setPreviewUrl(null);
            }
          }}
          url={previewUrl}
          mimeType={previewDoc.mimeType}
          fileName={previewDoc.fileName}
        />
      )}
    </div>
  );
}

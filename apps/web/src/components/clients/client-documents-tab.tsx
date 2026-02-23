"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { DocumentListItem, Policy } from "@anchor/shared";

import { api } from "@/lib/api";
import { DocumentUploadZone } from "@/components/documents/document-upload-zone";
import { DocumentUploadDialog } from "@/components/documents/document-upload-dialog";
import { DocumentFolderView } from "@/components/documents/document-folder-view";
import { DocumentList } from "@/components/documents/document-list";
import { DocumentPreviewModal } from "@/components/documents/document-preview-modal";
import { Skeleton } from "@/components/ui/skeleton";

interface ClientDocumentsTabProps {
  clientId: string;
}

interface DocumentsResponse {
  data: DocumentListItem[];
  folders: { policyId: string | null; label: string; count: number }[];
  total: number;
}

interface DocumentCountsResponse {
  total: number;
  general: number;
  perPolicy: { policyId: string; count: number }[];
}

type FolderPolicy = {
  id: string;
  policyNumber?: string;
  type: string;
  carrier?: string;
};

export function ClientDocumentsTab({ clientId }: ClientDocumentsTabProps) {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [policies, setPolicies] = useState<FolderPolicy[]>([]);
  const [documentCounts, setDocumentCounts] = useState<Record<string, number>>(
    {}
  );
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  // Upload dialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  // Preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMimeType, setPreviewMimeType] = useState("");
  const [previewFileName, setPreviewFileName] = useState("");

  const fetchDocuments = useCallback(async () => {
    try {
      const [docsRes, countsRes] = await Promise.all([
        api.get<DocumentsResponse>(
          `/api/clients/${clientId}/documents`
        ),
        api.get<DocumentCountsResponse>(
          `/api/clients/${clientId}/documents/counts`
        ),
      ]);

      setDocuments(docsRes.data);

      // Build counts map from countsRes
      const counts: Record<string, number> = {
        general: countsRes.general,
      };
      for (const pc of countsRes.perPolicy) {
        counts[pc.policyId] = pc.count;
      }
      setDocumentCounts(counts);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load documents"
      );
    }
  }, [clientId]);

  const fetchPolicies = useCallback(async () => {
    try {
      const result = await api.get<{
        data: Policy[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/api/clients/${clientId}/policies?limit=100`);
      setPolicies(
        result.data.map((p) => ({
          id: p.id,
          policyNumber: p.policyNumber ?? undefined,
          type: p.type,
          carrier: p.carrier ?? undefined,
        }))
      );
    } catch {
      // Silently handle -- folders will just show General
    }
  }, [clientId]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([fetchDocuments(), fetchPolicies()]);
      setLoading(false);
    }
    init();
  }, [fetchDocuments, fetchPolicies]);

  // Filter documents by selected folder
  const filteredDocuments =
    selectedFolder === null
      ? documents
      : selectedFolder === "general"
        ? documents.filter((d) => !d.policyId)
        : documents.filter((d) => d.policyId === selectedFolder);

  // Upload flow
  const handleFilesSelected = useCallback(
    (files: File[]) => {
      setPendingFiles(files);
      setUploadDialogOpen(true);
    },
    []
  );

  const handleUploadComplete = useCallback(() => {
    setPendingFiles([]);
    fetchDocuments();
  }, [fetchDocuments]);

  // Preview flow
  const handlePreview = useCallback(
    async (doc: DocumentListItem) => {
      try {
        const result = await api.get<{
          url: string;
          mimeType: string;
          fileName: string;
        }>(`/api/clients/${clientId}/documents/${doc.id}/url`);
        setPreviewUrl(result.url);
        setPreviewMimeType(result.mimeType);
        setPreviewFileName(result.fileName);
        setPreviewOpen(true);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to get preview URL"
        );
      }
    },
    [clientId]
  );

  // Download flow
  const handleDownload = useCallback(
    async (doc: DocumentListItem) => {
      try {
        const result = await api.get<{
          url: string;
          mimeType: string;
          fileName: string;
        }>(`/api/clients/${clientId}/documents/${doc.id}/url`);
        window.open(result.url, "_blank");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to get download URL"
        );
      }
    },
    [clientId]
  );

  // Delete flow
  const handleDelete = useCallback(
    async (doc: DocumentListItem) => {
      try {
        await api.delete(`/api/clients/${clientId}/documents/${doc.id}`);
        toast.success(`"${doc.fileName}" deleted`);
        fetchDocuments();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to delete document"
        );
      }
    },
    [clientId, fetchDocuments]
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
    );
  }

  // Determine policyId for upload when inside a policy folder
  const uploadPolicyId =
    selectedFolder && selectedFolder !== "general"
      ? selectedFolder
      : undefined;

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <DocumentUploadZone onFilesSelected={handleFilesSelected} />

      {/* Folder navigation or document list */}
      <DocumentFolderView
        clientId={clientId}
        policies={policies}
        selectedFolder={selectedFolder}
        onFolderSelect={setSelectedFolder}
        documentCounts={documentCounts}
      />

      {selectedFolder !== null && (
        <DocumentList
          documents={filteredDocuments}
          onPreview={handlePreview}
          onDownload={handleDownload}
          onDelete={handleDelete}
        />
      )}

      {/* Upload dialog */}
      <DocumentUploadDialog
        clientId={clientId}
        policyId={uploadPolicyId}
        open={uploadDialogOpen}
        onOpenChange={(open) => {
          setUploadDialogOpen(open);
          if (!open) setPendingFiles([]);
        }}
        onUploadComplete={handleUploadComplete}
      />

      {/* Preview modal */}
      <DocumentPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        url={previewUrl}
        mimeType={previewMimeType}
        fileName={previewFileName}
      />
    </div>
  );
}

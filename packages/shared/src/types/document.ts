export type DocumentCategory =
  | 'policy_document'
  | 'application'
  | 'id_license'
  | 'claim_form'
  | 'proof_of_insurance'
  | 'endorsement'
  | 'cancellation_notice'
  | 'correspondence';

export interface Document {
  id: string;
  tenantId: string;
  clientId: string;
  policyId: string | null;
  uploadedById: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  category: DocumentCategory;
  storagePath: string;
  createdAt: string;
  uploadedBy?: {
    firstName: string;
    lastName: string;
  };
}

/** Lightweight document for list views */
export interface DocumentListItem {
  id: string;
  clientId: string;
  policyId: string | null;
  fileName: string;
  mimeType: string;
  fileSize: number;
  category: DocumentCategory;
  createdAt: string;
  uploadedBy?: {
    firstName: string;
    lastName: string;
  };
}

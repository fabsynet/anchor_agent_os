/**
 * DTO for document upload non-file fields.
 * FormData fields arrive as strings. Minimal validation here; service parses.
 */
export class UploadDocumentDto {
  policyId?: string;
  categories?: string; // JSON string array: '["policy_document","application"]'
}

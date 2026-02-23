import type { DocumentCategory } from '../types/document';

export const DOCUMENT_CATEGORIES: { value: DocumentCategory; label: string }[] = [
  { value: 'policy_document', label: 'Policy Document' },
  { value: 'application', label: 'Application' },
  { value: 'id_license', label: 'ID/License' },
  { value: 'claim_form', label: 'Claim Form' },
  { value: 'proof_of_insurance', label: 'Proof of Insurance' },
  { value: 'endorsement', label: 'Endorsement' },
  { value: 'cancellation_notice', label: 'Cancellation Notice' },
  { value: 'correspondence', label: 'Correspondence' },
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const ALLOWED_EXTENSIONS = '.pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx';

# Phase 4: Documents & Compliance - Research

**Researched:** 2026-02-22
**Domain:** Document upload/storage (Supabase Storage) + Immutable compliance audit log
**Confidence:** HIGH

## Summary

Phase 4 adds two major capabilities: (1) document upload, storage, and retrieval linked to clients/policies with folder-like browsing and category tags, and (2) an immutable compliance activity log that auto-records key actions with filtered viewing at agency-wide and per-client levels.

The document storage architecture routes uploads through the NestJS backend (via Multer memory storage) to Supabase Storage using the service role key. This pattern bypasses Storage RLS entirely and lets the application enforce tenant isolation at the API level, consistent with the existing "all DB access through Prisma" philosophy. Documents are tracked in a Prisma `Document` model with metadata, while the actual file bytes live in Supabase Storage.

The compliance log extends the existing `ActivityEvent` model and `TimelineService` with new event types (`document_uploaded`, `document_deleted`) and a new dedicated `/compliance` endpoint with agency-wide filtering. The existing per-client timeline already displays activity events; the compliance page adds cross-client filtering and a sidebar-accessible view.

**Primary recommendation:** Upload files through the NestJS backend to Supabase Storage using the existing `createSupabaseAdmin` client. Track document metadata in Prisma. Extend the existing `ActivityEvent` model and `TimelineService` for compliance logging. Use native browser capabilities for PDF/image preview (iframe for PDFs, img tags for images) rather than adding a heavy library.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Folder-like structure with auto-generated folders: each client gets a folder, each policy gets a sub-folder
- No manual folder creation -- system generates the hierarchy from client/policy relationships
- Documents carry a predefined category tag; category set: Policy Document, Application, ID/License, Claim Form, Proof of Insurance, Endorsement, Cancellation Notice, Correspondence
- Drag-and-drop zone with click-to-browse fallback (both available)
- Multi-file upload supported -- each file gets the same default category, individually changeable before confirming
- In-app preview for PDFs and images (modal/panel within the app), download button always available
- Word docs and unsupported types show download-only (no preview)
- No document versioning -- each upload is its own document; agent deletes old version manually if needed
- Every document belongs to a client (required), optionally linked to a specific policy under that client
- Documents appear as a "Documents" tab on the client profile page, grouped by policy sub-folders
- Documents also appear in a documents section on the policy detail view (only that policy's docs)
- No standalone /documents page for MVP
- When a policy is deleted, its linked documents move to the client level (lose policy link, keep document)
- Document count badges visible on client list rows and policy cards
- Auto-logged actions: policy created/updated/deleted, task completed, document uploaded/deleted, notes added
- No login events, settings changes, or client CRUD logging for MVP
- Dedicated /compliance page accessible from the sidebar for agency-wide view
- Per-client compliance section on each client's profile (filtered to that client's actions)
- Filters: client, action type, date range, user who performed action, linked policy
- Entries are strictly immutable -- no editing, deleting, or annotating by anyone

### Claude's Discretion
- Supabase Storage bucket configuration and signed URL approach
- File size validation UX (10MB limit from requirements)
- Preview component implementation (embedded viewer vs library)
- Compliance log pagination and sort order
- Exact folder tree UI component and navigation pattern
- Upload progress indicator design

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Already In Project |
|---------|---------|---------|-------------------|
| @supabase/supabase-js | ^2.95.3 | Supabase Storage SDK (via admin client) | YES - apps/api |
| @prisma/client | ^6.19.2 | Document metadata storage | YES - apps/api |
| Multer | built-in | Multipart file upload parsing | YES - @nestjs/platform-express includes it |
| lucide-react | ^0.563.0 | File/folder icons | YES - apps/web |
| date-fns | ^4.1.0 | Date formatting for compliance log | YES - apps/web |
| @tanstack/react-table | ^8.21.3 | Compliance log table | YES - apps/web |
| radix-ui | ^1.4.3 | Dialog for preview modal | YES - apps/web |

### New Dependencies Needed
| Library | Purpose | When to Use |
|---------|---------|-------------|
| None | -- | All needed libraries are already installed |

**No new npm packages required.** The existing stack covers all needs:
- NestJS platform-express already bundles Multer for file uploads
- Supabase JS SDK already installed for Storage operations
- Browser-native iframe/object tags handle PDF preview
- Browser-native img tags handle image preview

**Installation:** No installation needed. All dependencies exist.

## Architecture Patterns

### Recommended Project Structure

**Backend (apps/api/src/):**
```
documents/
  documents.module.ts       # NestJS module
  documents.controller.ts   # REST endpoints with FileInterceptor
  documents.service.ts      # Business logic + Supabase Storage ops
  dto/
    upload-document.dto.ts  # Validation DTO
    search-documents.dto.ts # Query/filter DTO
compliance/
  compliance.module.ts      # NestJS module
  compliance.controller.ts  # GET /api/compliance with filters
  compliance.service.ts     # Query ActivityEvent with filters
  dto/
    search-compliance.dto.ts # Filter DTO
```

**Frontend (apps/web/src/):**
```
components/
  documents/
    document-upload-zone.tsx    # Drag-and-drop + click-to-browse
    document-upload-dialog.tsx  # Multi-file upload confirmation dialog
    document-folder-tree.tsx    # Folder-like navigation (client > policy)
    document-list.tsx           # File list within a folder
    document-preview-modal.tsx  # PDF/image preview dialog
    document-category-badge.tsx # Category tag display
  compliance/
    compliance-table.tsx        # Agency-wide compliance table
    compliance-filters.tsx      # Filter controls
    compliance-client-section.tsx # Per-client compliance section
app/(dashboard)/
  compliance/
    page.tsx                    # /compliance route
```

**Shared (packages/shared/src/):**
```
types/
  document.ts   # Document, DocumentCategory types
validation/
  document.schema.ts  # Zod schemas
constants/
  documents.ts  # DOCUMENT_CATEGORIES constant
```

### Pattern 1: Backend-Mediated File Upload (Recommended)

**What:** Files upload from browser to NestJS backend, which validates and forwards to Supabase Storage using the service role key. The backend creates a Prisma Document record and returns metadata including a signed download URL.

**Why this over direct client upload:** Consistent with the project's "all access through the backend" pattern. The existing `api.ts` client handles auth headers. Tenant isolation is enforced at the API layer, not via Storage RLS policies.

**Upload flow:**
```
Browser (FormData) --> NestJS FileInterceptor (Multer memory storage)
  --> Validate (size, type, tenant)
  --> Supabase Storage upload (service role key, bypasses RLS)
  --> Prisma Document create
  --> Return document metadata + signed URL
```

**NestJS Controller pattern:**
```typescript
// documents.controller.ts
import {
  Controller, Post, Get, Delete, Param, Body, Query,
  UseGuards, UseInterceptors, UploadedFiles, ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { TenantId } from '../auth/decorators/tenant-id.decorator.js';
import type { AuthenticatedUser } from '../auth/guards/jwt-auth.guard.js';
import { DocumentsService } from './documents.service.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

@Controller('clients/:clientId/documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files', 10, {
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
      if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException(`File type ${file.mimetype} not allowed`), false);
      }
    },
  }))
  async upload(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: { policyId?: string; categories?: string },
    // categories is JSON string array: '["Policy Document","Application"]'
  ) {
    return this.documentsService.uploadMany(
      tenantId, clientId, user.id, files, body.policyId, body.categories,
    );
  }

  @Get()
  async findAll(
    @TenantId() tenantId: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Query('policyId') policyId?: string,
    @Query('category') category?: string,
  ) {
    return this.documentsService.findAll(tenantId, clientId, policyId, category);
  }

  @Get(':documentId/url')
  async getSignedUrl(
    @TenantId() tenantId: string,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
  ) {
    return this.documentsService.getSignedUrl(tenantId, clientId, documentId);
  }

  @Delete(':documentId')
  async remove(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
  ) {
    return this.documentsService.remove(tenantId, clientId, documentId, user.id);
  }
}
```

### Pattern 2: Supabase Storage Path Convention

**What:** Files stored with tenant-isolated paths in a single private bucket.

**Path format:** `{tenantId}/{clientId}/{policyId || 'general'}/{uuid}-{filename}`

**Why:**
- Tenant isolation via path prefix (tenantId)
- Maps to folder-like UI structure (client > policy)
- UUID prefix prevents filename collisions
- Single bucket simplifies management

**Bucket configuration:**
```
Bucket name: "documents"
Public: false (private)
File size limit: 10MB (10485760 bytes)
Allowed MIME types: application/pdf, image/*, application/msword,
  application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

### Pattern 3: Signed URLs for Download/Preview

**What:** Generate short-lived signed URLs (60 seconds) for file access. The frontend requests a signed URL from the backend, then uses it directly in an iframe/img tag.

**Why signed URLs over direct download:**
- Browser-native PDF/image rendering in iframe/img requires a URL
- Signed URLs are time-limited (security)
- No need for Storage RLS policies -- service role key generates URLs server-side

**Service pattern:**
```typescript
// In documents.service.ts
async getSignedUrl(tenantId: string, clientId: string, documentId: string) {
  const doc = await this.prisma.tenantClient.document.findFirst({
    where: { id: documentId, clientId },
  });
  if (!doc) throw new NotFoundException('Document not found');

  const { data, error } = await this.supabaseAdmin.storage
    .from('documents')
    .createSignedUrl(doc.storagePath, 60); // 60 seconds

  if (error) throw new Error(`Failed to create signed URL: ${error.message}`);
  return { url: data.signedUrl, mimeType: doc.mimeType, fileName: doc.fileName };
}
```

### Pattern 4: Policy Deletion Document Cascade

**What:** When a policy is deleted, documents linked to that policy should NOT be deleted. Instead, their `policyId` should be set to null (moved to client level).

**Prisma schema approach:** Use `onDelete: SetNull` on the Document-Policy relation. The `policyId` field must be optional (nullable).

```prisma
model Document {
  // ...
  policyId String? @map("policy_id") @db.Uuid
  policy   Policy? @relation(fields: [policyId], references: [id], onDelete: SetNull)
}
```

### Pattern 5: Compliance Log Extension

**What:** The existing `ActivityEvent` model and `TimelineService.createActivityEvent()` already log most required actions. Phase 4 adds two new event types and a dedicated query endpoint.

**New event types to add to schema enum:**
- `document_uploaded`
- `document_deleted`

**Existing events already logged (no changes needed):**
- `policy_created` (logged in PoliciesService.create)
- `policy_updated` (logged in PoliciesService.update)
- `policy_deleted` (logged in PoliciesService.remove)
- `task_completed` (logged in TasksService.update)
- `note_added` (logged in TimelineService.createNote)

**New compliance endpoint pattern:**
```typescript
// compliance.controller.ts
@Controller('compliance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ComplianceController {
  @Get()
  async findAll(
    @TenantId() tenantId: string,
    @Query('clientId') clientId?: string,
    @Query('type') type?: string,
    @Query('userId') userId?: string,
    @Query('policyId') policyId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // Query ActivityEvent with filters
  }
}
```

### Pattern 6: Frontend Upload with FormData

**What:** The existing `api.ts` helper only supports JSON bodies. File uploads need FormData. Extend `api.ts` with an `upload` method that sends FormData without the Content-Type header (browser sets multipart boundary automatically).

```typescript
// Extension to api.ts
upload: async <T>(path: string, formData: FormData): Promise<T> => {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  // Do NOT set Content-Type -- browser sets it with boundary for FormData
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: `Upload failed with status ${response.status}`,
    }));
    throw new Error(error.message);
  }
  return response.json();
},
```

### Anti-Patterns to Avoid
- **Direct Supabase Storage access from frontend:** Breaks the "all access through backend" pattern. Would require Storage RLS policies and expose bucket structure to clients.
- **Storing files in the database:** PostgreSQL is not designed for binary file storage. Use Supabase Storage (S3-compatible) for actual files.
- **Single monolithic upload endpoint:** Use separate endpoints for upload, listing, signed URL generation, and deletion.
- **Relying on Supabase Storage metadata for document tracking:** Always use Prisma Document model as the source of truth. Storage is just the file store.
- **Using a heavy PDF library:** Browser-native iframe/object rendering handles PDFs. No need for react-pdf or pdf.js for simple viewing.

## Database Schema Changes

### New Prisma Models and Enum Changes

```prisma
// Add to DocumentCategory enum
enum DocumentCategory {
  policy_document
  application
  id_license
  claim_form
  proof_of_insurance
  endorsement
  cancellation_notice
  correspondence

  @@map("document_category")
}

// Add new activity event types
enum ActivityEventType {
  // ... existing types ...
  document_uploaded
  document_deleted
  // Keep existing: client_created, client_updated, client_status_changed,
  // note_added, policy_created, policy_updated, policy_status_changed,
  // policy_deleted, task_created, task_completed, task_status_changed

  @@map("activity_event_type")
}

model Document {
  id            String           @id @default(uuid()) @db.Uuid
  tenantId      String           @map("tenant_id") @db.Uuid
  clientId      String           @map("client_id") @db.Uuid
  policyId      String?          @map("policy_id") @db.Uuid
  uploadedById  String           @map("uploaded_by_id") @db.Uuid
  fileName      String           @map("file_name")
  mimeType      String           @map("mime_type")
  fileSize      Int              @map("file_size")     // bytes
  category      DocumentCategory @default(correspondence)
  storagePath   String           @map("storage_path")  // path in Supabase Storage bucket
  createdAt     DateTime         @default(now()) @map("created_at")

  tenant     Tenant  @relation(fields: [tenantId], references: [id])
  client     Client  @relation(fields: [clientId], references: [id], onDelete: Cascade)
  policy     Policy? @relation(fields: [policyId], references: [id], onDelete: SetNull)
  uploadedBy User    @relation("documentUploadedBy", fields: [uploadedById], references: [id])

  @@index([tenantId])
  @@index([clientId])
  @@index([clientId, policyId])
  @@map("documents")
}
```

**Required relation additions on existing models:**
```prisma
// Add to Tenant model:
documents Document[]

// Add to Client model:
documents Document[]

// Add to Policy model:
documents Document[]

// Add to User model:
documentsUploaded Document[] @relation("documentUploadedBy")
```

### ActivityEvent Schema Enhancement

The existing `ActivityEvent` model already has a `metadata` JSON field. For compliance filtering by policyId, we need to also add an optional `policyId` column to `ActivityEvent`:

```prisma
model ActivityEvent {
  // ... existing fields ...
  policyId    String?   @map("policy_id") @db.Uuid

  // Add relation (optional, no cascade -- events persist even if policy deleted)
  policy      Policy?   @relation(fields: [policyId], references: [id], onDelete: SetNull)

  // Add index for compliance filtering
  @@index([tenantId, type])
  @@index([tenantId, createdAt(sort: Desc)])
  @@index([policyId])
}
```

This allows efficient compliance queries filtered by policy without JSON parsing.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multipart parsing | Custom body parser | NestJS FileInterceptor (Multer) | Handles streaming, memory limits, file validation |
| File storage | Database BLOBs or local filesystem | Supabase Storage (S3-compatible) | Scalable, CDN-ready, managed |
| Signed URLs | Custom token-based file access | Supabase `createSignedUrl()` | Time-limited, secure, handles expiration |
| PDF preview | react-pdf / pdf.js library | Native browser iframe/object tag | Zero bundle size, all modern browsers render PDFs natively |
| Image preview | Heavy image viewer library | Native img tag in dialog | Browser handles all common image formats |
| Drag-and-drop | Custom drag event handlers | HTML5 native drag events + simple React state | Simple enough to not need react-dropzone; reduce deps |
| File type detection | Custom magic byte parsing | Multer mimetype + file extension check | Sufficient for upload validation |
| Audit log | Separate logging system | Extend existing ActivityEvent + TimelineService | Already built, tested, and integrated |

**Key insight:** The existing codebase already has the audit trail infrastructure (ActivityEvent + TimelineService). The compliance feature is a query/display layer on top of existing data, not a new system.

## Common Pitfalls

### Pitfall 1: Content-Type Header for FormData Uploads
**What goes wrong:** Setting `Content-Type: application/json` or `Content-Type: multipart/form-data` manually in the fetch request for file uploads.
**Why it happens:** The existing `api.ts` always sets `Content-Type: application/json`.
**How to avoid:** For FormData uploads, do NOT set Content-Type at all. The browser automatically sets it with the correct multipart boundary string. Create a separate `api.upload()` method that omits Content-Type.
**Warning signs:** "Unexpected end of form" errors, empty file buffers, 400 Bad Request.

### Pitfall 2: NestJS Body Size Limit
**What goes wrong:** Uploads over 1MB fail with 413 Payload Too Large.
**Why it happens:** Express (underlying NestJS) has a default body size limit. Multer's memory storage stores the entire file in memory.
**How to avoid:** Configure the body size limit in `main.ts` or directly on the FileInterceptor. For 10MB files, set `app.use(json({ limit: '10mb' }))` or configure Multer's `limits.fileSize`.
**Warning signs:** 413 errors on larger files, uploads of small files work but larger ones fail.

### Pitfall 3: Supabase Storage Bucket Must Be Created Before First Upload
**What goes wrong:** Upload fails with "Bucket not found" error.
**Why it happens:** Supabase Storage buckets must be created before files can be uploaded. This is a one-time setup step.
**How to avoid:** Create the bucket in Supabase Dashboard or via SQL/SDK before deploying. Document this as a setup step. Optionally, have the service check/create on startup.
**Warning signs:** First upload attempt fails, subsequent discussion reveals bucket was never created.

### Pitfall 4: Signed URL Expiration in Preview
**What goes wrong:** User opens preview, goes to make coffee, comes back and the PDF/image no longer loads.
**Why it happens:** Signed URLs expire (60 seconds is too short for viewing).
**How to avoid:** Use a longer expiration for preview URLs (300-600 seconds / 5-10 minutes). Keep short expiration for direct download links. Or re-fetch a fresh URL when the user opens the preview modal.
**Warning signs:** Broken images/PDFs after being left open.

### Pitfall 5: Policy Deletion Must SetNull on Documents
**What goes wrong:** Documents are deleted when a policy is deleted.
**Why it happens:** Using `onDelete: Cascade` instead of `onDelete: SetNull` on the Document-Policy relation.
**How to avoid:** Explicitly set `onDelete: SetNull` on the Document->Policy relation. The policyId field MUST be optional (nullable) for SetNull to work.
**Warning signs:** Missing documents after policy deletion.

### Pitfall 6: ActivityEvent Enum Migration with Supabase
**What goes wrong:** Adding new values to the `ActivityEventType` enum fails or requires complex migration.
**Why it happens:** This project uses `prisma db push` (not migrate). Adding enum values to PostgreSQL requires `ALTER TYPE ... ADD VALUE`.
**How to avoid:** `prisma db push` handles enum changes automatically. Just add the new values to the Prisma schema and run `prisma db push`. Verify the new enum values exist in the database afterward.
**Warning signs:** Prisma client errors about invalid enum values.

### Pitfall 7: Existing Activity Event Logging Must Not Be Disrupted
**What goes wrong:** Adding the `policyId` column to `ActivityEvent` breaks existing event creation code.
**Why it happens:** The `policyId` field is optional, but existing code already stores policyId in the `metadata` JSON field. If you add a required field or change existing code paths, things break.
**How to avoid:** The `policyId` column is optional (nullable). Existing event creation code does not need to change -- they can continue to store policyId in metadata. New document events and the compliance query endpoint can use the new column. Optionally, backfill existing events' policyId from their metadata JSON.
**Warning signs:** Existing timeline events stop being created, policy CRUD operations fail.

### Pitfall 8: FormData with Additional Fields
**What goes wrong:** DTO validation fails because FormData fields arrive as strings, not typed values.
**Why it happens:** FormData sends all values as strings. NestJS class-validator may reject string UUIDs or JSON arrays.
**How to avoid:** Use `@Body()` with relaxed validation for the upload endpoint. Parse the `categories` field as a JSON string array manually in the service. Accept `policyId` as an optional string.
**Warning signs:** 400 validation errors even with correct data.

## Code Examples

### Supabase Storage Upload from NestJS Service
```typescript
// Source: Supabase official docs + existing codebase patterns
import { createSupabaseAdmin } from '../common/config/supabase.config.js';

@Injectable()
export class DocumentsService {
  private readonly supabaseAdmin: SupabaseClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly timelineService: TimelineService,
    private readonly configService: ConfigService,
  ) {
    this.supabaseAdmin = createSupabaseAdmin(configService);
  }

  async uploadMany(
    tenantId: string,
    clientId: string,
    userId: string,
    files: Express.Multer.File[],
    policyId?: string,
    categoriesJson?: string,
  ) {
    // Parse categories JSON string array
    let categories: string[] = [];
    if (categoriesJson) {
      try { categories = JSON.parse(categoriesJson); } catch { /* ignore */ }
    }

    const results = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const category = categories[i] || 'correspondence';
      const uuid = crypto.randomUUID();
      const storagePath = `${tenantId}/${clientId}/${policyId || 'general'}/${uuid}-${file.originalname}`;

      // Upload to Supabase Storage
      const { error } = await this.supabaseAdmin.storage
        .from('documents')
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) throw new Error(`Storage upload failed: ${error.message}`);

      // Create Prisma document record
      const doc = await this.prisma.tenantClient.document.create({
        data: {
          clientId,
          policyId: policyId || null,
          uploadedById: userId,
          fileName: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
          category: category as any,
          storagePath,
        } as any,
      });

      results.push(doc);
    }

    // Log activity event for the upload
    await this.timelineService.createActivityEvent(
      tenantId, clientId, userId,
      'document_uploaded',
      `Uploaded ${files.length} document(s)`,
      { documentIds: results.map(d => d.id), fileNames: files.map(f => f.originalname) },
    );

    return results;
  }
}
```

### Frontend FormData Upload
```typescript
// Extension to apps/web/src/lib/api.ts
upload: async <T>(path: string, formData: FormData): Promise<T> => {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  const headers: Record<string, string> = {};
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  // IMPORTANT: Do NOT set Content-Type for FormData
  // Browser sets it automatically with correct multipart boundary

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: `Upload failed with status ${response.status}`,
    }));
    throw new Error(error.message);
  }

  return response.json();
}
```

### Drag-and-Drop Upload Zone Component
```tsx
// Simplified drag-and-drop pattern using native HTML5 APIs
function DocumentUploadZone({ onFilesSelected }: { onFilesSelected: (files: File[]) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        onFilesSelected(files);
      }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
        isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
      )}
    >
      <Upload className="mx-auto size-8 text-muted-foreground" />
      <p>Drag and drop files here, or click to browse</p>
      <p className="text-xs text-muted-foreground">PDF, images, Word documents up to 10MB</p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          onFilesSelected(files);
          e.target.value = ''; // Reset for re-upload
        }}
      />
    </div>
  );
}
```

### PDF/Image Preview in Modal
```tsx
// Browser-native preview using iframe for PDFs and img for images
function DocumentPreviewModal({ url, mimeType, fileName, open, onClose }) {
  const isPdf = mimeType === 'application/pdf';
  const isImage = mimeType.startsWith('image/');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{fileName}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto">
          {isPdf && (
            <iframe
              src={`${url}#toolbar=1`}
              className="w-full h-[70vh] rounded border"
              title={fileName}
            />
          )}
          {isImage && (
            <img
              src={url}
              alt={fileName}
              className="max-w-full max-h-[70vh] mx-auto object-contain"
            />
          )}
          {!isPdf && !isImage && (
            <div className="text-center py-10 text-muted-foreground">
              Preview not available for this file type.
            </div>
          )}
        </div>
        <DialogFooter>
          <Button asChild>
            <a href={url} download={fileName}>Download</a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Compliance Log Query
```typescript
// compliance.service.ts
async findAll(tenantId: string, filters: SearchComplianceDto) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 25;

  const where: Record<string, unknown> = { tenantId };

  if (filters.clientId) where.clientId = filters.clientId;
  if (filters.type) where.type = filters.type;
  if (filters.userId) where.userId = filters.userId;
  if (filters.policyId) where.policyId = filters.policyId;

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) (where.createdAt as any).gte = new Date(filters.startDate);
    if (filters.endDate) (where.createdAt as any).lte = new Date(filters.endDate);
  }

  const [events, total] = await Promise.all([
    this.prisma.activityEvent.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true } },
        client: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    this.prisma.activityEvent.count({ where }),
  ]);

  return { data: events, total, page, limit, totalPages: Math.ceil(total / limit) };
}
```

## Discretion Recommendations

For items marked as Claude's discretion:

### 1. Supabase Storage Bucket Configuration
**Recommendation:** Single private bucket named `documents`. Service role key for all operations (no Storage RLS needed). File path convention: `{tenantId}/{clientId}/{policyId|general}/{uuid}-{filename}`.
**Confidence:** HIGH

### 2. File Size Validation UX
**Recommendation:** Validate on the client side before upload (check `file.size <= 10 * 1024 * 1024`). Show inline error per-file in the upload confirmation dialog. Also validate server-side via Multer's `limits.fileSize`. Show toast notification on server rejection.
**Confidence:** HIGH

### 3. Preview Component Implementation
**Recommendation:** Use browser-native iframe for PDFs and img tag for images. No third-party library needed. Both work in all modern browsers (Chrome, Firefox, Safari, Edge). Wrap in a Dialog (already available in UI components).
**Confidence:** HIGH

### 4. Compliance Log Pagination and Sort Order
**Recommendation:** Default sort: `createdAt DESC` (newest first). Page size: 25 entries. Use the same pagination pattern as clients/policies lists (page/limit/totalPages response shape).
**Confidence:** HIGH

### 5. Folder Tree UI Component
**Recommendation:** Do NOT build a full tree component. Use a breadcrumb-style navigation: "All Clients > Client Name > Policy Name". List documents in the current "folder" context. On the client Documents tab, show a list of "folders" (one per policy + one "General" folder for unlinked docs). Click a folder to see its documents. This is simpler than a tree widget and matches the existing tab-based UI.
**Confidence:** HIGH

### 6. Upload Progress Indicator
**Recommendation:** Simple approach -- show a loading spinner overlay on the upload zone during upload. For multi-file uploads, show "Uploading X of Y files..." text. Do NOT implement per-byte progress tracking (would require XMLHttpRequest or fetch streaming, adds complexity for minimal value at 10MB max). The upload completes quickly at 10MB.
**Confidence:** HIGH

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct Supabase Storage from frontend | Backend-mediated uploads | Project convention | Consistent auth/tenant isolation |
| react-pdf for PDF viewing | Browser native iframe | Always available | Zero bundle cost |
| react-dropzone library | HTML5 native drag events | HTML5 standard | No extra dependency |
| Separate audit log system | Extend existing ActivityEvent | This project has it built | Reuse, don't rebuild |

## Open Questions

1. **Supabase Storage Bucket Creation**
   - What we know: Bucket must exist before uploads. Can be created via Dashboard or SDK.
   - What's unclear: Whether to create it in a setup script, migration, or manually.
   - Recommendation: Document as a manual setup step (create bucket named "documents" in Supabase Dashboard, set to private, 10MB file size limit). Optionally add a startup check in the DocumentsService that creates the bucket if it doesn't exist.

2. **Existing ActivityEvent policyId Backfill**
   - What we know: Adding optional policyId column to ActivityEvent is non-breaking. Existing events store policyId in metadata JSON.
   - What's unclear: Whether to backfill existing events' policyId from metadata.
   - Recommendation: Skip backfill for MVP. New compliance queries can filter by policyId column for new events, and the metadata JSON for historical data.

3. **NAV_ITEMS Documents Link**
   - What we know: NAV_ITEMS already has a "Documents" entry pointing to `/documents`. But the decision says "No standalone /documents page for MVP."
   - What's unclear: Whether to remove the nav item or redirect to a different page.
   - Recommendation: Replace the Documents nav item with a Compliance nav item (`/compliance`). Or keep Documents but have it redirect to the client list with a note to navigate to a specific client's documents. The compliance page is the one that needs sidebar access.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `apps/api/src/timeline/timeline.service.ts` -- current ActivityEvent creation pattern
- Existing codebase: `apps/api/src/policies/policies.service.ts` -- activity event logging in CRUD operations
- Existing codebase: `apps/api/src/common/config/supabase.config.ts` -- Supabase admin client pattern
- Existing codebase: `apps/api/src/invitations/invitations.service.ts` -- Supabase admin client usage pattern
- Existing codebase: `apps/web/src/lib/api.ts` -- frontend API client pattern
- Existing codebase: `packages/database/prisma/schema.prisma` -- current schema
- Supabase Storage Access Control docs: https://supabase.com/docs/guides/storage/security/access-control
- Supabase Storage Bucket docs: https://supabase.com/docs/guides/storage/buckets/fundamentals
- Supabase Storage Helper Functions: https://supabase.com/docs/guides/storage/schema/helper-functions
- Supabase createSignedUrl API: https://supabase.com/docs/reference/javascript/storage-from-createsignedurl
- Supabase upload API: https://supabase.com/docs/reference/javascript/storage-from-upload
- Supabase Storage Quickstart: https://supabase.com/docs/guides/storage/quickstart

### Secondary (MEDIUM confidence)
- NestJS File Upload docs: https://docs.nestjs.com/techniques/file-upload (page failed to load cleanly, verified via multiple WebSearch results)
- NestJS FileInterceptor/FilesInterceptor patterns verified across multiple community sources

### Tertiary (LOW confidence)
- None -- all findings verified with primary or secondary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already exist in the project, no new deps needed
- Architecture (upload flow): HIGH -- follows exact existing patterns (Supabase admin client, Prisma for metadata, NestJS interceptors)
- Architecture (compliance): HIGH -- extends existing proven ActivityEvent + TimelineService
- Database schema: HIGH -- follows existing Prisma conventions, SetNull behavior verified in Prisma docs
- Pitfalls: HIGH -- based on direct analysis of existing codebase patterns and known Supabase/NestJS behaviors
- Frontend patterns: HIGH -- browser-native PDF/image rendering is well-established, drag-drop uses HTML5 standard

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (30 days -- stable domain, no fast-moving dependencies)

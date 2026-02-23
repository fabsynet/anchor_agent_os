---
phase: 04-documents-and-compliance
plan: 01
subsystem: database, shared
tags: [prisma, document-model, zod, formdata-upload, compliance, activity-events]

# Dependency graph
requires:
  - phase: 02-client-and-policy-management
    provides: Client, Policy, ActivityEvent models and shared types
  - phase: 03-tasks-renewals-dashboard
    provides: Task model, TaskType enum pattern
provides:
  - Document model in Prisma schema with DocumentCategory enum
  - Shared TypeScript types, Zod schemas, and constants for documents
  - ActivityEvent policyId column and document event types
  - Frontend upload() method for FormData file uploads
  - NestJS body size limit configured for 10MB uploads
  - Compliance nav item in sidebar
affects: [04-02-backend-modules, 04-03-document-ui, 04-04-compliance-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "FormData upload method without Content-Type header (browser sets multipart boundary)"
    - "onDelete: SetNull on Document->Policy (docs survive policy deletion)"
    - "searchComplianceSchema with coerce for pagination query params"

key-files:
  created:
    - packages/shared/src/types/document.ts
    - packages/shared/src/constants/documents.ts
    - packages/shared/src/validation/document.schema.ts
  modified:
    - packages/database/prisma/schema.prisma
    - packages/shared/src/types/activity.ts
    - packages/shared/src/constants/roles.ts
    - packages/shared/src/index.ts
    - apps/web/src/lib/api.ts
    - apps/api/src/main.ts

key-decisions:
  - "onDelete: SetNull on Document->Policy relation (documents move to client level when policy deleted)"
  - "NAV_ITEMS changed from Documents to Compliance (no standalone /documents page)"
  - "ActivityEvent gets policyId column for document and compliance tracking"
  - "json({ limit: 11mb }) for Express body parser to support 10MB uploads plus metadata"

patterns-established:
  - "DocumentCategory enum mirrors between Prisma and shared types"
  - "upload() method in api.ts sends FormData without Content-Type (browser boundary)"
  - "searchComplianceSchema uses z.coerce for query param pagination"

# Metrics
duration: 6min
completed: 2026-02-22
---

# Phase 4 Plan 01: Data Foundation Summary

**Document model with 8-category enum in Prisma, shared types/schemas/constants, FormData upload helper, and Compliance nav item**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-23T02:54:48Z
- **Completed:** 2026-02-23T03:00:38Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Document model in Prisma with DocumentCategory enum, tenant/client/policy/user relations, and correct onDelete behaviors
- ActivityEvent extended with policyId column, Policy relation, document_uploaded/document_deleted event types, and additional indexes
- Shared package exports Document types, Zod validation schemas, and document constants (categories, MIME types, file size limits)
- Frontend api.ts has upload() method for FormData file uploads with 401 retry logic
- NestJS body size limit raised to 11mb for file upload support
- Sidebar navigation updated: Documents -> Compliance (/compliance)

## Task Commits

Each task was committed atomically:

1. **Task 1: Prisma schema -- Document model and ActivityEvent extensions** - `0a13709` (feat)
2. **Task 2: Shared types, validation, constants + api.ts upload + main.ts body limit + NAV_ITEMS** - `f28a867` (feat)

## Files Created/Modified
- `packages/database/prisma/schema.prisma` - Document model, DocumentCategory enum, ActivityEvent policyId, relation arrays
- `packages/shared/src/types/document.ts` - Document, DocumentListItem, DocumentCategory types
- `packages/shared/src/types/activity.ts` - Added document_uploaded, document_deleted to ActivityEventType; policyId and client fields to ActivityEvent
- `packages/shared/src/constants/documents.ts` - DOCUMENT_CATEGORIES, MAX_FILE_SIZE, ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS
- `packages/shared/src/validation/document.schema.ts` - uploadDocumentSchema, searchDocumentsSchema, searchComplianceSchema
- `packages/shared/src/constants/roles.ts` - NAV_ITEMS: Documents -> Compliance
- `packages/shared/src/index.ts` - Exports for all new document types/constants/schemas
- `apps/web/src/lib/api.ts` - upload() method for FormData
- `apps/api/src/main.ts` - json({ limit: '11mb' }) body size increase

## Decisions Made
- **onDelete: SetNull on Document->Policy:** When a policy is deleted, documents move to client level (policyId becomes null) rather than being deleted
- **NAV_ITEMS Compliance not Documents:** Per user decision, no standalone /documents page; compliance page gets sidebar access
- **ActivityEvent policyId column:** Enables document and compliance event tracking per policy
- **Express body limit 11mb:** 10MB file + form metadata overhead; Multer handles actual multipart parsing

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Document model and all shared types/schemas are ready for backend module implementation (04-02)
- Document UI (04-03) and Compliance UI (04-04) can reference shared types and constants
- Frontend upload helper and body size config are ready for file upload feature
- No blockers for subsequent plans

## Self-Check: PASSED

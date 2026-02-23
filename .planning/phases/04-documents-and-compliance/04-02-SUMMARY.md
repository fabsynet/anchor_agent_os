---
phase: 04-documents-and-compliance
plan: 02
subsystem: api
tags: [nestjs, supabase-storage, multer, documents, compliance, activity-events, prisma]

# Dependency graph
requires:
  - phase: 04-01
    provides: Document model in Prisma schema, shared types/schemas/constants, upload helper, body limit config
  - phase: 02-02
    provides: Clients and Policies backend modules, TimelineService with activity event logging
  - phase: 03-02
    provides: Tasks module with task_completed/task_status_changed activity events
provides:
  - Document CRUD REST API (upload, list, signed URL, delete) under /clients/:clientId/documents
  - Compliance query REST API (paginated, filtered activity events) under /compliance
  - Document count includes in client and policy list responses
  - All COMP-01 activity event types confirmed logged across services
affects: [04-03, 04-04, frontend-documents-ui, frontend-compliance-ui]

# Tech tracking
tech-stack:
  added: ["@types/multer"]
  patterns:
    - "Supabase Storage upload via createSupabaseAdmin with memoryStorage buffer"
    - "Signed URL generation with 300s expiry"
    - "Cross-client compliance queries use raw prisma (not tenantClient) with manual tenantId"
    - "Bucket auto-creation in constructor with try/catch fallback"

key-files:
  created:
    - apps/api/src/documents/documents.module.ts
    - apps/api/src/documents/documents.controller.ts
    - apps/api/src/documents/documents.service.ts
    - apps/api/src/documents/dto/upload-document.dto.ts
    - apps/api/src/documents/dto/search-documents.dto.ts
    - apps/api/src/compliance/compliance.module.ts
    - apps/api/src/compliance/compliance.controller.ts
    - apps/api/src/compliance/compliance.service.ts
    - apps/api/src/compliance/dto/search-compliance.dto.ts
  modified:
    - apps/api/src/app.module.ts
    - apps/api/src/timeline/timeline.service.ts
    - apps/api/src/clients/clients.service.ts
    - apps/api/src/policies/policies.service.ts

key-decisions:
  - "Compliance queries use raw prisma not tenantClient (cross-client, needs manual tenantId)"
  - "Bucket auto-creation in DocumentsService constructor with graceful fallback"
  - "Compliance log strictly read-only (no mutation endpoints)"
  - "Document category from first element of parsed JSON categories array"

patterns-established:
  - "Supabase Storage path: {tenantId}/{clientId}/{policyId|general}/{uuid}-{filename}"
  - "TimelineService.createActivityEvent accepts optional policyId as 8th param"
  - "Cross-tenant compliance queries with tenantId in where clause via raw prisma"

# Metrics
duration: 6min
completed: 2026-02-23
---

# Phase 4 Plan 02: Backend Modules Summary

**Document CRUD API with Supabase Storage (upload/list/signed-URL/delete) and read-only compliance log with filtered ActivityEvent queries, plus document count badges on client and policy lists**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-23T03:06:00Z
- **Completed:** 2026-02-23T03:12:43Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Documents module with 5 REST endpoints: upload (multi-file, 10MB limit, MIME filter), list (with folder grouping), counts, signed URL (300s), delete (storage + DB + activity event)
- Compliance module with 2 GET endpoints: paginated filtered query and action types dropdown data
- All COMP-01 activity event types confirmed logged: policy CRUD, task completion, note added, document upload/delete, client CRUD
- Client and policy list APIs now include document counts for frontend badge display

## Task Commits

Each task was committed atomically:

1. **Task 1: Documents NestJS module** - `f20c11b` (feat)
2. **Task 2: Compliance module + document counts + COMP-01 verification** - `cf478d9` (feat)

## Files Created/Modified
- `apps/api/src/documents/documents.module.ts` - Module registration with TimelineModule import
- `apps/api/src/documents/documents.controller.ts` - 5 endpoints with multer.memoryStorage, JWT + Roles guards
- `apps/api/src/documents/documents.service.ts` - Supabase Storage operations, Prisma CRUD, activity events
- `apps/api/src/documents/dto/upload-document.dto.ts` - FormData fields DTO (policyId, categories)
- `apps/api/src/documents/dto/search-documents.dto.ts` - Query params DTO (policyId, category)
- `apps/api/src/compliance/compliance.module.ts` - Module registration
- `apps/api/src/compliance/compliance.controller.ts` - Read-only GET endpoints with auth guards
- `apps/api/src/compliance/compliance.service.ts` - Paginated ActivityEvent queries with all filters
- `apps/api/src/compliance/dto/search-compliance.dto.ts` - Query params with date range, pagination
- `apps/api/src/app.module.ts` - Added DocumentsModule and ComplianceModule imports
- `apps/api/src/timeline/timeline.service.ts` - Extended createActivityEvent with optional policyId param
- `apps/api/src/clients/clients.service.ts` - Added _count.documents and documentCount in response
- `apps/api/src/policies/policies.service.ts` - Added _count.documents in findAll and findAllForTenant

## Decisions Made
- Compliance queries use raw `this.prisma.activityEvent` (not tenantClient) because compliance is cross-client within a tenant, requiring manual tenantId in the where clause -- same pattern as count() and $transaction
- Bucket auto-creation in DocumentsService constructor wraps in try/catch so service doesn't fail on startup if bucket creation fails
- Compliance log is strictly read-only with no POST/PUT/PATCH/DELETE -- immutable per user decision
- Document category parsed from first element of JSON categories array, defaulting to 'correspondence'
- TimelineService.createActivityEvent extended with backward-compatible optional policyId parameter (8th argument)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**Supabase Storage bucket:** The documents bucket will auto-create on first API start if the service role key has permissions. If auto-creation fails, manually create a "documents" bucket in Supabase Dashboard > Storage (set to private/non-public).

## Next Phase Readiness
- Document and compliance APIs ready for frontend consumption
- All endpoints use JwtAuthGuard + RolesGuard with tenant isolation
- Document counts available on client and policy list responses for badge display
- COMP-01 activity event coverage confirmed across all services

---
*Phase: 04-documents-and-compliance*
*Completed: 2026-02-23*

## Self-Check: PASSED

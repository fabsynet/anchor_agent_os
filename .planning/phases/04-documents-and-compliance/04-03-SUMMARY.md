---
phase: 04-documents-and-compliance
plan: 03
subsystem: ui
tags: [react, nextjs, documents, upload, drag-drop, preview, compliance, folder-navigation, badges]

# Dependency graph
requires:
  - phase: 04-01
    provides: Document model in Prisma schema, shared types/schemas/constants, upload helper, body limit config
  - phase: 04-02
    provides: Document CRUD API, Compliance query API, document count includes in client/policy lists
  - phase: 02-04
    provides: Client profile page with tabs, client overview/timeline/policies tabs
  - phase: 02-03
    provides: Client list page with table/card views
provides:
  - 6 document UI components (upload zone, upload dialog, folder view, document list, preview modal, category badge)
  - ClientDocumentsTab with folder navigation, upload, preview, download, delete
  - ClientComplianceTab with per-client activity event log and pagination
  - Document count badges on client list (table and card views)
  - Policy card document count badges
affects: [04-04, frontend-documents-ui, user-acceptance-testing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "HTML5 native drag-and-drop with hidden file input click-to-browse fallback"
    - "Multi-file upload with per-file category selection via FormData"
    - "Folder-like navigation with breadcrumb for General + per-policy document grouping"
    - "Signed URL fetch for preview/download (PDF iframe, image img, download-only for others)"
    - "Extended local types (PolicyWithCounts, ClientListItemWithDocs) for API response fields not in shared types"

key-files:
  created:
    - apps/web/src/components/documents/document-category-badge.tsx
    - apps/web/src/components/documents/document-upload-zone.tsx
    - apps/web/src/components/documents/document-upload-dialog.tsx
    - apps/web/src/components/documents/document-folder-view.tsx
    - apps/web/src/components/documents/document-list.tsx
    - apps/web/src/components/documents/document-preview-modal.tsx
    - apps/web/src/components/clients/client-documents-tab.tsx
    - apps/web/src/components/clients/client-compliance-tab.tsx
  modified:
    - apps/web/src/app/(dashboard)/clients/[id]/page.tsx
    - apps/web/src/components/clients/client-table.tsx
    - apps/web/src/components/clients/client-cards.tsx

key-decisions:
  - "Extended local types for API response fields (documentCount, _count.documents) not in shared types"
  - "Folder view uses Record<string, number> for document counts with 'general' key for unlinked docs"
  - "Compliance tab is read-only with no filtering (full filters are on standalone /compliance page)"
  - "Document count badges only render when count > 0 to avoid visual clutter"

patterns-established:
  - "DocumentUploadZone as reusable drag-and-drop component with File[] callback"
  - "Signed URL fetch pattern: api.get -> open preview modal or window.open for download"
  - "Compliance tab: simple paginated chronological view filtered to single client"

# Metrics
duration: 13min
completed: 2026-02-23
---

# Phase 4 Plan 03: Document UI & Client Profile Integration Summary

**Full document management UI with drag-and-drop upload, folder navigation, PDF/image preview, and per-client compliance activity tab integrated into client profile**

## Performance

- **Duration:** 13 min
- **Started:** 2026-02-23T03:17:55Z
- **Completed:** 2026-02-23T03:30:34Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- 6 document UI components: upload zone (drag-and-drop + click), upload dialog (multi-file with per-file category), folder view (breadcrumb navigation), document list (with actions), preview modal (PDF iframe, image tag, download-only for unsupported), category badge (color-coded)
- Client profile Documents tab replaces "coming soon" placeholder with full document management: upload, browse folders, preview, download, delete
- Client profile Compliance tab shows per-client activity events in chronological order with pagination (read-only, no filters)
- Document count badges on client list table (Docs column) and card views (Paperclip icon + count)

## Task Commits

Each task was committed atomically:

1. **Task 1: Document UI components (upload, browse, preview, delete)** - `b6b435d` (feat)
2. **Task 2: Client profile tabs (Documents + Compliance) + count badges** - `8c06d5c` (feat)

## Files Created/Modified
- `apps/web/src/components/documents/document-category-badge.tsx` - Color-coded badge per DocumentCategory
- `apps/web/src/components/documents/document-upload-zone.tsx` - Drag-and-drop + click-to-browse with 10MB validation
- `apps/web/src/components/documents/document-upload-dialog.tsx` - Multi-file upload dialog with per-file category selection
- `apps/web/src/components/documents/document-folder-view.tsx` - Breadcrumb folder navigation (General + per-policy)
- `apps/web/src/components/documents/document-list.tsx` - Document list with preview/download/delete actions
- `apps/web/src/components/documents/document-preview-modal.tsx` - PDF iframe, image preview, download-only fallback
- `apps/web/src/components/clients/client-documents-tab.tsx` - Documents tab orchestrating all document components
- `apps/web/src/components/clients/client-compliance-tab.tsx` - Read-only compliance activity log with pagination
- `apps/web/src/app/(dashboard)/clients/[id]/page.tsx` - Added Documents + Compliance tabs to client profile
- `apps/web/src/components/clients/client-table.tsx` - Added Docs column with FileText icon + count
- `apps/web/src/components/clients/client-cards.tsx` - Added document count next to policy count

## Decisions Made
- **Extended local types for API fields:** Backend returns `documentCount` on client list and `_count.documents` on policies, but shared types don't include these. Used local type extensions (`ClientListItemWithDocs`, `PolicyWithCounts`) to type API responses correctly without modifying shared package.
- **Document count badges conditionally rendered:** Only show when count > 0 to avoid clutter with "0 docs" labels everywhere.
- **Compliance tab has no filters:** The plan specifies full filter UI belongs on the standalone /compliance page (Plan 04-04). This tab is a simple chronological view filtered to the client.
- **Folder counts from dedicated API:** Uses `/documents/counts` endpoint for folder badge counts rather than computing from full document list.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `.next/lock` file from parallel build caused full monorepo build to fail on first attempt. Resolved by removing `.next` directory.
- Plan 04-04 had already committed changes to `policy-cards.tsx` (policy detail dialog with `PolicyDocumentSection`) before this plan ran, so those files appeared already committed when staging Task 2.

## User Setup Required

None - no external service configuration required. All document management uses existing backend APIs from Plan 04-02.

## Next Phase Readiness
- Document management frontend complete: upload, browse, preview, download, delete
- Compliance tab shows per-client activity events
- Document count badges visible across client list and policy cards
- Ready for Phase 5 (Expenses & Reporting) or user acceptance testing
- No blockers

---
*Phase: 04-documents-and-compliance*
*Completed: 2026-02-23*

## Self-Check: PASSED

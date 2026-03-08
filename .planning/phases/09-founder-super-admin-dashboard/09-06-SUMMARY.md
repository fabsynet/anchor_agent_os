---
phase: 9
plan: 6
subsystem: admin-frontend
tags: [agencies, data-table, admin-ui, react-table, papaparse]
depends_on:
  requires: ["09-02", "09-04"]
  provides: ["agency-list-page", "agency-detail-page", "agency-management-ui"]
  affects: ["09-07", "09-08"]
tech-stack:
  added: ["@tanstack/react-table", "papaparse"]
  patterns: ["reusable-data-table", "confirmation-dialog", "tab-navigation"]
key-files:
  created:
    - apps/admin/src/components/ui/confirmation-dialog.tsx
    - apps/admin/src/components/ui/data-table.tsx
    - apps/admin/src/components/agencies/agency-table.tsx
    - apps/admin/src/components/agencies/agency-detail-tabs.tsx
    - apps/admin/src/components/agencies/suspend-dialog.tsx
    - apps/admin/src/components/agencies/limits-dialog.tsx
    - apps/admin/src/components/agencies/export-button.tsx
    - apps/admin/src/app/(admin)/agencies/page.tsx
    - apps/admin/src/app/(admin)/agencies/[id]/page.tsx
  modified:
    - apps/admin/package.json
    - pnpm-lock.yaml
decisions:
  - Used manual modal pattern (div overlay) instead of Radix AlertDialog for ConfirmationDialog to avoid additional dependency
  - DataTable uses `ColumnDef<TData, any>` to avoid TypeScript variance issues with mixed column value types
  - CSV export flattens all entities into a single sheet with entity-type column for simplicity
metrics:
  duration: ~15min
  completed: 2026-03-07
---

# Phase 9 Plan 6: Agency Management UI Summary

**Agency list with search/filter, detail page with tabs, suspend/unsuspend/limits/export actions using @tanstack/react-table and PapaParse**

## What Was Built

### Task 1: Shared UI Components and Agency List Page
- **ConfirmationDialog**: Reusable modal with destructive/warning/default variants, optional reason textarea, loading state
- **DataTable**: Generic sortable/paginated table component built on @tanstack/react-table with dark admin theme
- **AgencyTable**: Agency-specific columns (name, province, users/clients/policies counts, status badge, created date) with sorting
- **Agencies page**: Full page with search input, status filter toggle (All/Active/Suspended), server-side pagination via GET /admin/agencies

### Task 2: Agency Detail Page with Tabs and Management Actions
- **Agency detail page**: Header with name, status badge, action buttons (Suspend/Unsuspend, Edit Limits, Export), breadcrumb nav
- **AgencyDetailTabs**: 4-tab layout:
  - Overview: summary stat cards + agency info details
  - Users: table of agency users with role badges and status
  - Policies Summary: counts by status and type from /policies-summary endpoint
  - Activity Log: paginated event list from /activity endpoint
- **SuspendDialog**: Uses ConfirmationDialog, reason required for suspend, optional for unsuspend
- **LimitsDialog**: Form for userCap (1-50) and storageCap (100-10000 MB)
- **ExportButton**: Dropdown with JSON/CSV options, JSON uses Blob download, CSV uses PapaParse unparse

## Task Commits

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Shared UI Components and Agency List Page | 8d0b0d9 | confirmation-dialog.tsx, data-table.tsx, agency-table.tsx, agencies/page.tsx |
| 2 | Agency Detail Page with Tabs and Management Actions | 8a65fb3 | agencies/[id]/page.tsx, agency-detail-tabs.tsx, suspend-dialog.tsx, limits-dialog.tsx, export-button.tsx |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed DataTable column type variance**
- **Found during:** Task 2 build verification
- **Issue:** `ColumnDef<TData, unknown>[]` was incompatible with columns using mixed value types (string, number, boolean)
- **Fix:** Changed to `ColumnDef<TData, any>[]` with eslint-disable comment
- **Files modified:** apps/admin/src/components/ui/data-table.tsx
- **Commit:** 8a65fb3

## Verification

- `pnpm --filter admin build` passes successfully
- Routes `/agencies` and `/agencies/[id]` are generated as dynamic pages

## Self-Check: PASSED

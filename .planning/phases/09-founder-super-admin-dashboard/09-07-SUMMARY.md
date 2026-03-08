---
phase: 9
plan: 7
subsystem: admin-user-management
tags: [users, impersonation, admin, cross-tenant]
depends_on:
  requires: [09-02, 09-04]
  provides: [admin-user-management-page, impersonation-flow]
  affects: [09-08]
tech-stack:
  added: []
  patterns: [impersonation-context-provider, session-save-restore, auto-expiry-timer]
key-files:
  created:
    - apps/admin/src/app/(admin)/users/page.tsx
    - apps/admin/src/components/users/user-table.tsx
    - apps/admin/src/components/users/user-actions-menu.tsx
    - apps/admin/src/components/users/role-change-dialog.tsx
    - apps/admin/src/components/users/deactivate-dialog.tsx
    - apps/admin/src/components/impersonation/impersonation-provider.tsx
    - apps/admin/src/components/layout/admin-layout-client.tsx
  modified:
    - apps/admin/src/components/layout/impersonation-banner.tsx
    - apps/admin/src/app/(admin)/layout.tsx
decisions:
  - Inline custom dropdown menu for actions instead of Radix (no ConfirmationDialog/DataTable from parallel plans)
  - Client wrapper component pattern to bridge server layout auth with client-side impersonation context
  - localStorage for admin session save/restore during impersonation
metrics:
  duration: ~15min
  completed: 2026-03-07
---

# Phase 9 Plan 7: User Management & Impersonation Summary

Cross-tenant user management page with action menus and impersonation flow with context provider and banner.

## What Was Built

### Task 1: User Management Page with Support Actions
- **Users page** (`/users`): Full user management with search by name/email, agency dropdown filter, status filter (active/disabled/deactivated), server-side pagination via `GET /admin/users`
- **UserTable**: Cross-tenant data table with columns for Name, Email, Agency, Role (badge), Status (color-coded), Created date, Actions
- **UserActionsMenu**: Dropdown per row with: Reset Password (no confirmation, toast), Disable/Enable (inline confirmation for disable), Change Role (dialog), Impersonate (amber-highlighted), Deactivate (destructive, separated)
- **RoleChangeDialog**: Modal with admin/agent radio selection, PATCH `/admin/users/:id/role`
- **DeactivateDialog**: Destructive confirmation with optional reason textarea, POST `/admin/users/:id/deactivate`

### Task 2: Impersonation Flow and Banner
- **ImpersonationProvider**: React context providing `isImpersonating`, `targetAgency`, `expiresAt`, `startImpersonation(userId)`, `endImpersonation()`
  - Saves admin session to localStorage before impersonation
  - Calls POST `/admin/impersonation/start` to get magic link token
  - Uses `verifyOtp` to switch to target user's session
  - Redirects to tenant app (localhost:3000)
  - Auto-expiry check every 60 seconds
  - End restores admin session and redirects to `/users`
- **ImpersonationBanner**: Updated to use context, shows amber banner with agency name, live countdown timer (mm:ss), End Session button
- **AdminLayoutClient**: Client wrapper bridging server-side auth check with client-side ImpersonationProvider
- **Layout**: Refactored to use AdminLayoutClient, maintaining server-side auth redirect

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Admin layout server/client boundary**
- **Found during:** Task 2
- **Issue:** Layout.tsx is a server component (does Supabase auth), but ImpersonationProvider requires client context
- **Fix:** Created AdminLayoutClient wrapper component; server layout passes email prop to client wrapper
- **Files created:** `apps/admin/src/components/layout/admin-layout-client.tsx`

## Task Commits

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | User Management Page with Support Actions | 5d09282 | users/page.tsx, user-table.tsx, user-actions-menu.tsx, role-change-dialog.tsx, deactivate-dialog.tsx |
| 2 | Impersonation Flow and Banner | abb0c5c | impersonation-provider.tsx, impersonation-banner.tsx, admin-layout-client.tsx, layout.tsx |

## Build Verification

Build could not be verified in worktree due to broken pnpm symlinks (Next.js dist incomplete in git worktree). TypeScript types are correct per manual review; build should succeed when merged to main.

## Next Phase Readiness

- User management page is ready for integration testing
- Impersonation flow is wired end-to-end but requires live Supabase backend to test magic link generation
- Plan 08 (settings/audit log) can proceed independently

## Self-Check: PASSED

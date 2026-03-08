---
phase: 9
plan: 4
subsystem: admin-api
tags: [agencies, users, impersonation, suspension, admin-endpoints]
depends_on: ["09-01", "09-03"]
provides: ["agency-management-api", "user-management-api", "impersonation-api", "tenant-suspension-enforcement"]
affects: ["09-05", "09-06", "09-07"]
tech-stack:
  added: []
  patterns: ["cross-tenant-admin-queries", "supabase-admin-user-management", "magic-link-impersonation"]
key-files:
  created:
    - apps/api/src/admin/agencies/agencies.service.ts
    - apps/api/src/admin/agencies/agencies.controller.ts
    - apps/api/src/admin/users/users.service.ts
    - apps/api/src/admin/users/users.controller.ts
    - apps/api/src/admin/impersonation/impersonation.service.ts
    - apps/api/src/admin/impersonation/impersonation.controller.ts
  modified:
    - apps/api/src/auth/guards/jwt-auth.guard.ts
    - apps/api/src/admin/admin.module.ts
decisions:
  - "Suspension check inserted between tenant resolution and auto-provision in JwtAuthGuard"
  - "Impersonation uses Supabase magic link generation for session assumption"
  - "All admin services use raw prisma for cross-tenant queries"
metrics:
  duration: "~15 min"
  completed: "2026-03-08"
---

# Phase 9 Plan 4: Agency & User Management API Summary

**One-liner:** Agency CRUD/suspend/export, user disable/enable/role/password-reset, impersonation via magic link, and JwtAuthGuard tenant suspension enforcement.

## Task Commits

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Agencies Service/Controller + JwtAuthGuard Suspension Check | b12fc5e | agencies.service.ts, agencies.controller.ts, jwt-auth.guard.ts |
| 2 | Users Service/Controller + Impersonation + AdminModule Update | da239b1 | users.service.ts, users.controller.ts, impersonation.service.ts, impersonation.controller.ts, admin.module.ts |

## What Was Built

### AgenciesService & Controller (8 endpoints)
- **GET /admin/agencies** - Paginated agency list with search, suspension filter, sorting
- **GET /admin/agencies/:id** - Agency detail with users and entity counts
- **GET /admin/agencies/:id/activity** - Paginated activity log for agency
- **GET /admin/agencies/:id/policies-summary** - Policy counts by status and type
- **POST /admin/agencies/:id/suspend** - Suspend agency (with audit log)
- **POST /admin/agencies/:id/unsuspend** - Unsuspend agency (with audit log)
- **PATCH /admin/agencies/:id/limits** - Update userCap/storageCap (with audit log)
- **GET /admin/agencies/:id/export** - Export all agency data as JSON

### UsersService & Controller (7 endpoints)
- **GET /admin/users** - Cross-tenant user list with search, tenant/active filters
- **GET /admin/users/:id** - User detail with tenant info
- **POST /admin/users/:id/disable** - Disable user (DB + Supabase ban)
- **POST /admin/users/:id/enable** - Enable user (DB + Supabase unban)
- **POST /admin/users/:id/deactivate** - Soft delete with deactivatedAt timestamp
- **PATCH /admin/users/:id/role** - Change role (DB + Supabase user_metadata)
- **POST /admin/users/:id/password-reset** - Generate recovery link via Supabase

### ImpersonationService & Controller (2 endpoints)
- **POST /admin/impersonation/start** - Generate magic link for target user, audit logged
- **POST /admin/impersonation/end** - End impersonation session (audit log only)

### JwtAuthGuard Suspension Check
- Added step 3.5 between tenant resolution and auto-provision
- Queries tenant.isSuspended; throws ForbiddenException if suspended
- Error handling wraps DB failures gracefully (only re-throws HttpExceptions)

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Suspension check at step 3.5 in JwtAuthGuard | After tenantId resolved but before auto-provision, catches all authenticated tenant users |
| Magic link for impersonation | Supabase generateLink creates a valid session token without needing the user's password |
| 876000h ban duration for disable/deactivate | ~100 years effectively permanent; Supabase requires duration string not permanent flag |
| Policy field carrier (not provider) | Schema uses carrier field; fixed during implementation |
| Document fields fileName/fileSize/category | Schema uses these field names; fixed during implementation |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Policy select field name**
- **Found during:** Task 1
- **Issue:** Plan referenced `provider` but schema uses `carrier`
- **Fix:** Changed to `carrier` in export query
- **Files modified:** agencies.service.ts

**2. [Rule 1 - Bug] Fixed Document select field names**
- **Found during:** Task 1
- **Issue:** Plan referenced `name`/`type`/`size` but schema uses `fileName`/`category`/`fileSize`
- **Fix:** Updated to match actual Prisma schema field names
- **Files modified:** agencies.service.ts

## Verification

- `pnpm --filter api exec tsc --noEmit` passes
- `pnpm --filter api build` succeeds

## Self-Check: PASSED

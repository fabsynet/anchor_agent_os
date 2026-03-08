---
phase: 09
plan: 03
subsystem: admin-backend
tags: [nestjs, admin, metrics, health, audit, guard]
depends_on: [09-01]
provides: [admin-api-endpoints, super-admin-guard, platform-metrics]
affects: [09-04, 09-05, 09-06, 09-07]
tech-stack:
  added: []
  patterns: [cross-tenant-queries, supabase-guard-pattern]
key-files:
  created:
    - apps/api/src/auth/guards/super-admin.guard.ts
    - apps/api/src/admin/admin.service.ts
    - apps/api/src/admin/admin.controller.ts
    - apps/api/src/admin/admin.module.ts
    - apps/api/src/admin/audit/audit.controller.ts
  modified:
    - apps/api/src/app.module.ts
decisions:
  - SuperAdminGuard looks up by email in super_admins table (not user ID)
  - All admin queries use raw prisma (no tenantClient, no CLS context)
  - Growth time series defaults to 12 months when no date range provided
  - Engagement defined as user updatedAt within 30 days
  - Health alerts: email failure >10% threshold, inactive agency count
metrics:
  duration: ~8 minutes
  completed: 2026-03-07
---

# Phase 9 Plan 3: Admin Backend API Summary

**One-liner:** NestJS admin module with SuperAdminGuard, cross-tenant platform metrics, growth time series, engagement, and health alert endpoints

## What Was Built

### SuperAdminGuard
- Validates Supabase Bearer token via auth.getUser() (same pattern as JwtAuthGuard)
- Looks up user email in prisma.superAdmin where isActive = true
- Returns ForbiddenException if not found or inactive
- Sets request.user with SuperAdminUser interface (id, email, firstName, lastName, isSuperAdmin)
- Does NOT set CLS tenantId — admin queries are cross-tenant

### AuditController
- GET /admin/audit-logs — paginated list with filters (action, targetType, superAdminId, date range)
- GET /admin/audit-logs/stats — audit log statistics grouped by action (last 30 days)
- Uses existing AuditService from Plan 01

### AdminService
- getPlatformMetrics(startDate?, endDate?) — cross-tenant counts: agencies, users, policies, clients, premium value
- getGrowthTimeSeries(startDate?, endDate?) — monthly data points using date-fns intervals (defaults to 12 months)
- getEngagementMetrics() — active vs inactive agencies based on 30-day user activity
- getHealthAlerts() — email failure rate check (>10% threshold) and inactive agency warnings

### AdminController
- GET /admin/metrics — platform counts with optional date range
- GET /admin/metrics/growth — monthly growth time series
- GET /admin/metrics/engagement — active/inactive agency counts
- GET /admin/health — health alert array

### AdminModule
- Imports ConfigModule and AuditModule
- Registers AdminController and AuditController
- Provides AdminService and SuperAdminGuard
- Exports AuditModule for downstream consumers
- Registered in app.module.ts

## Task Commits

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | SuperAdminGuard and AuditController | f559fa0 | super-admin.guard.ts, audit.controller.ts |
| 2 | AdminModule with Platform Metrics and Health | 02a8646 | admin.service.ts, admin.controller.ts, admin.module.ts, app.module.ts |

## Deviations from Plan

None — plan executed exactly as written.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| SuperAdminGuard looks up by email not auth user ID | SuperAdmin table has its own UUID IDs separate from auth.users; email is the link |
| Growth time series runs N+1 queries per month | Acceptable for admin dashboard (12 months = 36 queries); simpler than raw SQL grouping |
| Engagement uses user.updatedAt not login tracking | No separate login event table; updatedAt is best proxy for activity |

## Verification

- [x] `pnpm --filter api exec tsc --noEmit` passes
- [x] `pnpm --filter api build` succeeds
- [x] SuperAdminGuard rejects non-super-admin requests
- [x] All endpoints behind SuperAdminGuard
- [x] Cross-tenant queries use raw prisma
- [x] AuditModule properly imported and re-exported

## Self-Check: PASSED

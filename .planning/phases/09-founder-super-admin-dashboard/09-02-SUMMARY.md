---
phase: 09
plan: 02
subsystem: admin-app
tags: [next.js, admin, auth, supabase, middleware, layout]
dependency-graph:
  requires: []
  provides: [admin-app-shell, admin-auth, admin-api-client, admin-layout]
  affects: [09-03, 09-04, 09-05, 09-06, 09-07, 09-08]
tech-stack:
  added: []
  patterns: [admin-dark-theme, supabase-middleware-auth, api-client-401-retry]
key-files:
  created:
    - apps/admin/package.json
    - apps/admin/next.config.ts
    - apps/admin/tsconfig.json
    - apps/admin/postcss.config.mjs
    - apps/admin/src/app/layout.tsx
    - apps/admin/src/app/globals.css
    - apps/admin/src/app/(auth)/login/page.tsx
    - apps/admin/src/app/(admin)/layout.tsx
    - apps/admin/src/app/(admin)/page.tsx
    - apps/admin/src/lib/api.ts
    - apps/admin/src/lib/supabase/client.ts
    - apps/admin/src/lib/supabase/server.ts
    - apps/admin/src/lib/supabase/middleware.ts
    - apps/admin/src/middleware.ts
    - apps/admin/src/components/layout/admin-sidebar.tsx
    - apps/admin/src/components/layout/admin-header.tsx
    - apps/admin/src/components/layout/impersonation-banner.tsx
  modified: []
decisions:
  - Admin app uses always-dark theme (no theme toggle) with slate-900/blue-600 palette
  - Created app manually instead of create-next-app (avoids interactive prompts in CI)
  - Middleware uses updateSession helper pattern (same as web app)
metrics:
  duration: ~5 minutes
  completed: 2026-03-07
---

# Phase 09 Plan 02: Admin App Shell & Auth Summary

**One-liner:** Next.js 16 admin app at port 3002 with dark corporate theme, Supabase auth middleware, sidebar layout, and API client with 401 retry

## Task Commits

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Scaffold Admin Next.js App | f46b721 | package.json, next.config.ts, tsconfig.json, layout.tsx, globals.css |
| 2 | Auth, Middleware, Layout, and API Client | e9dcc79 | middleware.ts, api.ts, login/page.tsx, admin-sidebar.tsx, admin-header.tsx |

## What Was Built

### Admin App Scaffold
- Next.js 16 app in `apps/admin` with Tailwind v4 CSS-based config
- Dark corporate theme: slate-900 background, slate-800 cards, blue-600 accent
- Port 3002, transpilePackages for @anchor/shared workspace dependency
- Matching dev dependencies to web app (eslint-config-next, tailwindcss, etc.)

### Authentication & Middleware
- Supabase client/server/middleware following exact web app patterns
- Middleware protects all routes except /login using getUser() validation
- Cookie-based session management with stale token cleanup
- Login page with email+password, no signup (super-admins are invited/seeded)

### Admin Layout
- Sidebar with 5 navigation items: Dashboard, Agencies, Users, Audit Log, Settings
- Lucide-react icons for each nav item
- Active state highlighting with blue-600 accent
- Header with user email display and sign out button
- Impersonation banner component (amber, hidden by default, shows agency name)

### API Client
- Full CRUD methods (get, post, put, patch, delete)
- Auto-attaches Bearer token from Supabase session
- Auto-retry on 401 with token refresh
- Base URL configurable via NEXT_PUBLIC_API_URL

### Dashboard Placeholder
- "Platform Dashboard" heading with 4 placeholder metric cards
- Ready for population in Plan 05

## Decisions Made

1. **Always-dark theme** -- Admin app uses a fixed dark theme (no light/dark toggle) to clearly distinguish from the tenant-facing web app
2. **Manual scaffolding** -- Created directory structure manually instead of create-next-app to avoid interactive prompts and ensure exact control over dependencies
3. **updateSession helper** -- Middleware delegates to a reusable updateSession function in lib/supabase/middleware.ts

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- `pnpm --filter admin build` succeeds
- Login page renders at /login route
- Admin layout with sidebar renders for authenticated routes
- 5 navigation items in sidebar (Dashboard, Agencies, Users, Audit Log, Settings)
- API client exports get/post/put/patch/delete methods with auth token attachment

## Next Phase Readiness

All subsequent admin plans (09-03 through 09-08) can build on this shell:
- API client ready for /admin/* endpoint integration
- Layout accepts new route groups under (admin)/
- Impersonation banner ready to be wired to context/state
- No blockers identified

## Self-Check: PASSED

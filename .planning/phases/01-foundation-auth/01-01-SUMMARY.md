---
phase: 01-foundation-auth
plan: 01
subsystem: monorepo-scaffold
tags: [turborepo, nextjs, nestjs, prisma, supabase, shadcn-ui, tailwind-v4, zod]
requires: []
provides:
  - Turborepo monorepo with apps/web, apps/api, packages/shared, packages/database, packages/email
  - Prisma schema with Tenant, User, Invitation models
  - SQL migration with handle_new_user trigger and custom_access_token_hook
  - Supabase browser and server client utilities
  - Next.js middleware for session refresh and route protection
  - API fetch wrapper with auth token injection
  - Shared types (UserProfile, SessionUser, Tenant), constants (ROLES, NAV_ITEMS, PERMISSIONS), Zod schemas
affects:
  - 01-02 (auth pages will use Supabase clients, shared schemas, shadcn components)
  - 01-03 (NestJS backend will use Prisma schema, shared types)
  - 01-04 (app shell will use NAV_ITEMS, PERMISSIONS from shared)
  - 01-05 (invitations will use trigger logic, email package)
tech-stack:
  added:
    - Next.js 16.1.6 (App Router, Turbopack)
    - NestJS 11.x
    - Turborepo 2.x
    - Prisma 6.19.2
    - Tailwind CSS 4.1.18
    - shadcn/ui (13 components)
    - "@supabase/supabase-js 2.95.3"
    - "@supabase/ssr 0.8.0"
    - Zod 4.3.6
    - react-hook-form 7.71.1
    - "@hookform/resolvers 5.2.2"
    - next-themes 0.4.6
    - lucide-react 0.563.0
    - sonner 2.0.7
    - nestjs-cls 6.2.0
    - resend 6.9.1
    - class-validator 0.14.3
    - class-transformer 0.5.1
  patterns:
    - Turborepo monorepo with pnpm workspaces (apps/* + packages/*)
    - Prisma schema with @map for snake_case columns
    - SQL database triggers for auth event handling
    - Cookie-based Supabase session with @supabase/ssr
    - getUser() for server-side JWT revalidation (not getSession())
key-files:
  created:
    - package.json
    - pnpm-workspace.yaml
    - turbo.json
    - .env.example
    - .gitignore
    - apps/web/package.json
    - apps/api/package.json
    - apps/api/src/main.ts
    - packages/shared/src/types/auth.ts
    - packages/shared/src/types/tenant.ts
    - packages/shared/src/constants/roles.ts
    - packages/shared/src/validation/auth.schema.ts
    - packages/shared/src/validation/tenant.schema.ts
    - packages/shared/src/index.ts
    - packages/database/prisma/schema.prisma
    - packages/database/prisma/migrations/00000000000000_init/migration.sql
    - apps/web/src/lib/supabase/client.ts
    - apps/web/src/lib/supabase/server.ts
    - apps/web/src/middleware.ts
    - apps/web/src/lib/api.ts
  modified: []
key-decisions:
  - "Zod v4 across monorepo: shared and web both use zod ^4.0.0 to align with @hookform/resolvers v5"
  - "shadcn/ui uses sonner instead of deprecated toast component"
  - "NestJS main.ts configured with CORS, ValidationPipe, port 3001 from the start"
  - "handle_new_user trigger creates user profile even if invitation validation fails (log + continue)"
  - "Next.js middleware kept despite Next.js 16 deprecation warning (proxy API not stable yet)"
patterns-established:
  - "Monorepo: apps/* for deployable services, packages/* for shared libraries"
  - "Prisma: snake_case DB columns with @map, UUID primary keys, enum types"
  - "SQL triggers: handle_new_user for organic signup + invited user detection"
  - "Supabase: browser client via createBrowserClient, server client via createServerClient with cookies"
  - "Middleware: getUser() for session refresh, PUBLIC_ROUTES array for auth bypass"
  - "API client: fetch wrapper with automatic Bearer token from Supabase session"
duration: ~25 minutes
completed: 2026-02-08
---

# Phase 01 Plan 01: Monorepo Scaffolding, Prisma Schema & Supabase Config Summary

Turborepo monorepo with Next.js 16 + NestJS 11, Prisma schema (Tenant/User/Invitation), SQL triggers for signup + invited user handling, Supabase client utilities, and shared package with types/constants/Zod schemas.

## Performance

- Duration: ~25 minutes
- Tasks: 2/2 completed
- Build verification: all packages compile, both apps start

## Accomplishments

1. **Monorepo structure** - Turborepo orchestrates pnpm workspaces with parallel dev/build/lint tasks
2. **Next.js 16 frontend** - App Router with Tailwind v4, 13 shadcn/ui components installed, Supabase SSR configured
3. **NestJS 11 backend** - CORS enabled, ValidationPipe configured, starts on port 3001
4. **Shared package** - UserProfile, SessionUser, Tenant types; ROLES/NAV_ITEMS/PERMISSIONS constants; Zod validation schemas for all auth forms
5. **Prisma schema** - Tenant, User, Invitation models with enums, relations, indexes, snake_case mapping
6. **Database triggers** - handle_new_user() with dual path: organic signup (create tenant + admin user) and invited user (link to existing tenant via invitation_id metadata)
7. **Custom JWT hook** - custom_access_token_hook() adds tenant_id and user_role to JWT claims
8. **Supabase clients** - Browser and server clients following @supabase/ssr patterns
9. **Middleware** - Session refresh via getUser(), route protection with PUBLIC_ROUTES
10. **API client** - Fetch wrapper with automatic Supabase Bearer token injection

## Task Commits

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Scaffold monorepo with Turborepo, Next.js, NestJS, shared packages | 7862ef1 | package.json, turbo.json, apps/web/*, apps/api/*, packages/shared/src/* |
| 2 | Prisma schema, migrations, triggers, Supabase clients | f3b1e2e | prisma/schema.prisma, migration.sql, supabase/client.ts, server.ts, middleware.ts, api.ts |

## Files Created

- **Root:** package.json, pnpm-workspace.yaml, turbo.json, .env.example, .gitignore, pnpm-lock.yaml
- **apps/web/:** Next.js 16 app with Tailwind v4, 13 shadcn/ui components, Supabase client utilities, middleware, API client
- **apps/api/:** NestJS 11 app with CORS, validation, port 3001
- **packages/shared/:** Types (auth.ts, tenant.ts), constants (roles.ts), validation schemas (auth.schema.ts, tenant.schema.ts), index.ts
- **packages/database/:** Prisma schema, SQL migration with triggers, migration lock
- **packages/email/:** Placeholder package

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Zod v4 across monorepo | @hookform/resolvers v5 requires zod v4; aligned shared package to match |
| sonner over toast | shadcn/ui deprecated the toast component in favor of sonner |
| NestJS port 3001 + CORS from start | Avoids needing to reconfigure later; .env.example documents the convention |
| Trigger creates user even if invitation not found | Prevents orphaned auth users; logs warning for debugging |
| Keep middleware despite Next.js 16 deprecation | proxy API is new and unstable; middleware still compiles and works |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Zod version mismatch between shared and web packages**
- Found during: Task 1
- Issue: `create-next-app` installed zod v4.3.6 (latest), but shared package specified `^3.24.0`. The @hookform/resolvers v5 requires zod v4.
- Fix: Updated shared package to `"zod": "^4.0.0"` to align across the monorepo
- Files modified: packages/shared/package.json

**2. [Rule 3 - Blocking] pnpm not installed globally**
- Found during: Task 1 (pre-setup)
- Issue: pnpm was not available on the system despite Node.js being installed
- Fix: Installed pnpm globally via `npm install -g pnpm`

**3. [Rule 3 - Blocking] pnpm build scripts not approved**
- Found during: Task 1
- Issue: pnpm 10.x requires explicit approval for package build scripts (@prisma/client, @nestjs/core, etc.)
- Fix: Added `pnpm.onlyBuiltDependencies` to root package.json

**4. [Rule 3 - Blocking] Inner lockfile in apps/web causing warnings**
- Found during: Task 1
- Issue: create-next-app created apps/web/pnpm-lock.yaml, causing Turbopack to warn about multiple lockfiles
- Fix: Deleted the inner lockfile (monorepo uses root lockfile only)

## Issues Encountered

- **Next.js 16 middleware deprecation:** Next.js 16.1.6 shows a deprecation warning suggesting to use "proxy" instead of "middleware". The middleware still compiles and works correctly. The proxy API is too new to adopt at this stage. Future plans should evaluate migration when proxy API stabilizes.
- **Prisma validation needs env vars:** Prisma validate/generate requires DATABASE_URL and DIRECT_DATABASE_URL even for local development. Created a packages/database/.env with placeholder values (gitignored) to enable CLI operations.

## User Setup Required

Before running database migrations (in a future plan), the user must:
1. Create a Supabase project at https://supabase.com
2. Copy connection strings to `.env` files (see `.env.example`)
3. Run `pnpm db:generate` and `pnpm db:migrate` from the monorepo root
4. Enable the Custom Access Token Hook in Supabase Dashboard > Auth > Hooks

## Next Phase Readiness

Plan 01-02 (Auth pages) can proceed immediately. All prerequisites are in place:
- Supabase client utilities ready for signup/login/reset forms
- Zod schemas ready for form validation
- shadcn/ui components (form, input, label, card, button, sonner) installed
- Middleware handles session refresh and route protection
- Shared types available for consistent typing across the app

## Self-Check: PASSED

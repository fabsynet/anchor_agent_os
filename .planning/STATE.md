# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-05)

**Core value:** No renewal, follow-up, or compliance task silently slips through the cracks.
**Current focus:** Phase 2 -- Client & Policy Management

## Current Position

Phase: 2 of 7 (Client & Policy Management)
Plan: 1 of 5 in current phase
Status: In progress -- Plan 02-01 (Data Foundation) complete, 4 plans remaining
Last activity: 2026-02-21 -- Completed 02-01-PLAN.md (Prisma schema, shared types, validation, dependencies)

Progress: ████░░░░░░░░░░░░░░░░░ 19% (4/21 plans complete, 2 Phase 1 plans still at checkpoint)

## Phase 1 Checkpoint State (Carried Forward)

Plans 01-04 and 01-05 remain at checkpoint:human-verify. Auth rewrite was committed 2026-02-17 but user has not yet verified. These do not block Phase 2 execution.

### 01-04: App Shell (checkpoint pending)
- **Remaining to verify:** Theme toggle, responsive hamburger, logout, overall nav

### 01-05: Invitations & Team (checkpoint pending)
- **Remaining to verify:** Team settings page loads, invite form, pending invites, revoke, invite cap, setup wizard, accept-invite page

## Phase 2 Progress

### 02-01: Data Foundation -- COMPLETE
- **Commits:** 8164de7 (Prisma schema), 6594697 (shared types + deps)
- **Delivered:** 4 new models (Client, Policy, ActivityEvent, Note), 5 enums, shared types, Zod schemas, Canadian insurance constants, @tanstack/react-table, date-fns, 6 shadcn components
- **Summary:** .planning/phases/02-client-and-policy-management/02-01-SUMMARY.md

### 02-02: Backend API Modules -- NOT STARTED
### 02-03: Client List & Detail Pages -- NOT STARTED
### 02-04: Policy Management UI -- NOT STARTED
### 02-05: Timeline & Notes -- NOT STARTED

## Environment Setup Required

### Root `.env` (Anchor_MVP/.env)
```
NEXT_PUBLIC_SUPABASE_URL=<from Dashboard > Settings > API>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Dashboard > Settings > API>
SUPABASE_SERVICE_ROLE_KEY=<from Dashboard > Settings > API>
SUPABASE_JWT_SECRET=<from Dashboard > Settings > API>
DATABASE_URL=<from Dashboard > Settings > Database > Connection string (pooling)>
DIRECT_DATABASE_URL=<from Dashboard > Settings > Database > Connection string (direct)>
API_PORT=3001
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
RESEND_API_KEY=<from Resend dashboard>
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Web `.env.local` (apps/web/.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=<same as root>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<same as root>
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Database `.env` (packages/database/.env)
```
DATABASE_URL=<same as root -- needed for Prisma CLI>
DIRECT_DATABASE_URL=<same as root -- needed for migrations>
```

## Accumulated Context

### Decisions

| Decision | When | Rationale |
|----------|------|-----------|
| Replaced passport-jwt with Supabase auth.getUser() | Phase 1 | Eliminates JWT secret mismatch issues |
| All DB access through Prisma | Phase 1 | No more Supabase REST API for table queries |
| Frontend uses /api/auth/me | Phase 1 | useUser hook calls backend API, not Supabase tables directly |
| ClsModule is global | Phase 1 | No need to import in each module |
| Auto-provision tenant+user in guard | Phase 1 | Handles case where handle_new_user trigger didn't fire |
| Decimal fields as string in shared types | Phase 2 | Prisma serializes Decimals as strings; parseFloat only for display |
| prisma db push for migrations (Supabase) | Phase 2 | Shadow DB fails on auth.users trigger; use db push + manual migration |
| shadcn components created manually | Phase 2 | shadcn CLI fails in pnpm workspace; radix-ui already installed |
| updateSchema as separate z.object (not .partial()) | Phase 2 | .partial() on refined schema carries over .refine() incorrectly |

### Pending Todos

- Verify DATABASE_URL is in root .env and packages/database/.env
- Test /settings/team after auth rewrite (Phase 1 checkpoint)
- Apply RLS migration via Supabase SQL Editor (may not be needed)
- RESEND_API_KEY needed for invitation email sending (01-05)
- Continue Phase 2: execute plans 02-02 through 02-05

### Blockers/Concerns

- handle_new_user Supabase trigger may not be set up -- guard auto-provisions as fallback
- Phase 1 checkpoints (01-04, 01-05) still pending user verification -- does not block Phase 2

## Session Continuity

Last session: 2026-02-21
Stopped at: Completed 02-01-PLAN.md (Data Foundation). All models, types, validation, and dependencies in place.
Resume with: Execute 02-02-PLAN.md (Backend API Modules) next -- builds NestJS ClientsModule, PoliciesModule, TimelineModule on top of the models and types from 02-01.

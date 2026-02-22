# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-05)

**Core value:** No renewal, follow-up, or compliance task silently slips through the cracks.
**Current focus:** Phase 3 -- Tasks, Renewals & Dashboard

## Current Position

Phase: 3 of 7 (Tasks, Renewals & Dashboard)
Plan: 1 of 5 in current phase
Status: In progress -- Plan 03-01 (Data Foundation) complete
Last activity: 2026-02-22 -- Completed 03-01-PLAN.md

Progress: ██████████░░░░░░░░░░░ 50% (13/26 plans complete)

## Phase 1 Checkpoint State (Carried Forward)

Plans 01-04 and 01-05 remain at checkpoint:human-verify. Auth rewrite was committed 2026-02-17 but user has not yet verified. These do not block Phase 2 execution.

### 01-04: App Shell (checkpoint pending)
- **Remaining to verify:** Theme toggle, responsive hamburger, logout, overall nav

### 01-05: Invitations & Team (checkpoint pending)
- **Remaining to verify:** Team settings page loads, invite form, pending invites, revoke, invite cap, setup wizard, accept-invite page

## Phase 2: Client & Policy Management -- COMPLETE (UAT passed 2026-02-21)

**UAT:** 26/26 tests passed, 0 issues
**UAT file:** .planning/phases/02-client-and-policy-management/02-UAT.md

### Plans completed:
- 02-01: Data Foundation (Prisma schema, shared types, Zod schemas, constants, deps)
- 02-02: Backend API Modules (13 endpoints across Clients, Timeline, Policies)
- 02-03: Client List & Forms (list page, search, table/card toggle, create/edit forms)
- 02-04: Client Profile & Timeline UI (profile page, tabs, timeline, notes)
- 02-05: Policy Management UI (policy CRUD dialog, cards/table, auto-convert)
- 02-06: Standalone Policies Page (cross-client search, status filters, pagination)

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
| Use 'as any' for Prisma create/update data in tenant extension | Phase 2 | Tenant extension type signatures don't match standard Prisma input types |
| Manual tenantId in count() and $transaction | Phase 2 | Tenant extension only overrides findMany/findFirst/create/update/delete |
| In-memory timeline pagination | Phase 2 | Merges events+notes then paginates; acceptable for MVP scale |
| React.use(params) for Next.js 16 dynamic routes | Phase 2 | Next.js 16 passes params as Promise; use() unwraps in client components |
| TimelineItem type defined locally, not in shared | Phase 2 | Merged event/note shape is specific to frontend timeline display |
| Use z.input<typeof schema> for form types with .default() | Phase 2 | Zod v4 .default() makes input type optional but output required; zodResolver uses input type |
| createClientSchema for both create and edit forms | Phase 2 | Edit form sends full data; avoids zodResolver type union mismatch between create/update schemas |
| onDelete: Cascade on Task->Policy relation | Phase 3 | Auto-delete renewal tasks when policy is deleted (no orphans) |
| jsx: react-jsx in API tsconfig | Phase 3 | Needed for React Email .tsx template compilation |

### Pending Todos

- Verify DATABASE_URL is in root .env and packages/database/.env
- Test /settings/team after auth rewrite (Phase 1 checkpoint)
- Apply RLS migration via Supabase SQL Editor (may not be needed)
- RESEND_API_KEY needed for invitation email sending (01-05)
- Phase 3 Plan 01 complete -- proceed to Plan 02 (Task backend API)

### Blockers/Concerns

- handle_new_user Supabase trigger may not be set up -- guard auto-provisions as fallback
- Phase 1 checkpoints (01-04, 01-05) still pending user verification -- does not block Phase 3

## Session Continuity

Last session: 2026-02-22
Stopped at: Completed 03-01-PLAN.md (Data Foundation for Phase 3)
Resume file: None

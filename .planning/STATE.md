# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-05)

**Core value:** No renewal, follow-up, or compliance task silently slips through the cracks.
**Current focus:** Phase 5 -- Expenses & Budgets (executing)

## Current Position

Phase: 5 of 7 (Expenses & Budgets)
Plan: 1 of 5 in current phase
Status: In progress
Last activity: 2026-02-23 -- Completed 05-01-PLAN.md (Data Foundation)

Progress: ██████████████████░░░ 90% (18/19 plans complete; 01-04, 01-05 at checkpoint)

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
| Cron services use raw this.prisma not tenantClient | Phase 3 | Cron jobs have no HTTP/CLS context; tenantClient would throw |
| Renewal lifecycle hooks wrapped in try/catch | Phase 3 | Prevent renewal failures from breaking policy create/update |
| GET /tasks/assignees not admin-only | Phase 3 | Any authenticated user needs assignee list for task forms |
| Renewal tasks enforce dismissible-only rule | Phase 3 | Only status changes allowed on renewal tasks via BadRequestException |
| Premium income uses startDate with createdAt fallback | Phase 3 | Two-query approach per period avoids raw SQL while prioritizing effective date |
| Renewal milestones use 61-day query window | Phase 3 | Covers all three milestone intervals (60/30/7 days before renewal) |
| @types/react added as API dev dependency | Phase 3 | Required for TSX email template compilation in NestJS |
| closestCorners for kanban collision detection | Phase 3 | Better for column-based layouts than closestCenter |
| _none sentinel value for Select unassignment | Phase 3 | Radix Select doesn't support empty string values |
| Policy dropdown cascades from client selection | Phase 3 | Only fetch/show policies when client is selected |
| Dashboard types defined locally in widgets | Phase 3 | Frontend-specific API response shapes, not shared across packages |
| Widget three-state pattern (loading/empty/data) | Phase 3 | Consistent UX with Skeleton placeholders and meaningful empty states |
| onDelete: SetNull on Document->Policy relation | Phase 4 | Documents move to client level when policy deleted, not deleted |
| NAV_ITEMS: Compliance instead of Documents | Phase 4 | No standalone /documents page; compliance page gets sidebar access |
| ActivityEvent policyId column for document tracking | Phase 4 | Enables per-policy document and compliance event tracking |
| Express body limit 11mb for file uploads | Phase 4 | 10MB file + form metadata; Multer handles actual multipart parsing |
| Compliance queries use raw prisma not tenantClient | Phase 4 | Cross-client queries need manual tenantId in where clause |
| Compliance log strictly read-only | Phase 4 | No mutation endpoints -- immutable per user decision |
| Bucket auto-creation with graceful fallback | Phase 4 | DocumentsService constructor tries to create bucket, logs warning on failure |
| TimelineService.createActivityEvent optional policyId | Phase 4 | Backward-compatible 8th parameter for document activity events |
| Compliance filters use _none sentinel pattern | Phase 4 | Consistent with Phase 3 pattern for Radix Select "all" options |
| User filter hidden on 403 | Phase 4 | Admin-only endpoint graceful degradation for non-admin users |
| Policy detail dialog as policy detail view | Phase 4 | Card/dialog pattern instead of dedicated page for policy details |
| Linked policy filter cascades from client | Phase 4 | Only shows policies for selected client in compliance filters |
| Extended local types for API response fields | Phase 4 | ClientListItemWithDocs, PolicyWithCounts for documentCount/_count.documents |
| Document count badges conditionally rendered | Phase 4 | Only show when count > 0 to avoid visual clutter |
| Compliance tab no filters (simple chronological) | Phase 4 | Full filter UI is on standalone /compliance page |
| Expense category as String not enum | Phase 5 | Supports custom categories beyond 14 presets; validation at app layer |
| Budget unique on tenantId+month+year | Phase 5 | One budget per month per tenant; enforced at DB level |
| canViewFinancials on User model | Phase 5 | Financial access control field for agent-level permissions |

## Phase 3: Tasks, Renewals & Dashboard -- COMPLETE (User tested 2026-02-22)

### Plans completed:
- 03-01: Data Foundation (Task model, shared types/schemas/constants, dependencies)
- 03-02: Task CRUD & Renewal Engine (tasks module, renewal lifecycle hooks, cron)
- 03-03: Dashboard API & Email Notifications (5 dashboard endpoints, daily digest via Resend)
- 03-04: Task UI (list/kanban page, table view, kanban board, task form dialog)
- 03-05: Dashboard UI (summary cards, quick actions, renewals/overdue/activity widgets, premium income)

### Post-testing fixes applied:
- Edit forms (policy, client) now populate with existing values (useEffect reset + Radix Select value)
- Pagination added to all remaining lists (client policies tab, dashboard widgets)
- Renewal engine catches policies <7 days to expiry and creates urgent tasks

### Pending Todos

- Verify DATABASE_URL is in root .env and packages/database/.env
- Test /settings/team after auth rewrite (Phase 1 checkpoint)
- Apply RLS migration via Supabase SQL Editor (may not be needed)
- RESEND_API_KEY needed for email sending (invitations + daily digest)

### Blockers/Concerns

- handle_new_user Supabase trigger may not be set up -- guard auto-provisions as fallback
- Phase 1 checkpoints (01-04, 01-05) still pending user verification -- does not block future phases
- Supabase Storage "documents" bucket must exist (auto-created on API start or manually in Dashboard)

## Phase 4: Documents & Compliance -- COMPLETE

### Plans completed:
- 04-01: Data Foundation (Document model, shared types/schemas/constants, upload helper, body limit, Compliance nav)
- 04-02: Backend Modules (Documents CRUD API, Compliance query API, document count includes)
- 04-03: Document UI & Client Profile Integration (6 document components, Documents tab, Compliance tab, count badges)
- 04-04: Compliance Page & Policy Detail Dialog (compliance log with 5 filters, policy detail dialog with documents)

## Phase 5: Expenses & Budgets -- IN PROGRESS

### Plans completed:
- 05-01: Data Foundation (5 Prisma models, shared types/schemas/constants, Recharts installed)

### Plans remaining:
- 05-02: Backend API Modules (Expenses CRUD, Budgets CRUD, Notifications)
- 05-03: Expense UI (list, form, approval workflow)
- 05-04: Budget UI (budget management, progress bars, charts)
- 05-05: Dashboard Integration (expense widgets, budget summary)

## Session Continuity

Last session: 2026-02-23
Stopped at: Completed 05-01-PLAN.md (Data Foundation for Expenses & Budgets)
Resume file: none

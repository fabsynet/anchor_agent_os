# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-05)

**Core value:** No renewal, follow-up, or compliance task silently slips through the cracks.
**Current focus:** Phase 7 -- Analytics, Import & Polish (in progress)

## Current Position

Phase: 7 of 7 (Analytics, Import & Polish)
Plan: 4 of 5 in current phase
Status: In progress
Last activity: 2026-02-24 -- Completed 07-04-PLAN.md (CSV Import Wizard)

Progress: █████████████████████████████░ 97% (28/29 plans complete; 01-04, 01-05 at checkpoint)

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
| Receipt storage uses DocumentsService pattern | Phase 5 | Supabase Storage bucket auto-creation, UUID-prefix paths for receipts |
| Admin approve/reject uses inline role check | Phase 5 | ForbiddenException on user.role !== 'admin', not @Roles decorator |
| Recurring expense cron at 2AM Toronto | Phase 5 | 1 hour after renewals cron at 1AM to avoid overlap |
| Static routes before :id param routes | Phase 5 | Prevents NestJS from misinterpreting /categories as UUID param |
| Preset + custom category merge | Phase 5 | 14 preset categories merged with distinct custom categories from DB |
| Budget threshold check fire-and-forget | Phase 5 | Promise.catch in controller to not block approval response |
| Budget categories delete-and-recreate on update | Phase 5 | Simpler than diffing for small category lists |
| canViewFinancials queried from DB not JWT | Phase 5 | Field not on AuthenticatedUser interface; DB lookup in controller |
| Idempotent alerts via metadata match | Phase 5 | Prevents duplicate 80% threshold alerts for same budget+category+month |
| Multi-mode dialog (create/edit/view) for expenses | Phase 5 | Single dialog component with parent-controlled mode instead of separate routes |
| Custom category via text input toggle | Phase 5 | User clicks "Custom..." in Select to reveal text input, "Presets" to go back |
| Receipt preview grid with hover overlay | Phase 5 | Action buttons appear on hover for open/delete; thumbnails for images, icon for PDFs |
| ExpenseList self-fetches with refreshKey prop | Phase 5 | Parent triggers refetch by incrementing refreshKey counter |
| Financial widget self-hides on 403 | Phase 5 | Catches forbidden error and returns null instead of error UI |
| PATCH /api/users/:id/financial-access | Phase 5 | Dedicated endpoint for admin to toggle canViewFinancials |
| Sub-navigation tabs on expenses pages | Phase 5 | Both /expenses and /expenses/budgets show Expenses/Budgets tab bar |
| Recharts v3 ResponsiveContainer confirmed | Phase 5 | Available in v3 despite some migration docs suggesting removal |
| Progress bar color thresholds | Phase 5 | primary (<80%), yellow-500 (>=80%), red-500 (>=100%) |
| Inline toggle switch for boolean user prefs | Phase 5 | Custom switch instead of @radix-ui/react-switch to avoid new dep |
| customLinks as Json with default "[]" | Phase 6 | Flexible label/url pairs without separate table |
| productsOffered as String[] (not enum) | Phase 6 | Matches constant values, allows future expansion without migration |
| Testimonial isVisible defaults true (auto-approved) | Phase 6 | Per CONTEXT.md: auto-approved, agent hides later if needed |
| PublicBadgeProfile extends AgentProfile | Phase 6 | Adds fullName, agencyName, avatarUrl, filtered testimonials |
| Badge constants inlined in API service | Phase 6 | API doesn't have @anchor/shared dep; inline 4 constants |
| Public controller without @UseGuards | Phase 6 | Separate controller class for unauthenticated badge/testimonial endpoints |
| Badge-assets bucket public | Phase 6 | Cover photos publicly visible; no signed URLs needed |
| Auto-unfeature oldest when max 2 reached | Phase 6 | Better UX than rejecting; silently rotates featured testimonials |
| SettingsNav as shared component (not layout.tsx) | Phase 6 | Follows expenses sub-nav pattern; each settings page imports directly |
| Badge tab available to ALL roles | Phase 6 | Every agent should be able to create their badge page |
| Inline TestimonialCard within testimonial-manager | Phase 6 | Admin curation card differs from public display card; separate concerns |
| Explicit TestimonialFormValues interface (not z.input) | Phase 6 | z.coerce.number() in Zod v4 produces unknown input type; manual type + resolver cast |
| hexToRgba helper for accent color tinting | Phase 6 | Generates rgba from hex for product badges and featured borders |
| Public pages use plain fetch (no auth) | Phase 6 | Server components fetch from API without Supabase session context |
| Cross-sell uses Life+Health (not Life+Disability) | Phase 7 | Schema uses health type not disability; Life+Health is closest match |
| Analytics/import constants inlined in API services | Phase 7 | API has no @anchor/shared dep; follows Phase 6 badge pattern |
| Import dedup via normalized name+email composite key | Phase 7 | More robust than name-only or email-only matching |
| Unrecognized import types default to other with customType | Phase 7 | Preserves original value while normalizing to valid enum |
| Single $transaction for batch imports | Phase 7 | Atomic client+policy creation with per-row error capture |

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

## Phase 5: Expenses & Budgets -- COMPLETE

### Plans completed:
- 05-01: Data Foundation (5 Prisma models, shared types/schemas/constants, Recharts installed)
- 05-02: Expenses Backend API (14-method service, 13 endpoints, approval workflow, receipt upload, cron scheduler)
- 05-03: Budget Backend, Alerts, Dashboard Financial (budget CRUD + auto-renewal cron, alerts with idempotent 80% threshold, dashboard financial endpoint)
- 05-04: Expense UI (expense list with status tabs/filters/pagination, form dialog with receipt upload, inline admin approval)
- 05-05: Budget UI, Notifications, Financial Widget (budget list/form, notification bell, donut chart, financial dashboard widget, canViewFinancials toggle)

## Phase 6: Trust & Reputation -- COMPLETE

### Plans completed:
- 06-01: Data Foundation (AgentProfile + Testimonial models, shared types/schemas/constants)
- 06-02: Badge Backend API (9 endpoints: 7 authenticated profile/testimonial mgmt, 2 public badge/testimonial)
- 06-03: Public Badge Page UI (public badge page, testimonial submission form, public layout)
- 06-04: Badge Management UI (profile editor, cover photo upload, testimonial manager, settings sub-nav)

## Phase 7: Analytics, Import & Polish -- IN PROGRESS

### Plans completed:
- 07-01: Data Foundation & Backend (shared types/constants/validation, 8 analytics endpoints, import endpoint with dedup)
- 07-02: Analytics Frontend Part 1 (analytics page with time range selector, export utils, Overview/Clients/Policies tabs)
- 07-04: CSV Import Wizard (4-step wizard: upload/map/preview/summary, PapaParse, fuzzy column detection)

| Decision | When | Rationale |
|----------|------|-----------|
| Dynamic import for jsPDF/jspdf-autotable | Phase 7 | Keeps ~300KB out of main bundle; loads only on export click |
| getDateRange returns null for 'all' | Phase 7 | No date filter sent to API when All Time selected |
| Import wizard stubs for parallel plan | Phase 7 | Unblock build while 07-04 completes import wizard components |
| Fuzzy auto-detect with 30+ header aliases | Phase 7 | Normalized comparison maps common header variations to 15 expected fields |
| __skip__ sentinel for unmapped columns | Phase 7 | Consistent with _none sentinel pattern used elsewhere for Radix Select |
| Client-side policy type normalization in preview | Phase 7 | Visual feedback on type mapping before sending to API |

## Session Continuity

Last session: 2026-02-24
Stopped at: Completed 07-04-PLAN.md (CSV Import Wizard)
Resume file: none

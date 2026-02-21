---
phase: 02-client-and-policy-management
plan: 01
subsystem: database, shared
tags: [prisma, postgresql, zod, typescript, tanstack-table, shadcn, date-fns]

# Dependency graph
requires:
  - phase: 01-foundation-auth
    provides: Prisma schema with User, Tenant, Invitation models; @anchor/shared package with auth types and validation
provides:
  - Client, Policy, ActivityEvent, Note Prisma models with 5 new enums
  - Shared TypeScript types for all Phase 2 entities (ClientStatus, PolicyType, PolicyStatus, etc.)
  - Zod validation schemas for client, policy, and note forms
  - Canadian insurance constants (provinces, carriers, policy types, payment frequencies)
  - @tanstack/react-table and date-fns dependencies
  - shadcn/ui components: Tabs, Dialog, AlertDialog, Textarea, Pagination, ScrollArea
affects:
  - 02-client-and-policy-management (plans 02, 03, 04 depend on these models, types, and components)

# Tech tracking
tech-stack:
  added: ["@tanstack/react-table@8.21.3", "date-fns@4.1.0"]
  patterns: ["Decimal fields as string in shared types (Prisma serialization)", "Zod refine() for conditional validation (lead requires email or phone)", "Canadian insurance domain constants with as const for type narrowing"]

key-files:
  created:
    - packages/database/prisma/migrations/20260221_add_client_policy_timeline_models/migration.sql
    - packages/shared/src/types/client.ts
    - packages/shared/src/types/policy.ts
    - packages/shared/src/types/activity.ts
    - packages/shared/src/constants/insurance.ts
    - packages/shared/src/validation/client.schema.ts
    - packages/shared/src/validation/policy.schema.ts
    - packages/shared/src/validation/note.schema.ts
    - apps/web/src/components/ui/tabs.tsx
    - apps/web/src/components/ui/dialog.tsx
    - apps/web/src/components/ui/alert-dialog.tsx
    - apps/web/src/components/ui/textarea.tsx
    - apps/web/src/components/ui/pagination.tsx
    - apps/web/src/components/ui/scroll-area.tsx
  modified:
    - packages/database/prisma/schema.prisma
    - packages/shared/src/index.ts
    - apps/web/package.json
    - apps/api/package.json
    - pnpm-lock.yaml

key-decisions:
  - "Used prisma db push + manual migration file instead of prisma migrate dev due to shadow database auth.users trigger conflict"
  - "Decimal fields typed as string in shared types to match Prisma JSON serialization behavior"
  - "Created shadcn/ui components manually due to pnpm workspace resolution conflict with shadcn CLI"
  - "updateClientSchema uses z.object with optional fields instead of createClientSchema.partial() to avoid .refine() carry-over complexity"

patterns-established:
  - "Shared types use string for dates (ISO format) and Decimal fields -- parseFloat only for display"
  - "Canadian insurance constants use as const for exhaustive type checking in switch statements"
  - "Zod .refine() for cross-field validation (lead requires email OR phone, 'other' type requires customType)"

# Metrics
duration: 34min
completed: 2026-02-21
---

# Phase 2 Plan 1: Data Foundation Summary

**Prisma schema with Client/Policy/ActivityEvent/Note models, shared types with Zod validation, Canadian insurance constants, and @tanstack/react-table + shadcn components installed**

## Performance

- **Duration:** 34 min
- **Started:** 2026-02-21T19:44:31Z
- **Completed:** 2026-02-21T20:18:33Z
- **Tasks:** 2/2
- **Files modified:** 19

## Accomplishments
- Database schema extended with 4 new models (Client, Policy, ActivityEvent, Note) and 5 new enums, all with proper indexes and relations
- Full set of shared TypeScript types, Zod validation schemas, and Canadian insurance domain constants exported from @anchor/shared
- @tanstack/react-table and date-fns installed for data table and date formatting needs
- 6 new shadcn/ui components (Tabs, Dialog, AlertDialog, Textarea, Pagination, ScrollArea) available for Phase 2 frontend work

## Task Commits

Each task was committed atomically:

1. **Task 1: Prisma schema additions and migration** - `8164de7` (feat)
2. **Task 2: Shared types, constants, validation schemas, and dependency installation** - `6594697` (feat)

## Files Created/Modified
- `packages/database/prisma/schema.prisma` - Added ClientStatus, PolicyType, PolicyStatus, PaymentFrequency, ActivityEventType enums; Client, Policy, ActivityEvent, Note models; updated User and Tenant relations
- `packages/database/prisma/migrations/20260221_add_client_policy_timeline_models/migration.sql` - SQL migration for all new tables, enums, indexes, and foreign keys
- `packages/shared/src/types/client.ts` - ClientStatus union, Client interface, ClientListItem interface
- `packages/shared/src/types/policy.ts` - PolicyType, PolicyStatus, PaymentFrequency unions, Policy interface
- `packages/shared/src/types/activity.ts` - ActivityEventType union, ActivityEvent interface, Note interface
- `packages/shared/src/constants/insurance.ts` - POLICY_TYPES, POLICY_STATUSES, CANADIAN_PROVINCES, COMMON_CARRIERS, PAYMENT_FREQUENCIES
- `packages/shared/src/validation/client.schema.ts` - createClientSchema, updateClientSchema with lead validation
- `packages/shared/src/validation/policy.schema.ts` - createPolicySchema, updatePolicySchema with customType validation
- `packages/shared/src/validation/note.schema.ts` - createNoteSchema with content length validation
- `packages/shared/src/index.ts` - Re-exports all new types, constants, and schemas
- `apps/web/src/components/ui/tabs.tsx` - Radix Tabs wrapper (Tabs, TabsList, TabsTrigger, TabsContent)
- `apps/web/src/components/ui/dialog.tsx` - Radix Dialog wrapper with overlay, close button, header/footer
- `apps/web/src/components/ui/alert-dialog.tsx` - Radix AlertDialog wrapper with action/cancel buttons
- `apps/web/src/components/ui/textarea.tsx` - Styled textarea component
- `apps/web/src/components/ui/pagination.tsx` - Pagination with previous/next and ellipsis
- `apps/web/src/components/ui/scroll-area.tsx` - Radix ScrollArea with vertical/horizontal scrollbars
- `apps/web/package.json` - Added @tanstack/react-table, date-fns dependencies
- `apps/api/package.json` - Added date-fns dependency

## Decisions Made
- **Used `prisma db push` instead of `prisma migrate dev`:** The shadow database fails because the init migration references `auth.users` (a Supabase-specific schema). Used `db push` to apply changes directly, then created a manual migration file and marked it as applied via `prisma migrate resolve`.
- **Decimal fields typed as `string` in shared types:** Prisma serializes Decimal values as strings in JSON. Frontend should use `parseFloat()` only for display. This prevents floating-point precision issues in calculations.
- **Created shadcn components manually:** The shadcn CLI tries to run `pnpm add radix-ui` which fails with workspace resolution errors (`@anchor/shared@workspace:*` not found when running from `apps/web`). Since `radix-ui` is already installed, the 6 component files were created manually following the exact shadcn/ui v3.8 patterns.
- **Update schema uses separate z.object instead of .partial():** The createClientSchema uses `.refine()` for lead validation. Using `.partial()` on a refined schema carries over the refinement, which wouldn't work correctly for PATCH operations. Instead, updateClientSchema is a separate `z.object` with all fields optional.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Shadow database conflict with Supabase auth schema**
- **Found during:** Task 1 (Prisma migration)
- **Issue:** `prisma migrate dev` failed with "schema 'auth' does not exist" because the init migration references `auth.users` triggers that only exist in Supabase's actual database, not in the shadow database
- **Fix:** Used `prisma db push` to apply schema changes directly, created migration SQL file manually, marked as applied with `prisma migrate resolve`
- **Files modified:** migration.sql (created manually)
- **Verification:** `prisma validate` passes, `prisma generate` succeeds, database package builds
- **Committed in:** `8164de7` (Task 1 commit)

**2. [Rule 3 - Blocking] shadcn CLI fails in pnpm workspace**
- **Found during:** Task 2 (shadcn component installation)
- **Issue:** `npx shadcn@latest add` fails because it runs `pnpm add radix-ui` from `apps/web` directory, which triggers workspace resolution and fails on `@anchor/shared@workspace:*`
- **Fix:** Created all 6 shadcn component files manually following the exact pattern from existing components (using `radix-ui` unified import, `cn()` utility, `data-slot` attributes)
- **Files modified:** 6 new component files in `apps/web/src/components/ui/`
- **Verification:** Full monorepo build passes with zero errors
- **Committed in:** `6594697` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both blocking issues required workarounds for Supabase shadow DB and pnpm workspace compatibility. No scope creep -- all planned deliverables were produced.

## Issues Encountered
- Prisma shadow database incompatibility with Supabase `auth.users` triggers -- resolved via `db push` + manual migration approach
- shadcn CLI workspace resolution conflict -- resolved by creating component files manually

## User Setup Required
None - no external service configuration required. Database migration was applied automatically via `prisma db push`.

## Next Phase Readiness
- All models, types, constants, and validation schemas are in place for Phase 2 plans 02-04
- @tanstack/react-table and date-fns are installed and ready for client/policy list views
- shadcn Tabs, Dialog, AlertDialog, Textarea, Pagination, ScrollArea components are available for UI work
- Full monorepo builds cleanly with zero TypeScript errors

## Self-Check: PASSED

All 14 created files verified present. Both commit hashes (8164de7, 6594697) verified in git log.

---
*Phase: 02-client-and-policy-management*
*Completed: 2026-02-21*

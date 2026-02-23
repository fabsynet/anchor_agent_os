---
phase: 02-client-and-policy-management
plan: 05
subsystem: ui
tags: [nextjs, react, policy-form, shadcn, dialog, tanstack-table, sonner, zod]

# Dependency graph
requires:
  - phase: 02-client-and-policy-management/02-01
    provides: Shared types (Policy, PolicyType, PolicyStatus), Zod schemas, constants, shadcn Dialog/AlertDialog
  - phase: 02-client-and-policy-management/02-02
    provides: Policy API endpoints (CRUD, auto-convert)
  - phase: 02-client-and-policy-management/02-03
    provides: ViewToggle component for cards/table switching
  - phase: 02-client-and-policy-management/02-04
    provides: Client profile page with Policies tab placeholder
provides:
  - Policy CRUD UI on client profile (form in Dialog, summary cards, table view)
  - Auto-convert lead-to-client reflected in UI after first policy creation
  - PolicyStatusBadge component with color-coded status display
affects:
  - Phase 3 (Tasks/Renewals -- renewal tasks will link to policies displayed here)
  - Phase 4 (Documents -- documents can be linked to policies)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Policy form in Dialog with zodResolver + createPolicySchema"
    - "Auto-convert feedback: re-fetch client after policy creation on lead"
    - "Cards as default view with table toggle (locked decision)"
    - "Decimal-as-string display with parseFloat for formatting only"

key-files:
  created:
    - apps/web/src/components/policies/policy-form.tsx
    - apps/web/src/components/policies/policy-status-badge.tsx
    - apps/web/src/components/policies/policy-cards.tsx
    - apps/web/src/components/policies/policy-table.tsx
    - apps/web/src/components/clients/client-policies-tab.tsx
  modified:
    - apps/web/src/app/(dashboard)/clients/[id]/page.tsx

key-decisions:
  - "Summary cards as default policy view (locked decision from planning)"
  - "Policy form rendered in Dialog -- no separate route for policy create/edit"
  - "Auto-convert toast feedback when creating policy on a lead"

patterns-established:
  - "Dialog-based CRUD forms for sub-entities (policies on client profile)"
  - "AlertDialog for delete confirmation on sub-entities"
  - "Re-fetch parent entity after child mutation that changes parent state"

# Metrics
duration: ~25min
completed: 2026-02-21
---

# Phase 2 Plan 5: Policy Management UI Summary

**Policy CRUD on client profile with Dialog form, summary cards/table toggle, status badges, and auto-convert lead feedback**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-02-21
- **Completed:** 2026-02-21
- **Tasks:** 2/2 (auto) + 1 checkpoint (approved 2026-02-21)
- **Files modified:** 6

## Accomplishments
- Policy form in Dialog with all Canadian insurance fields (type, carrier, policy number, dates, premium, coverage, deductible, payment frequency, commission, notes)
- PolicyStatusBadge with color coding for all 6 statuses (Draft, Active, Pending Renewal, Renewed, Expired, Cancelled)
- Summary cards showing type icon, carrier, premium, expiry, and status badge
- Table view with @tanstack/react-table for sortable policy list
- Auto-convert lead to client on first policy creation with toast feedback and UI refresh
- Delete confirmation via AlertDialog

## Task Commits

Each task was committed atomically:

1. **Task 1: Policy form, status badge, card and table components** - `854c405` (feat)
2. **Task 2: Wire policies tab into client profile with auto-convert** - `388c0bb` (feat)
3. **Task 3: Checkpoint human-verify** - Approved 2026-02-21

## Files Created/Modified
- `apps/web/src/components/policies/policy-form.tsx` - Create/edit policy form in Dialog with zodResolver + createPolicySchema, all Canadian insurance fields, COMMON_CARRIERS datalist
- `apps/web/src/components/policies/policy-status-badge.tsx` - Status badge mapping 6 PolicyStatus values to colored Badge variants
- `apps/web/src/components/policies/policy-cards.tsx` - Summary card grid with type icons (Car, Home, Heart, etc.), carrier, premium, expiry, status badge, edit/delete actions
- `apps/web/src/components/policies/policy-table.tsx` - Table view using @tanstack/react-table with type, carrier, policy #, premium, dates, status, actions columns
- `apps/web/src/components/clients/client-policies-tab.tsx` - Policies tab with add button, cards/table toggle, empty state, API integration for CRUD, auto-convert feedback
- `apps/web/src/app/(dashboard)/clients/[id]/page.tsx` - Updated to replace Policies placeholder with ClientPoliciesTab component

## Decisions Made
- **Summary cards as default view:** Per locked planning decision, policies display as summary cards by default with toggle to table. Cards show type icon, carrier, premium, expiry, and status badge.
- **Dialog-based form:** Policy create/edit uses a Dialog rather than a separate page route. This keeps the user on the client profile and follows the sub-entity pattern.
- **Auto-convert feedback:** After creating a policy on a lead, the component re-fetches client data via onClientUpdated callback. The profile header badge updates from Lead to Client, and a specific toast message confirms the conversion.

## Deviations from Plan

None -- plan executed as written.

## Issues Encountered
- Build errors from missing Prisma client (resolved with `prisma generate`) and missing @tanstack/react-table + date-fns deps (resolved with `pnpm add`). Committed lockfile fix: `8b28abd`.

## User Setup Required
None - frontend components consuming existing API endpoints.

## Next Phase Readiness
- All 5 Phase 2 plans complete
- Client & policy management fully functional end-to-end
- Policy display ready for Phase 3 renewal task integration
- Documents tab placeholder ready for Phase 4

## Self-Check: PASSED

All 5 created files verified. Commit hashes 854c405, 388c0bb verified. Checkpoint approved.

---
*Phase: 02-client-and-policy-management*
*Completed: 2026-02-21*

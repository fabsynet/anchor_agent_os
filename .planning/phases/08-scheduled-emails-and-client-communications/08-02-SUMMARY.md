---
phase: 08-scheduled-emails-and-client-communications
plan: 02
subsystem: api
tags: [react-email, cron, zeptomail, birthday, renewal-reminder, idempotent]

# Dependency graph
requires:
  - phase: 08-01
    provides: EmailLog/TenantEmailSettings models, sendEmail/sendBatchEmail methods, shared types
provides:
  - Birthday greeting email template (React Email)
  - Renewal reminder email template (React Email)
  - Birthday cron job at 7:30 AM Toronto time
  - Renewal reminder cron job at 7:00 AM Toronto time
  - Idempotent email sending via EmailLog checks
  - TenantEmailSettings toggle support for birthday and renewal intervals
affects: [08-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Toronto timezone cron scheduling pattern (7:00 AM, 7:30 AM, 8:00 AM)"
    - "Two-step idempotency: DB query then application-level metadata check"
    - "$queryRaw for birthday month/day extraction from date_of_birth"

key-files:
  created:
    - apps/api/src/notifications/emails/birthday-greeting.tsx
    - apps/api/src/notifications/emails/renewal-reminder.tsx
  modified:
    - apps/api/src/notifications/notifications.service.ts
    - apps/api/src/notifications/notifications.scheduler.ts

key-decisions:
  - "Birthday query uses $queryRaw with EXTRACT(MONTH/DAY) for birthday matching"
  - "Renewal idempotency uses two-step check: DB findFirst then metadata.policyId comparison"
  - "Default behavior when no TenantEmailSettings: all emails enabled"
  - "Per-client/per-policy try/catch to prevent one failure from stopping batch"

patterns-established:
  - "Cron ordering: 7:00 AM renewal reminders, 7:30 AM birthday, 8:00 AM digest"
  - "Client email templates follow daily-digest.tsx pattern (ANCHOR_NAVY, inline styles, React Email components)"

# Metrics
duration: 6min
completed: 2026-03-02
---

# Phase 8 Plan 2: Birthday & Renewal Reminder Cron Jobs Summary

**Automated birthday and renewal reminder emails via React Email templates, Toronto-timezone cron jobs, idempotent EmailLog checks, and per-tenant TenantEmailSettings toggles**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-02T04:46:36Z
- **Completed:** 2026-03-02T04:52:57Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Two React Email templates (birthday greeting, renewal reminder) following daily-digest.tsx patterns
- Birthday cron at 7:30 AM Toronto sends to clients whose birthday matches today's month/day
- Renewal reminder cron at 7:00 AM Toronto sends for policies expiring in 60/30/7 days (configurable)
- Idempotent sending via EmailLog prevents duplicate emails on re-runs
- TenantEmailSettings respected: birthday toggle and per-interval renewal toggles

## Task Commits

Each task was committed atomically:

1. **Task 1: Email Templates (Birthday + Renewal Reminder)** - `cc73a34` (feat)
2. **Task 2: Birthday + Renewal Reminder Service Methods and Cron Jobs** - `7259d13` (feat)

## Files Created/Modified
- `apps/api/src/notifications/emails/birthday-greeting.tsx` - Birthday greeting React Email template (131 lines)
- `apps/api/src/notifications/emails/renewal-reminder.tsx` - Renewal reminder React Email template with policy info box (208 lines)
- `apps/api/src/notifications/notifications.service.ts` - Added sendBirthdayEmailsForAllTenants(), sendRenewalReminderEmailsForAllTenants(), and private helpers
- `apps/api/src/notifications/notifications.scheduler.ts` - Added two new @Cron entries (7:00 AM and 7:30 AM Toronto)

## Decisions Made
- Birthday query uses `$queryRaw` with `EXTRACT(MONTH/DAY FROM date_of_birth)` for month/day matching regardless of year
- Renewal idempotency uses two-step approach: DB query for tenant+client+type+today, then application-level `metadata.policyId` comparison (avoids Prisma JSON path filtering)
- Default behavior when no TenantEmailSettings record exists: all emails enabled (send by default)
- Per-client/per-policy try/catch ensures one failure doesn't stop the entire batch
- Renewal reminder shows `customType` over `type` for policy type display name

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. (ZEPTOMAIL_API_KEY already configured in Phase 3.)

## Next Phase Readiness
- Birthday and renewal reminder crons are ready to fire
- Email History & Settings UI (08-05) can read EmailLog records created by these crons
- Bulk Email Endpoint (08-04) can reuse the sendEmail pattern

## Self-Check: PASSED

---
*Phase: 08-scheduled-emails-and-client-communications*
*Completed: 2026-03-02*

---
phase: 06-trust-and-reputation
plan: 02
subsystem: api
tags: [nestjs, badge, testimonials, supabase-storage, file-upload, public-api]
dependency-graph:
  requires:
    - phase: 06-01
      provides: AgentProfile and Testimonial Prisma models, shared badge types/schemas/constants
  provides:
    - BadgeService with profile CRUD, slug generation, cover photo upload, testimonial submission/curation
    - BadgeController with 7 authenticated endpoints for profile and testimonial management
    - BadgePublicController with 2 public endpoints for badge page and testimonial submission
    - BadgeModule registered in AppModule
  affects: [06-03, 06-04]
tech-stack:
  added: []
  patterns: [public-controller-no-auth-guard, raw-prisma-for-public-endpoints, public-supabase-bucket]
key-files:
  created:
    - apps/api/src/badge/badge.service.ts
    - apps/api/src/badge/badge.controller.ts
    - apps/api/src/badge/badge-public.controller.ts
    - apps/api/src/badge/badge.module.ts
    - apps/api/src/badge/dto/create-profile.dto.ts
    - apps/api/src/badge/dto/update-profile.dto.ts
    - apps/api/src/badge/dto/submit-testimonial.dto.ts
  modified:
    - apps/api/src/app.module.ts
key-decisions:
  - "Badge constants inlined in service instead of importing @anchor/shared (API has no shared dep)"
  - "Public endpoints use raw this.prisma (no CLS tenant context for unauthenticated requests)"
  - "Badge-assets bucket created as public (no signed URLs needed for cover photos)"
  - "Testimonial response strips authorEmail for privacy on public submission"
  - "Auto-unfeature oldest featured testimonial when max 2 reached"
patterns-established:
  - "Public controller pattern: separate controller class without @UseGuards for unauthenticated routes"
  - "Profile auto-create on first access: getMyProfile and updateProfile auto-provision if no profile exists"
  - "Rate limiting via DB query: check for recent record within time window before insert"
duration: 6m 37s
completed: 2026-02-23
---

# Phase 6 Plan 2: Badge Backend API Summary

**NestJS badge module with 9 endpoints (7 authenticated, 2 public) for agent profile CRUD, cover photo upload to Supabase Storage, testimonial submission with rate limiting and in-app notifications, and testimonial curation with max 2 featured enforcement.**

## Performance

- **Duration:** 6m 37s
- **Started:** 2026-02-23T06:44:05Z
- **Completed:** 2026-02-23T06:50:42Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Complete badge service with 12 business logic methods covering profile CRUD, slug generation, cover photo upload, testimonial submission, and testimonial curation
- Authenticated controller with 7 endpoints for agent profile management and testimonial curation (visibility toggle, featured toggle, delete)
- Public controller with 2 endpoints for badge page view and testimonial submission (no authentication required)
- Rate limiting: 1 testimonial per email per agent per 24 hours
- Featured toggle enforces max 2 with auto-unfeature of oldest
- In-app notification via AlertsService when new testimonial submitted
- Public Supabase Storage bucket (badge-assets) with auto-creation on startup

## Task Commits

Each task was committed atomically:

1. **Task 1: Badge Service with profile CRUD, slug generation, testimonial submission, curation, and image upload** - `1917a31` (feat)
2. **Task 2: Badge controllers (authenticated + public) and module registration** - `15060b4` (feat)

## Files Created/Modified
- `apps/api/src/badge/badge.service.ts` - All badge business logic (12 methods)
- `apps/api/src/badge/badge.controller.ts` - 7 authenticated endpoints for agent profile and testimonial management
- `apps/api/src/badge/badge-public.controller.ts` - 2 public endpoints for badge page view and testimonial submission
- `apps/api/src/badge/badge.module.ts` - NestJS module registering controllers, service, AlertsModule import
- `apps/api/src/badge/dto/create-profile.dto.ts` - class-validator DTO for initial profile creation
- `apps/api/src/badge/dto/update-profile.dto.ts` - class-validator DTO for profile updates (all fields optional)
- `apps/api/src/badge/dto/submit-testimonial.dto.ts` - class-validator DTO for testimonial submission
- `apps/api/src/app.module.ts` - Added BadgeModule to imports

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Inline badge constants instead of importing @anchor/shared | API package doesn't have @anchor/shared as dependency; avoids adding cross-package dependency for 4 constants |
| Public endpoints use raw this.prisma | No CLS tenant context exists for unauthenticated requests; same pattern as cron services |
| Badge-assets bucket created as public | Cover photos are meant to be publicly visible on badge pages; no signed URLs needed |
| Strip authorEmail from public testimonial response | Privacy protection for testimonial submitters |
| Auto-unfeature oldest when max 2 featured reached | Better UX than rejecting -- silently rotates featured testimonials |
| Testimonial submission requires isPublished=true on profile | Prevents submissions to draft/unpublished profiles |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Inlined badge constants instead of importing from @anchor/shared**
- **Found during:** Task 1 (BadgeService creation)
- **Issue:** `@anchor/shared` is not a dependency of the API package; import caused TS2307 build error
- **Fix:** Defined MAX_FEATURED_TESTIMONIALS, COVER_PHOTO_MAX_SIZE, COVER_PHOTO_ALLOWED_TYPES, and BADGE_ASSETS_BUCKET as local constants matching values from the shared package
- **Files modified:** apps/api/src/badge/badge.service.ts
- **Verification:** `pnpm --filter api build` passes
- **Committed in:** 1917a31 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to resolve build error. Constants are duplicated but values are stable. No scope creep.

## Issues Encountered
None beyond the @anchor/shared import issue documented above.

## User Setup Required
None - no external service configuration required. The badge-assets Supabase Storage bucket is auto-created on API startup.

## Next Phase Readiness
- Plan 06-03 (Public Badge Page UI) can proceed. All 9 API endpoints are ready.
- Plan 06-04 (Badge Management UI) can proceed. Authenticated endpoints are ready for the management dashboard.
- Endpoint summary:
  - `GET /api/badge/profile` - Agent's own profile (auto-creates)
  - `PATCH /api/badge/profile` - Update profile
  - `POST /api/badge/profile/cover-photo` - Upload cover photo
  - `GET /api/badge/testimonials` - List all testimonials
  - `PATCH /api/badge/testimonials/:id/visibility` - Toggle visibility
  - `PATCH /api/badge/testimonials/:id/featured` - Toggle featured
  - `DELETE /api/badge/testimonials/:id` - Delete testimonial
  - `GET /api/public/badge/:slug` - Public badge profile
  - `POST /api/public/badge/:slug/testimonials` - Submit testimonial

## Self-Check: PASSED

---
*Phase: 06-trust-and-reputation*
*Completed: 2026-02-23*

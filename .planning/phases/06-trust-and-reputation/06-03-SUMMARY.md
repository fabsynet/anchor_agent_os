---
phase: 06-trust-and-reputation
plan: 03
subsystem: ui
tags: [nextjs, public-pages, testimonials, badge, server-components, seo, responsive]
dependency-graph:
  requires:
    - phase: 06-01
      provides: AgentProfile and Testimonial models, shared badge types/schemas/constants
    - phase: 06-02
      provides: Public badge API endpoints (GET /api/public/badge/:slug, POST /api/public/badge/:slug/testimonials)
  provides:
    - Public testimonial submission page at /testimonial/[slug]
    - Public agent badge page at /agent/[slug]
    - Middleware update allowing unauthenticated access to /agent and /testimonial routes
    - Minimal (public) route group layout
    - Reusable StarRating, StrengthBadges, StrengthPicker, TestimonialCard, BadgePageView components
  affects: [06-04]
tech-stack:
  added: []
  patterns: [public-route-group-layout, server-component-public-fetch, accent-color-theming, hex-to-rgba-tinting]
key-files:
  created:
    - apps/web/src/app/(public)/layout.tsx
    - apps/web/src/app/(public)/testimonial/[slug]/page.tsx
    - apps/web/src/app/(public)/agent/[slug]/page.tsx
    - apps/web/src/components/badge/testimonial-form.tsx
    - apps/web/src/components/badge/star-rating.tsx
    - apps/web/src/components/badge/strength-badges.tsx
    - apps/web/src/components/badge/testimonial-card.tsx
    - apps/web/src/components/badge/badge-page-view.tsx
  modified:
    - apps/web/src/middleware.ts
key-decisions:
  - "Explicit TestimonialFormValues interface to bypass Zod v4 z.coerce input type issue"
  - "zodResolver cast to any for Zod v4 z.coerce.number() compatibility"
  - "Map<string, string> for strength label lookup to avoid readonly tuple key type error"
  - "hexToRgba helper for accent color tinting on product badges and featured borders"
  - "Server-side fetch with plain fetch (no auth) for public pages"
patterns-established:
  - "Public route group: (public) layout without auth checks, sidebar, or dashboard nav"
  - "Public page pattern: server component fetching from API with no-store cache, notFound() on 404"
  - "Accent color theming: inline styles with hexToRgba for light tints"
  - "Star rating: reusable interactive/readonly component with hover preview"
duration: 14m 10s
completed: 2026-02-23
---

# Phase 6 Plan 3: Public Badge Pages Summary

**Public testimonial form at /testimonial/[slug] and agent badge page at /agent/[slug] with responsive layout, accent color theming, SEO metadata, and all supporting display components.**

## Performance

- **Duration:** 14m 10s
- **Started:** 2026-02-23T06:55:15Z
- **Completed:** 2026-02-23T07:09:25Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Updated middleware to allow unauthenticated access to /agent and /testimonial routes, including preventing logged-in user redirect
- Built complete testimonial submission form with star rating, strength picker, character count, anonymous toggle, and success/error states
- Built full badge page displaying cover banner, avatar, name/agency/license, bio, contact links, social icons, products, custom links, featured testimonials, all testimonials with average rating, and "Leave a Review" CTA
- Both pages are server components fetching from public API with plain fetch (no auth headers)
- SEO metadata with OpenGraph support for badge page

## Task Commits

Each task was committed atomically:

1. **Task 1: Middleware update, public layout, and testimonial submission page** - `922c0bf` (feat)
2. **Task 2: Public badge page at /agent/[slug]** - `2996803` (feat)

## Files Created/Modified
- `apps/web/src/middleware.ts` - Added /agent and /testimonial to PUBLIC_ROUTES, prevented auth redirect for these paths
- `apps/web/src/app/(public)/layout.tsx` - Minimal public layout without sidebar/nav/auth
- `apps/web/src/app/(public)/testimonial/[slug]/page.tsx` - Server component with agent header, form, and SEO metadata
- `apps/web/src/app/(public)/agent/[slug]/page.tsx` - Server component with profile fetch, notFound, and OpenGraph metadata
- `apps/web/src/components/badge/testimonial-form.tsx` - Client form with react-hook-form, zodResolver, star rating, strength picker
- `apps/web/src/components/badge/star-rating.tsx` - Reusable star rating with interactive hover and readonly display modes
- `apps/web/src/components/badge/strength-badges.tsx` - StrengthBadges display and StrengthPicker form components
- `apps/web/src/components/badge/testimonial-card.tsx` - Testimonial display card with featured and standard variants
- `apps/web/src/components/badge/badge-page-view.tsx` - Full badge page layout with accent color theming and responsive design

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Explicit TestimonialFormValues interface (not z.input) | z.coerce.number() in Zod v4 produces `unknown` input type, breaking zodResolver type inference |
| zodResolver cast to any | Standard workaround for Zod v4 coerce type mismatch with react-hook-form resolvers |
| Map<string, string> for strength label lookup | STRENGTH_CATEGORIES `as const` makes Map key a strict union; string lookups fail without widening |
| hexToRgba helper for accent color tinting | Generates rgba with configurable alpha for product badge backgrounds and border colors |
| Server-side fetch with no-store cache | Public pages need fresh data on each request; no auth headers needed |
| Avatar URL dual handling (absolute URL vs storage path) | Supports both direct Supabase avatar URLs and relative storage paths |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Map type for strength label lookup**
- **Found during:** Task 1 (StrengthBadges component)
- **Issue:** STRENGTH_CATEGORIES `as const` creates a readonly tuple; `Map()` infers strict union key type. Passing a `string` argument to `.get()` fails TypeScript
- **Fix:** Explicitly typed Map as `Map<string, string>` to accept any string key
- **Files modified:** apps/web/src/components/badge/strength-badges.tsx
- **Verification:** `npx tsc --noEmit` passes; `pnpm --filter web build` succeeds
- **Committed in:** 922c0bf (Task 1 commit)

**2. [Rule 1 - Bug] Fixed Zod v4 z.coerce type incompatibility with zodResolver**
- **Found during:** Task 1 (TestimonialForm component)
- **Issue:** `z.coerce.number()` in Zod v4 produces `unknown` as input type, making zodResolver return type incompatible with useForm generic parameter
- **Fix:** Defined explicit `TestimonialFormValues` interface with `rating: number` and cast zodResolver to `any`
- **Files modified:** apps/web/src/components/badge/testimonial-form.tsx
- **Verification:** `npx tsc --noEmit` passes; `pnpm --filter web build` succeeds
- **Committed in:** 922c0bf (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes required for TypeScript compilation. Standard Zod v4 workarounds consistent with project patterns. No scope creep.

## Issues Encountered
- Windows filesystem long path issue caused intermittent ENOENT during `next build` (.next/static). Resolved by clearing .next directory before build. TypeScript compiler (`tsc --noEmit`) was used as primary type verification.

## User Setup Required
None - no external service configuration required. Public pages consume existing API endpoints from Plan 06-02.

## Next Phase Readiness
- Plan 06-04 (Badge Management UI) can proceed / has already been executed in parallel wave 3.
- All public-facing components and pages are complete and verified.
- Both public routes are registered in middleware and render correctly in production build.

## Self-Check: PASSED

---
*Phase: 06-trust-and-reputation*
*Completed: 2026-02-23*

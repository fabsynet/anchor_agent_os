---
phase: 06-trust-and-reputation
plan: 01
subsystem: data-foundation
tags: [prisma, shared-types, zod, badge, testimonials]
dependency-graph:
  requires: [05-01]
  provides: [AgentProfile model, Testimonial model, badge shared types, badge validation schemas, badge constants]
  affects: [06-02, 06-03, 06-04]
tech-stack:
  added: []
  patterns: [shared-types-first data foundation, Zod v4 validation schemas]
key-files:
  created:
    - packages/shared/src/types/badge.ts
    - packages/shared/src/validation/badge.schema.ts
    - packages/shared/src/constants/badge.ts
  modified:
    - packages/database/prisma/schema.prisma
    - packages/shared/src/index.ts
decisions:
  - "AgentProfile has 1:1 with User (unique userId), many testimonials"
  - "Testimonial cascades on AgentProfile delete"
  - "Auto-approved testimonials (isVisible defaults true per CONTEXT.md)"
  - "Max 2 featured testimonials (isFeatured with MAX_FEATURED_TESTIMONIALS constant)"
  - "8 strength categories and 11 insurance product types defined as constants"
  - "PublicBadgeProfile extends AgentProfile with fullName, agencyName, avatarUrl, testimonials"
metrics:
  duration: 3m 5s
  completed: 2026-02-23
---

# Phase 6 Plan 1: Data Foundation Summary

**One-liner:** Prisma schema with AgentProfile/Testimonial models, shared badge types, Zod validation schemas, and constants for trust & reputation features.

## What Was Done

### Task 1: Prisma Schema - AgentProfile and Testimonial models
Added two new models to the Prisma schema:

- **AgentProfile**: 1:1 with User via unique userId. Fields for slug (vanity URL), license number, bio, contact info (phone, email, website), social links (LinkedIn, Twitter, Facebook, Instagram, WhatsApp), products offered (string array), custom links (JSON), cover photo path, accent color, and published status. Back-relations added on User and Tenant models.
- **Testimonial**: Belongs to AgentProfile with cascade delete. Fields for author name/email, anonymous flag, 1-5 rating, content, strength categories (string array), visibility toggle, and featured flag. Composite indexes for efficient querying by profile+visibility+date and profile+featured.

Schema pushed to Supabase via `prisma db push` and Prisma client regenerated.

### Task 2: Shared Package - Badge types, Zod schemas, and constants

Created three new files in `@anchor/shared`:

- **types/badge.ts**: TypeScript interfaces for AgentProfile, Testimonial, PublicBadgeProfile (with fullName, agencyName, avatarUrl, testimonials), CustomLink, and TestimonialWithProfile. Follows existing patterns (strings for dates/UUIDs, Decimal as string).
- **constants/badge.ts**: 8 strength categories, 11 insurance product types, 8 accent color presets, MAX_FEATURED_TESTIMONIALS (2), cover photo constraints (5MB, JPEG/PNG/WebP), badge assets bucket name.
- **validation/badge.schema.ts**: Two Zod v4 schemas -- submitTestimonialSchema (name, email, anonymous, rating 1-5, content 10-2000 chars, strengths 1-5) and updateAgentProfileSchema (all editable profile fields with appropriate validation).

All exports added to `packages/shared/src/index.ts` following existing section pattern.

## Task Commits

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Prisma Schema - AgentProfile and Testimonial models | 4b2cd6f | packages/database/prisma/schema.prisma |
| 2 | Shared Package - Badge types, Zod schemas, and constants | 22c2e5c | packages/shared/src/types/badge.ts, constants/badge.ts, validation/badge.schema.ts, index.ts |

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

1. `pnpm --filter database exec prisma db push` -- PASSED (database already in sync)
2. `pnpm --filter database exec prisma generate` -- PASSED (Prisma Client v6.19.2)
3. `pnpm --filter shared build` -- PASSED (tsc compiled with no errors)
4. All new exports accessible from @anchor/shared -- PASSED

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| customLinks stored as Json with default "[]" | Flexible schema for label/url pairs without separate table |
| productsOffered as String[] (not enum) | Matches constant values, allows future expansion without migration |
| Testimonial isVisible defaults true | Per CONTEXT.md: auto-approved, agent hides later if needed |
| PublicBadgeProfile extends AgentProfile | Clean inheritance -- adds user/tenant display fields and filtered testimonials |

## Next Phase Readiness

Plan 06-02 (Backend API Module) can proceed. All models, types, schemas, and constants are in place. The Prisma client has AgentProfile and Testimonial accessors ready for service implementation.

## Self-Check: PASSED

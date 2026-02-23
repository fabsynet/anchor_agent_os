---
phase: 01-foundation-auth
plan: 02
subsystem: auth-pages
tags: [supabase-auth, react-hook-form, zod, shadcn-ui, split-screen-layout]
requires: ["01-01"]
provides:
  - Signup page with 6 fields (firstName, lastName, agencyName, email, password, confirmPassword)
  - Login page with email/password and show/hide toggle
  - Email verification page with check-email message
  - Password reset request page
  - Update password page for reset flow
  - Auth callback route with smart redirect (new signups -> /setup, password reset -> /update-password)
  - Split-screen auth layout (navy branding left, form right, mobile-responsive)
affects:
  - 01-04 (app shell will wrap authenticated routes)
  - 01-05 (invitation acceptance will use auth callback route)
key-files:
  created:
    - apps/web/src/app/(auth)/layout.tsx
    - apps/web/src/app/(auth)/signup/page.tsx
    - apps/web/src/app/(auth)/login/page.tsx
    - apps/web/src/app/(auth)/verify/page.tsx
    - apps/web/src/app/(auth)/reset-password/page.tsx
    - apps/web/src/app/(auth)/update-password/page.tsx
    - apps/web/src/components/auth/signup-form.tsx
    - apps/web/src/components/auth/login-form.tsx
    - apps/web/src/components/auth/reset-form.tsx
    - apps/web/src/components/auth/update-password-form.tsx
    - apps/web/src/app/auth/callback/route.ts
  modified:
    - apps/web/src/app/layout.tsx
key-decisions:
  - "/auth/callback added to middleware PUBLIC_ROUTES (required for Supabase code exchange)"
  - "@anchor/shared added as workspace dependency to web app for shared Zod schemas"
patterns-established:
  - "Auth pages use (auth) route group with split-screen layout"
  - "Forms use React Hook Form + @hookform/resolvers/zod + shared Zod schemas"
  - "Auth callback route handles all Supabase redirects (verification, password reset, invitation)"
  - "New signups redirect to /setup after email verification (setupCompleted check)"
duration: ~20 minutes
completed: 2026-02-09
verified: 2026-02-14 (user-approved checkpoint)
---

# Phase 01 Plan 02: Auth Pages Summary

All authentication pages with split-screen layout, Supabase Auth integration, shared Zod validation, and smart post-verification routing.

## Performance

- Duration: ~20 minutes
- Tasks: 3/3 completed (2 auto + 1 checkpoint approved)
- Build verification: compiles without TypeScript errors
- User verification: auth pages render correctly, forms validate, layout responsive

## Accomplishments

1. **Split-screen auth layout** - Navy branding panel (left) with form content (right), hides branding on mobile
2. **Signup page** - 6-field form (firstName, lastName, agencyName, email, password, confirmPassword) with Zod validation, calls supabase.auth.signUp with user_metadata
3. **Login page** - Email/password with show/hide toggle, forgot password link, calls signInWithPassword
4. **Verify page** - Static check-email confirmation with mail icon
5. **Reset password page** - Email field, calls resetPasswordForEmail with redirect to /update-password
6. **Update password page** - New password + confirm with show/hide, calls updateUser
7. **Auth callback route** - Exchanges Supabase code for session, smart redirect: new signups -> /setup, password reset -> /update-password, invitations -> /accept-invite

## Task Commits

| Task | Name | Commits | Key Files |
|------|------|---------|-----------|
| 1 | Auth layout, signup/login pages | 911dc84 | (auth)/layout.tsx, signup/page.tsx, login/page.tsx, signup-form.tsx, login-form.tsx |
| 2 | Verify, reset, update-password, callback | 3303c99, 44f4508, 6346fa9 | verify/page.tsx, reset-password/page.tsx, update-password/page.tsx, auth/callback/route.ts |
| 3 | Checkpoint: user verification | — | Approved 2026-02-14 |

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| /auth/callback in PUBLIC_ROUTES | Supabase redirects need to reach the callback without auth middleware blocking |
| @anchor/shared as web dependency | Forms import shared Zod schemas for consistent validation |

## User Setup Required

See `.planning/phases/01-foundation-auth/01-USER-SETUP.md` for Supabase configuration steps.

## Next Phase Readiness

Plan 01-04 (App Shell) and 01-05 (Invitations & Team) can proceed. Auth pages provide the authentication foundation they depend on.

## Self-Check: PASSED

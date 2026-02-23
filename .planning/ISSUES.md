# Issues Log

Tracks issues encountered during execution and their resolutions, organized by phase.

---

## Phase 1: Foundation & Auth

### ISS-001: useUser hook missing `/api` prefix on fetch URL
- **Plan:** 01-04 (App Shell)
- **File:** `apps/web/src/hooks/use-user.ts:43`
- **Symptom:** Runtime error when fetching user profile — request to `http://localhost:3001/auth/me` returns 404
- **Root cause:** NestJS has `setGlobalPrefix('api')` (set in `apps/api/src/main.ts:8`), so all endpoints are under `/api/*`. The `use-user.ts` hook used `/auth/me` instead of `/api/auth/me`.
- **Fix:** Changed fetch URL from `${apiUrl}/auth/me` to `${apiUrl}/api/auth/me`
- **Lesson:** Always use the `/api` prefix when calling NestJS endpoints directly. The `apps/web/src/lib/api.ts` wrapper expects callers to include `/api` in paths — follow the same convention in any raw fetch calls.

### ISS-002: Password reset link redirects to login instead of update-password form
- **Plan:** 01-02 (Auth Pages)
- **Files:** `apps/web/src/middleware.ts:60-68`, `apps/web/src/app/auth/callback/route.ts:13-15`, `apps/web/src/app/(auth)/reset-password/page.tsx`
- **Symptom:** Clicking the password reset email link lands on `/login?error=auth_callback_failed` instead of the "Set new password" form
- **Root cause:** Two issues: (1) The middleware redirected authenticated users away from `/auth/callback` and `/update-password` to the dashboard. After the callback exchanges the recovery code (establishing a session), the subsequent redirect to `/update-password` was intercepted. (2) When the code exchange failed (expired link, lost PKCE cookie), the error redirect went to a generic login page with no useful feedback.
- **Fix:** Added `/update-password` and `/auth/callback` to the middleware's redirect exception list. Recovery code failures now redirect to `/reset-password?error=link_expired` with a user-friendly banner message.
- **Commit:** `d308d20`
- **Lesson:** Auth callback and post-callback destination routes must be excluded from the "redirect authenticated users away from public pages" middleware rule.

### ISS-003: Settings nav item greyed out for admin users
- **Plan:** 01-04 (App Shell)
- **Files:** `apps/web/src/hooks/use-user.ts`, `packages/database/prisma/migrations/20260214_add_users_rls/migration.sql`
- **Symptom:** Settings tab in sidebar is greyed out and unclickable even when logged in as the admin user
- **Root cause:** Three compounding issues: (1) The `useUser` hook originally fetched the profile from the NestJS API (`GET /api/auth/me`) — fails when backend isn't running. (2) JWT claims fallback failed because `custom_access_token_hook` wasn't enabled in Supabase Dashboard, so `user_role` wasn't in the JWT. (3) Direct Supabase query to the `users` table failed because the `authenticated` role had no `SELECT` grant and no RLS policy existed — every `users?select=role,...` request returned an error.
- **Fix:** Rewrote `useUser` to query the `users` table directly via Supabase client. Created RLS migration granting `SELECT` to `authenticated` role with a policy restricting users to their own row (`id = auth.uid()`). Migration must be applied via Supabase SQL Editor.
- **Commits:** `88ae052`, `e9753d1`, `374b761`, `9cab29b`
- **Lesson:** When using Supabase PostgREST from the client, tables need explicit `GRANT SELECT TO authenticated` and RLS policies. The init migration only granted permissions to `supabase_auth_admin` (for triggers), not to `authenticated` (for client queries).

---

## Phase 2: Client & Policy Management

*(No issues yet)*

---

## Phase 3: Tasks, Renewals & Dashboard

*(No issues yet)*

---

## Phase 4: Documents & Compliance

*(No issues yet)*

---

## Phase 5: Expenses & Budgets

*(No issues yet)*

---

## Phase 6: Trust & Reputation

*(No issues yet)*

---

## Phase 7: Analytics, Import & Polish

*(No issues yet)*

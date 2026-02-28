# Phase 01 User Setup: Supabase Configuration

This document describes the manual setup steps required before the auth system can be tested. These steps involve creating external services and configuring environment variables that cannot be automated.

## 1. Create Supabase Project

**Why:** Authentication and database

1. Go to [supabase.com](https://supabase.com) and sign in (or create an account)
2. Click **New Project**
3. Choose an organization (or create one)
4. Set project name (e.g., `anchor-dev`)
5. Set a strong database password (save it somewhere secure)
6. Choose a region close to you
7. Click **Create new project** and wait for provisioning

## 2. Configure Environment Variables

Create or update the file `apps/web/.env.local` with the following variables.

All values are found in the **Supabase Dashboard** for your project.

| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard -> Settings -> API -> Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard -> Settings -> API -> anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard -> Settings -> API -> service_role key |
| `SUPABASE_JWT_SECRET` | Supabase Dashboard -> Settings -> API -> JWT Secret |
| `DATABASE_URL` | Supabase Dashboard -> Settings -> Database -> Connection string (Session pooler, port 5432) |
| `DIRECT_DATABASE_URL` | Supabase Dashboard -> Settings -> Database -> Connection string (Direct connection) |

**Template for `apps/web/.env.local`:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
DATABASE_URL=postgresql://postgres.your-project-ref:password@aws-0-region.pooler.supabase.com:5432/postgres
DIRECT_DATABASE_URL=postgresql://postgres.your-project-ref:password@aws-0-region.supabase.com:5432/postgres
```

## 3. Run Database Migration

After environment variables are set:

```bash
cd packages/database && npx prisma migrate deploy
```

This creates all tables (tenants, users, invitations) and the database triggers (handle_new_user, custom_access_token_hook).

## 4. Enable Custom Access Token Hook

This hook adds `tenant_id` and `user_role` to the JWT claims, which are required for row-level security and role-based access.

1. Go to **Supabase Dashboard -> Authentication -> Hooks**
2. Click **Add hook**
3. Select **custom_access_token_hook**
4. Choose the function: `public.custom_access_token_hook`
5. Save


## run DB
npx prisma generate
npx prisma migrate deploy

## 5. Set Email Redirect URLs

These URLs control where Supabase redirects users after email verification, password reset, and invite acceptance.

1. Go to **Supabase Dashboard -> Authentication -> URL Configuration**
2. Set **Site URL** to: `http://localhost:3000`
3. Add the following **Redirect URLs**:
   - `http://localhost:3000/verify`
   - `http://localhost:3000/update-password`
   - `http://localhost:3000/accept-invite`

## Verification

After completing all steps, you can verify the setup:

1. Run `pnpm --filter web dev` to start the dev server
pnpm --filter api start:dev
2. Visit `http://localhost:3000/signup` -- the page should load without errors
3. Try creating an account -- you should receive a verification email
  pnpm --filter @anchor/database exec prisma generate 

  install prisma in root repo
  
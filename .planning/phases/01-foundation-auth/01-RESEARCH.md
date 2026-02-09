# Phase 1: Foundation & Auth - Research

**Researched:** 2026-02-08
**Domain:** Monorepo scaffolding, Supabase Auth, multi-tenancy, NestJS + Next.js foundation
**Confidence:** HIGH

## Summary

This research covers the full technical landscape for Phase 1: monorepo setup with Turborepo + pnpm, Supabase Auth integration for email/password signup, login, verification, password reset, and invitation flows, Prisma ORM with multi-tenant row-level isolation, NestJS JWT verification, Next.js App Router with cookie-based sessions, and the app shell with shadcn/ui + Tailwind CSS v4 + dark mode.

The standard approach is well-established: Turborepo orchestrates a pnpm monorepo with `apps/web` (Next.js) and `apps/api` (NestJS), plus shared packages for types, database, and email templates. Supabase Auth handles all authentication flows natively (signup, verification, reset, invite), with `@supabase/ssr` managing cookie-based sessions in Next.js and NestJS verifying Supabase JWTs via Passport. Multi-tenancy uses `tenant_id` columns on all tables with Prisma Client Extensions auto-injecting tenant filters via `nestjs-cls` (AsyncLocalStorage). The app shell uses shadcn/ui with `next-themes` for dark mode toggling.

**Primary recommendation:** Use Supabase Auth for ALL auth flows (signup, login, verify, reset, invite) -- do not hand-roll any auth logic. Use Prisma Client Extensions (not middleware) for tenant isolation. Use `@supabase/ssr` with middleware for Next.js session management. Use the Supabase Admin API (`inviteUserByEmail`) from NestJS for the invitation flow.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Signup & Login Experience
- Email and password only -- no social login (Google, Microsoft, etc.)
- Signup fields: first name, last name, agency name, email, password, confirm password
- Agency tenant is created at signup from the agency name
- Split-screen login page: left side for branding/tagline/gradient, right side for login form
- After signup and email verification, user lands in a quick setup wizard (2-3 steps: agency details, profile photo, invite first team member) before reaching the dashboard
- Forgot password flow via email reset link

#### Invitation & Onboarding Flow
- Admin invites by entering email address and selecting a role (Admin or Agent) at invite time
- Invited user clicks link and sees a full mini-signup: name, password, optional profile photo. Agency is pre-linked
- Admin can view pending invites, revoke/cancel them, and resend expired invites
- Agency invite cap: 2 users maximum for MVP (admin + 2 invited = 3 total)

#### Role Visibility & Navigation
- Two roles at MVP: Admin (full access, manages agency) and Agent (no invite capability, no budget management, but can submit expenses)
- Restricted nav items are visible but disabled/greyed out with "Admin only" tooltip -- Agent knows features exist
- Top nav bar for branding and profile/account menu
- Collapsible left sidebar for main navigation
- Admin sidebar nav items: Dashboard, Clients, Policies, Tasks, Documents, Expenses, Settings (team, profile)

#### App Shell & Branding
- Color scheme: navy blue primary, white backgrounds -- professional trust and authority feel
- UI component library: shadcn/ui with Tailwind CSS
- Light + dark mode toggle (user can switch)
- Fully responsive: works on desktop, tablet, and mobile. Sidebar collapses to hamburger on small screens

### Claude's Discretion
- Exact navy palette shades and accent colors
- Loading states and skeleton screens
- Form validation UX (inline vs summary)
- Email template design for verification, reset, and invites
- Setup wizard step details and flow
- Error page designs (404, 500)
- Toast/notification component choice

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

The established libraries/tools for Phase 1:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.x | Frontend framework (App Router) | Server components, layouts, middleware for auth session refresh |
| NestJS | 11.x | Backend API framework | Modular architecture, guards, decorators, DI for structured auth/tenant logic |
| Supabase JS | 2.x | Auth + DB client | `@supabase/supabase-js` for all Supabase interactions |
| @supabase/ssr | 0.5.x | Server-side auth | Cookie-based session management for Next.js App Router |
| Prisma | 6.x | ORM | Type-safe queries, migrations, Client Extensions for multi-tenancy |
| Turborepo | 2.x | Monorepo orchestration | Task caching, parallel builds, pnpm workspace support |
| Tailwind CSS | 4.x | Utility-first CSS | Updated theming with `@theme` directive, OKLCH colors |
| shadcn/ui | Latest | UI component library | Built on Radix + Tailwind, fully customizable, Tailwind v4 support |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next-themes | 0.4.x | Dark mode | Theme provider + toggle for light/dark mode switching |
| React Hook Form | 7.x | Form management | All auth forms (signup, login, reset, invite acceptance) |
| Zod | 3.x | Schema validation | Form validation + API DTO validation |
| @nestjs/passport | 10.x | Auth strategy | Passport JWT strategy for Supabase token verification |
| passport-jwt | 4.x | JWT extraction | Extract bearer tokens from Authorization header |
| nestjs-cls | 4.x | Async context | Request-scoped tenant context via AsyncLocalStorage |
| class-validator | 0.14.x | NestJS validation | DTO validation decorators in NestJS controllers |
| class-transformer | 0.5.x | NestJS transformation | Transform plain objects to class instances |
| Resend | 4.x | Transactional email | Invitation emails (NOTF-04) |
| @react-email/components | Latest | Email templates | Type-safe React-based email template components |
| lucide-react | Latest | Icons | Icon set used by shadcn/ui components |
| sonner | Latest | Toast notifications | Toast component for shadcn/ui (recommended by shadcn) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| nestjs-cls (AsyncLocalStorage) | Request-scoped providers | CLS is much more performant -- request-scoped providers recreate all injected services per request |
| Prisma Client Extensions | Prisma middleware (deprecated pattern) | Extensions are the modern, officially recommended approach |
| nest-supabase-guard (npm) | Custom Passport strategy | npm package is simpler but less flexible; custom strategy gives full control over claims extraction |
| sonner | react-hot-toast | sonner has better shadcn/ui integration and is the default recommendation |

**Installation:**
```bash
# Root monorepo
npx create-turbo@latest anchor --package-manager pnpm

# Frontend (apps/web)
npx create-next-app@latest apps/web --typescript --tailwind --app --src-dir
cd apps/web
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add react-hook-form @hookform/resolvers zod
pnpm add next-themes lucide-react sonner
pnpm add -D @types/node

# shadcn/ui init (inside apps/web)
npx shadcn@latest init

# Backend (apps/api)
npx @nestjs/cli new apps/api --package-manager pnpm
cd apps/api
pnpm add @nestjs/passport passport passport-jwt
pnpm add @supabase/supabase-js
pnpm add class-validator class-transformer
pnpm add nestjs-cls
pnpm add resend @react-email/components
pnpm add -D @types/passport-jwt

# Shared database package (packages/database)
pnpm add prisma @prisma/client
```

## Architecture Patterns

### Recommended Project Structure (Phase 1 Scope)
```
anchor/
├── apps/
│   ├── web/                          # Next.js 15 frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/           # Public auth pages (no sidebar)
│   │   │   │   │   ├── login/page.tsx
│   │   │   │   │   ├── signup/page.tsx
│   │   │   │   │   ├── verify/page.tsx
│   │   │   │   │   ├── reset-password/page.tsx
│   │   │   │   │   ├── update-password/page.tsx
│   │   │   │   │   ├── accept-invite/page.tsx
│   │   │   │   │   └── layout.tsx     # Split-screen auth layout
│   │   │   │   ├── (dashboard)/       # Authenticated app shell
│   │   │   │   │   ├── layout.tsx     # Sidebar + topnav layout
│   │   │   │   │   ├── page.tsx       # Dashboard (placeholder)
│   │   │   │   │   └── settings/
│   │   │   │   │       ├── team/page.tsx    # Invite management
│   │   │   │   │       └── profile/page.tsx
│   │   │   │   ├── setup/            # Post-signup wizard
│   │   │   │   │   └── page.tsx
│   │   │   │   └── layout.tsx        # Root layout (ThemeProvider)
│   │   │   ├── components/
│   │   │   │   ├── ui/               # shadcn/ui components
│   │   │   │   ├── layout/
│   │   │   │   │   ├── sidebar.tsx
│   │   │   │   │   ├── topnav.tsx
│   │   │   │   │   └── mode-toggle.tsx
│   │   │   │   └── auth/
│   │   │   │       ├── login-form.tsx
│   │   │   │       ├── signup-form.tsx
│   │   │   │       └── reset-form.tsx
│   │   │   ├── lib/
│   │   │   │   ├── supabase/
│   │   │   │   │   ├── client.ts      # Browser client
│   │   │   │   │   └── server.ts      # Server client
│   │   │   │   └── api.ts             # NestJS API client
│   │   │   └── middleware.ts          # Supabase session refresh
│   │   └── public/
│   │
│   └── api/                           # NestJS backend
│       └── src/
│           ├── auth/
│           │   ├── auth.module.ts
│           │   ├── auth.controller.ts
│           │   ├── auth.service.ts
│           │   ├── strategies/
│           │   │   └── supabase.strategy.ts  # Passport JWT strategy
│           │   ├── guards/
│           │   │   ├── jwt-auth.guard.ts
│           │   │   └── roles.guard.ts
│           │   └── decorators/
│           │       ├── current-user.decorator.ts
│           │       ├── tenant-id.decorator.ts
│           │       └── roles.decorator.ts
│           ├── tenants/
│           │   ├── tenants.module.ts
│           │   ├── tenants.controller.ts
│           │   └── tenants.service.ts
│           ├── invitations/
│           │   ├── invitations.module.ts
│           │   ├── invitations.controller.ts
│           │   └── invitations.service.ts
│           ├── users/
│           │   ├── users.module.ts
│           │   ├── users.controller.ts
│           │   └── users.service.ts
│           ├── common/
│           │   ├── prisma/
│           │   │   ├── prisma.module.ts
│           │   │   ├── prisma.service.ts
│           │   │   └── prisma-tenant.extension.ts
│           │   └── config/
│           │       └── supabase.config.ts
│           └── main.ts
│
├── packages/
│   ├── shared/                        # Shared types & validation
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── auth.ts            # User, Session, Role types
│   │   │   │   └── tenant.ts          # Tenant types
│   │   │   ├── constants/
│   │   │   │   └── roles.ts           # Role enum, permissions map
│   │   │   └── validation/
│   │   │       ├── auth.schema.ts     # Zod schemas for auth forms
│   │   │       └── tenant.schema.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── database/                      # Prisma schema & migrations
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── package.json
│   └── email/                         # React Email templates
│       ├── src/
│       │   ├── invite.tsx
│       │   ├── welcome.tsx
│       │   └── components/
│       │       └── layout.tsx         # Shared email layout
│       └── package.json
│
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── .env.example
└── docker-compose.yml                 # Local Supabase
```

### Pattern 1: Supabase Auth Flow (Signup with Tenant Creation)
**What:** When a user signs up, Supabase creates the auth user, then a database trigger creates the tenant and user profile records.
**When to use:** Every signup creates a new agency.

```typescript
// Source: Supabase official docs - auth-signup + managing-user-data
// Frontend: apps/web/src/components/auth/signup-form.tsx
const { data, error } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
  options: {
    data: {
      first_name: formData.firstName,
      last_name: formData.lastName,
      agency_name: formData.agencyName,
    },
    emailRedirectTo: `${window.location.origin}/verify`,
  },
});
```

```sql
-- Source: Supabase docs - managing-user-data
-- packages/database/prisma/migrations - trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  new_tenant_id uuid;
BEGIN
  -- Create tenant from agency_name metadata
  INSERT INTO public.tenants (name)
  VALUES (NEW.raw_user_meta_data ->> 'agency_name')
  RETURNING id INTO new_tenant_id;

  -- Create user profile linked to tenant
  INSERT INTO public.users (id, tenant_id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    new_tenant_id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    'admin'
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### Pattern 2: Cookie-Based Session with Middleware
**What:** Next.js middleware refreshes Supabase auth tokens on every request using `@supabase/ssr`.
**When to use:** Required for all authenticated pages.

```typescript
// Source: Supabase SSR docs - nextjs
// apps/web/src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session - MUST use getUser(), not getSession()
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users away from protected routes
  if (!user && !request.nextUrl.pathname.startsWith('/login')
      && !request.nextUrl.pathname.startsWith('/signup')
      && !request.nextUrl.pathname.startsWith('/verify')
      && !request.nextUrl.pathname.startsWith('/reset-password')
      && !request.nextUrl.pathname.startsWith('/accept-invite')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Pattern 3: NestJS Supabase JWT Strategy
**What:** Passport strategy that verifies Supabase JWT tokens and extracts user claims.
**When to use:** Every protected NestJS endpoint.

```typescript
// Source: NestJS Passport docs + Supabase JWT docs
// apps/api/src/auth/strategies/supabase.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'supabase') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('SUPABASE_JWT_SECRET'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    // payload contains: sub (user id), email, role, etc.
    return {
      id: payload.sub,
      email: payload.email,
      // tenant_id and role come from custom claims or profile lookup
    };
  }
}
```

### Pattern 4: Prisma Client Extension for Multi-Tenancy
**What:** Auto-inject `tenant_id` into all Prisma queries using Client Extensions + nestjs-cls.
**When to use:** Every database operation.

```typescript
// Source: Prisma Client Extensions docs + nestjs-cls pattern
// apps/api/src/common/prisma/prisma-tenant.extension.ts
import { PrismaClient } from '@prisma/client';

export function createTenantExtension(prisma: PrismaClient, tenantId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async findMany({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, tenantId };
          return query(args);
        },
        async findUnique({ args, query }) {
          // findUnique doesn't support arbitrary where, use findFirst instead
          // or validate tenantId after fetching
          return query(args);
        },
        async create({ args, query }) {
          args.data = { ...args.data, tenantId } as any;
          return query(args);
        },
        async update({ args, query }) {
          args.where = { ...args.where, tenantId } as any;
          return query(args);
        },
        async delete({ args, query }) {
          args.where = { ...args.where, tenantId } as any;
          return query(args);
        },
      },
    },
  });
}
```

```typescript
// apps/api/src/common/prisma/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ClsService } from 'nestjs-cls';
import { createTenantExtension } from './prisma-tenant.extension';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private readonly cls: ClsService) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
  }

  get tenantClient() {
    const tenantId = this.cls.get('tenantId');
    if (!tenantId) {
      throw new Error('Tenant context not set');
    }
    return createTenantExtension(this, tenantId);
  }
}
```

### Pattern 5: Custom Decorators for User & Tenant
**What:** NestJS parameter decorators to extract current user and tenant from request.
**When to use:** Every controller method that needs user or tenant context.

```typescript
// Source: NestJS custom-decorators docs
// apps/api/src/auth/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

// apps/api/src/auth/decorators/tenant-id.decorator.ts
export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.tenantId;
  },
);
```

### Pattern 6: Roles Guard
**What:** NestJS guard that checks user role against required roles for a route.
**When to use:** Admin-only endpoints (invitation management, team settings).

```typescript
// apps/api/src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}

// apps/api/src/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// Usage in controller:
// @Roles('admin')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Post('invite')
// async inviteUser(...) {}
```

### Anti-Patterns to Avoid
- **Using `getSession()` on the server:** Always use `getUser()` (or `getClaims()`) for server-side auth checks. `getSession()` does not revalidate the JWT and can be spoofed.
- **Verifying JWT by calling Supabase API on every request:** Verify JWT locally using the JWT secret in NestJS. Only call Supabase `getUser()` when you need fresh user data.
- **Fat controllers in NestJS:** Keep business logic in services. Controllers handle HTTP parsing, call services, and format responses.
- **Hardcoding tenant_id in every service method:** Use the Prisma Client Extension pattern to auto-inject. Services should not manually filter by tenantId.
- **Storing service role key in frontend:** The Supabase service role key (used for admin operations like `inviteUserByEmail`) must ONLY exist in the NestJS backend. Frontend uses the anon key only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email/password authentication | Custom auth with bcrypt/jwt | Supabase Auth `signUp` + `signInWithPassword` | Handles password hashing, token generation, session management, rate limiting |
| Email verification | Custom token generation + email sending | Supabase Auth built-in email verification | Automatic token generation, email sending, verification flow |
| Password reset | Custom reset token + email flow | Supabase Auth `resetPasswordForEmail` | Secure token generation, expiry handling, email template |
| User invitation | Custom invite system from scratch | Supabase Admin API `inviteUserByEmail` + custom invitations table | Supabase handles the email and token; you track metadata (role, tenant) in your own table |
| JWT token refresh | Custom refresh token rotation | `@supabase/ssr` middleware in Next.js | Automatic token refresh on every request via cookies |
| Dark mode toggle | Custom CSS variable switching | `next-themes` with shadcn/ui | Handles SSR hydration, system preference detection, localStorage persistence |
| Form validation | Custom validation logic | Zod schemas + React Hook Form `@hookform/resolvers` | Type-safe, composable schemas, reusable between frontend and backend |
| Toast notifications | Custom notification system | sonner (shadcn/ui default) | Pre-styled for shadcn, accessible, promise-based toasts |
| Responsive sidebar | Custom media query sidebar | shadcn/ui Sheet component + useMediaQuery | Handles mobile hamburger, animations, accessibility |
| Request-scoped context | Custom middleware with req.tenantId | nestjs-cls (AsyncLocalStorage) | Performant, no request-scoped provider overhead, works with Prisma Extensions |

**Key insight:** Supabase Auth handles 80% of the auth complexity. The remaining 20% is wiring: connecting Supabase Auth events to your domain models (tenants, profiles, roles, invitations). Do not duplicate what Supabase already provides.

## Common Pitfalls

### Pitfall 1: Supabase JWT + NestJS Token Mismatch
**What goes wrong:** NestJS rejects valid Supabase tokens, or accepts expired tokens. Users get random 401 errors.
**Why it happens:** Wrong JWT secret configured, or token refresh not working in Next.js middleware, or CORS blocking cookie propagation.
**How to avoid:**
- Use the `SUPABASE_JWT_SECRET` from Supabase dashboard (Settings > API > JWT Secret)
- Always test the full flow: signup -> verify email -> login -> call NestJS API -> refresh -> call again
- Configure CORS on NestJS to accept credentials from the Next.js origin
- Ensure Next.js middleware is refreshing tokens (calling `getUser()`) on every request
**Warning signs:** 401 errors after idle time, users logged out after browser refresh, inconsistent auth state.

### Pitfall 2: Tenant Isolation Leak During Signup
**What goes wrong:** The database trigger that creates tenants and profiles fails silently, leaving orphan auth users with no tenant. Or race conditions create duplicate tenants.
**Why it happens:** Trigger function has a bug, or the trigger is not created during migration, or the user_metadata fields are misspelled.
**How to avoid:**
- Test the trigger function independently before integrating
- Add NOT NULL constraints on `tenant_id` in the users table
- Log trigger errors to a dedicated error table
- Test signup end-to-end: signup -> check auth.users -> check tenants -> check users
**Warning signs:** Users able to log in but seeing empty/broken UI, null tenant_id in user records.

### Pitfall 3: Supabase Default Email Rate Limit
**What goes wrong:** Development halts because Supabase's built-in email service only allows 2 emails per hour on the free tier and limited on the Pro tier.
**Why it happens:** Developers test signup/invite/reset flows repeatedly and hit the rate limit.
**How to avoid:**
- Use local Supabase development with Mailpit (captures all emails locally, no rate limit)
- Configure a custom SMTP provider (Resend) for production early in Phase 1
- Use Supabase's `generateLink()` admin API to bypass email sending during development/testing
**Warning signs:** "Email rate limit exceeded" errors, signup verification emails not arriving.

### Pitfall 4: Invite Flow Not Multi-Tenant Aware
**What goes wrong:** `inviteUserByEmail` creates a Supabase auth user, but the invited user has no tenant association. When they accept the invite, they're orphaned without an agency.
**Why it happens:** Supabase's invite is user-level, not tenant-aware. The invite token doesn't carry tenant_id or role. Developers assume Supabase handles this.
**How to avoid:**
- Create a custom `invitations` table in your database: `id, tenant_id, email, role, status, token, expires_at, invited_by`
- When admin invites: create invitation record in your DB, THEN call `inviteUserByEmail` with metadata
- When invited user accepts: look up the pending invitation by email, link to the correct tenant and role
- Use Supabase `user_metadata` to pass tenant info, but ALWAYS verify against your invitations table
**Warning signs:** Invited users landing on an empty dashboard, invited users not being associated with the correct agency.

### Pitfall 5: Next.js Middleware Running on Static Assets
**What goes wrong:** Every image, CSS file, and font triggers the auth middleware, making Supabase API calls unnecessarily. Slow page loads.
**Why it happens:** Middleware matcher is too broad (matches everything).
**How to avoid:**
- Use the exact matcher pattern from Supabase docs that excludes static files:
  ```
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
  ```
**Warning signs:** Slow page loads, high Supabase API usage, performance degradation.

### Pitfall 6: Prisma Connection String Confusion
**What goes wrong:** Prisma migrations fail, or the app can't connect to Supabase PostgreSQL, or connection pool exhaustion.
**Why it happens:** Supabase has multiple connection strings (direct, session pooler port 5432, transaction pooler port 6543). Using the wrong one for the wrong purpose causes issues.
**How to avoid:**
- **Migrations:** Use the direct connection string (bypasses pooler)
- **Application runtime:** Use the session pooler (port 5432) for long-lived NestJS server
- Configure in `schema.prisma`:
  ```prisma
  datasource db {
    provider  = "postgresql"
    url       = env("DATABASE_URL")         // Session pooler for runtime
    directUrl = env("DIRECT_DATABASE_URL")  // Direct for migrations
  }
  ```
**Warning signs:** "prepared statement already exists" errors, connection timeout errors, migration failures.

### Pitfall 7: shadcn/ui + Tailwind v4 Configuration Mismatch
**What goes wrong:** Components render without styles, dark mode doesn't work, CSS variables are undefined.
**Why it happens:** Tailwind v4 changed the config approach (CSS-based with `@theme` instead of `tailwind.config.js`), and mixing old patterns with new causes conflicts.
**How to avoid:**
- Use `npx shadcn@latest init` which auto-detects Tailwind v4 and generates correct config
- Use the `@theme inline` directive pattern for CSS variables
- Do NOT create a `tailwind.config.js` file (Tailwind v4 uses CSS-based config)
- Wrap colors in `hsl()` or use OKLCH as shadcn now recommends
**Warning signs:** Unstyled components, "unknown utility" errors, dark mode not toggling.

## Code Examples

### Prisma Schema for Phase 1

```prisma
// Source: Project architecture decisions + Supabase Prisma docs
// packages/database/prisma/schema.prisma

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum UserRole {
  admin
  agent
}

enum InvitationStatus {
  pending
  accepted
  revoked
  expired
}

model Tenant {
  id        String   @id @default(uuid()) @db.Uuid
  name      String
  slug      String   @unique
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  users       User[]
  invitations Invitation[]

  @@map("tenants")
}

model User {
  id        String   @id @db.Uuid  // matches auth.users.id
  tenantId  String   @map("tenant_id") @db.Uuid
  email     String
  firstName String   @map("first_name")
  lastName  String   @map("last_name")
  role      UserRole @default(agent)
  avatarUrl String?  @map("avatar_url")
  setupCompleted Boolean @default(false) @map("setup_completed")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  tenant      Tenant       @relation(fields: [tenantId], references: [id])
  invitations Invitation[] @relation("invitedBy")

  @@index([tenantId])
  @@map("users")
}

model Invitation {
  id          String           @id @default(uuid()) @db.Uuid
  tenantId    String           @map("tenant_id") @db.Uuid
  email       String
  role        UserRole
  status      InvitationStatus @default(pending)
  invitedById String           @map("invited_by_id") @db.Uuid
  token       String?          @unique
  expiresAt   DateTime         @map("expires_at")
  createdAt   DateTime         @default(now()) @map("created_at")
  updatedAt   DateTime         @updatedAt @map("updated_at")

  tenant    Tenant @relation(fields: [tenantId], references: [id])
  invitedBy User   @relation("invitedBy", fields: [invitedById], references: [id])

  @@index([tenantId])
  @@index([email, status])
  @@map("invitations")
}
```

### Supabase Custom Access Token Hook (Add tenant_id + role to JWT)

```sql
-- Source: Supabase custom-access-token-hook docs
-- This adds tenant_id and role to every JWT token
-- so NestJS can extract them without a DB lookup

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  user_tenant_id uuid;
  user_role text;
BEGIN
  claims := event->'claims';

  -- Look up user's tenant and role from public.users
  SELECT tenant_id, role INTO user_tenant_id, user_role
  FROM public.users
  WHERE id = (event->>'user_id')::uuid;

  IF user_tenant_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{tenant_id}', to_jsonb(user_tenant_id::text));
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  END IF;

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT SELECT ON public.users TO supabase_auth_admin;
```

### Invitation Flow (NestJS)

```typescript
// Source: Supabase Admin API + custom invitations pattern
// apps/api/src/invitations/invitations.service.ts
import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { PrismaService } from '../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InvitationsService {
  private supabaseAdmin;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    // Admin client for server-side operations (service role key)
    this.supabaseAdmin = createClient(
      this.config.get('SUPABASE_URL'),
      this.config.get('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  async inviteUser(tenantId: string, invitedById: string, email: string, role: 'admin' | 'agent') {
    // Check invite cap (max 2 invited users per tenant)
    const existingCount = await this.prisma.invitation.count({
      where: {
        tenantId,
        status: { in: ['pending', 'accepted'] },
      },
    });

    if (existingCount >= 2) {
      throw new ForbiddenException('Maximum invite limit reached (2 users)');
    }

    // Check for duplicate pending invite
    const existing = await this.prisma.invitation.findFirst({
      where: { tenantId, email, status: 'pending' },
    });
    if (existing) {
      throw new BadRequestException('Invitation already sent to this email');
    }

    // Create invitation record
    const invitation = await this.prisma.invitation.create({
      data: {
        tenantId,
        email,
        role,
        invitedById,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Send invite via Supabase Admin API
    const { error } = await this.supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        invitation_id: invitation.id,
        tenant_id: tenantId,
        role,
      },
      redirectTo: `${this.config.get('FRONTEND_URL')}/accept-invite`,
    });

    if (error) throw error;

    return invitation;
  }
}
```

### App Shell Layout with Responsive Sidebar

```typescript
// apps/web/src/app/(dashboard)/layout.tsx
// Uses shadcn/ui Sheet for mobile, regular sidebar for desktop

import { Sidebar } from '@/components/layout/sidebar';
import { Topnav } from '@/components/layout/topnav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server component: fetch user from Supabase
  // This data drives role-based nav rendering
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topnav />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### Turbo.json Configuration

```jsonc
// turbo.json
{
  "$schema": "https://turborepo.dev/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "dependsOn": ["^build"],
      "persistent": true,
      "cache": false
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "db:migrate": {
      "cache": false
    },
    "db:generate": {
      "cache": false
    }
  }
}
```

### pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2024 | New package for all SSR frameworks, not Next.js-specific |
| `getSession()` for server auth | `getUser()` / `getClaims()` for server auth | 2024 | `getSession()` doesn't revalidate JWT, security risk on server |
| Prisma middleware for tenant filtering | Prisma Client Extensions | 2023 (Prisma 4.16+) | Extensions are composable, type-safe, officially recommended |
| Tailwind v3 config file (`tailwind.config.js`) | Tailwind v4 CSS-based config (`@theme`) | 2025 | No JS config file, CSS-only configuration |
| HSL color format in shadcn/ui | OKLCH color format | 2025 | Better color space, more perceptually uniform |
| `supabase.auth.getUser()` everywhere | `supabase.auth.getClaims()` for fast checks | 2025 | `getClaims()` validates JWT locally without hitting Supabase API |
| Request-scoped Prisma in NestJS | AsyncLocalStorage via nestjs-cls | 2023+ | Avoids performance penalty of recreating providers per request |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Replaced by `@supabase/ssr`. Do not use.
- Prisma `$use()` middleware: Deprecated in favor of Client Extensions. Still works but not recommended.
- `tailwind.config.js` in Tailwind v4: Use CSS-based `@theme` directive instead.

## Open Questions

1. **`getClaims()` vs `getUser()` availability**
   - What we know: Supabase docs now reference `getClaims()` as a faster alternative to `getUser()` for JWT validation. Multiple docs pages mention it.
   - What's unclear: Whether `getClaims()` is available in the current stable `@supabase/ssr` release or if it's a very recent addition. The older middleware examples still use `getUser()`.
   - Recommendation: Start with `getUser()` in middleware (documented and proven). Switch to `getClaims()` once verified it's stable. Both are secure for server-side use.

2. **Supabase inviteUserByEmail + Custom Invitation Table Sync**
   - What we know: `inviteUserByEmail` creates an auth user and sends an invite email. We need to sync this with our custom `invitations` table.
   - What's unclear: Exact error handling if Supabase invite succeeds but our DB insert fails (or vice versa). Transaction guarantees across two systems.
   - Recommendation: Create invitation record FIRST in our DB, then call Supabase. If Supabase fails, delete the invitation record. Use a try/catch pattern. Consider a `status: 'email_pending'` intermediate state.

3. **Prisma Client Extensions Type Safety with tenantId**
   - What we know: The extension auto-injects tenantId into where clauses. But TypeScript types don't reflect this -- the generated types still show tenantId as required.
   - What's unclear: Whether Prisma 6 has improved type inference for extensions, or if `as any` casts are still needed.
   - Recommendation: Accept the type casting for now. The runtime behavior is correct. Add integration tests to verify tenant isolation.

4. **Custom Access Token Hook Performance**
   - What we know: The hook runs on every token issuance/refresh, adding a DB query to look up tenant_id and role.
   - What's unclear: Performance impact at scale. Whether Supabase caches hook results.
   - Recommendation: Use the hook -- it eliminates per-request DB lookups in NestJS. The trade-off (one query per login/refresh vs one query per API call) is favorable. Monitor in production.

## Discretionary Recommendations

These are areas marked as Claude's Discretion in CONTEXT.md:

### Navy Palette & Accent Colors
**Recommendation:** Use a navy-based palette with these specific shades:
- Primary: `hsl(222 47% 11%)` (navy-950) for dark elements
- Primary foreground: `hsl(210 40% 98%)` (white/near-white)
- Accent: `hsl(217 91% 60%)` (blue-500) for interactive elements, links
- Destructive: `hsl(0 84% 60%)` (red-500) for errors, destructive actions
- Success: `hsl(142 71% 45%)` (green-600) for success states
- Muted: `hsl(217 33% 17%)` (navy-900) for dark mode backgrounds

### Form Validation UX
**Recommendation:** Inline validation with these rules:
- Validate on blur (when field loses focus), not on every keystroke
- Show error messages below the field immediately after blur
- Revalidate on change after an error has been shown (immediate feedback once the user starts fixing)
- Use Zod schemas shared between frontend and backend for consistent validation
- Password strength indicator on signup (visual bar, not just rules text)

### Toast/Notification Component
**Recommendation:** Use sonner (shadcn/ui's recommended toast). Configure with:
- Position: bottom-right for desktop, top-center for mobile
- Success toasts auto-dismiss after 3 seconds
- Error toasts persist until dismissed
- Use promise-based toasts for async operations (shows loading -> success/error)

### Loading States
**Recommendation:**
- Use shadcn/ui Skeleton components for page-level loading
- Use spinner inside buttons during form submission (disable button + show spinner)
- Dashboard placeholder: skeleton cards matching the eventual layout shape

### Email Template Design
**Recommendation:**
- Use React Email with a shared layout component (logo, footer, colors)
- Keep emails simple: logo, heading, body text, CTA button, footer
- Match the navy + white color scheme from the app
- Templates needed in Phase 1: Email Verification, Password Reset, User Invitation

### Setup Wizard Flow
**Recommendation:** 3 steps:
1. **Agency Details** - Agency phone, address (optional), province
2. **Your Profile** - Profile photo upload (optional), title/role description
3. **Invite Team** - Invite first team member (optional, can skip)
- Show progress indicator (step 1 of 3)
- Allow "Skip for now" on each step
- Mark setup as complete after final step (even if skipped)

### Error Pages
**Recommendation:**
- 404: "Page not found" with illustration, link to dashboard
- 500: "Something went wrong" with retry button, link to support
- Auth error: "Session expired" with link to login
- Match the app's navy color scheme and typography

## Sources

### Primary (HIGH confidence)
- [Supabase SSR Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) - Cookie-based session setup, middleware pattern
- [Supabase Password Auth](https://supabase.com/docs/guides/auth/passwords) - signUp, signInWithPassword, resetPasswordForEmail
- [Supabase signUp API Reference](https://supabase.com/docs/reference/javascript/auth-signup) - Method signature, user_metadata, options
- [Supabase Managing User Data](https://supabase.com/docs/guides/auth/managing-user-data) - Profiles table, trigger pattern, user_metadata
- [Supabase Custom Access Token Hook](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook) - Adding custom JWT claims
- [Supabase inviteUserByEmail](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail) - Admin API for user invitations
- [Supabase Prisma Integration](https://supabase.com/docs/guides/database/prisma) - Connection strings, direct vs pooled
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates) - Template customization
- [shadcn/ui Dark Mode Next.js](https://ui.shadcn.com/docs/dark-mode/next) - next-themes setup, ThemeProvider, toggle
- [shadcn/ui Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4) - CSS-based config, @theme directive
- [NestJS Custom Decorators](https://docs.nestjs.com/custom-decorators) - createParamDecorator pattern
- [NestJS Passport Recipe](https://docs.nestjs.com/recipes/passport) - JWT strategy, guards, module setup
- [Turborepo Structuring a Repository](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository) - apps/ + packages/ pattern

### Secondary (MEDIUM confidence)
- [NestJS Multi-Tenant with Prisma Extensions + CLS](https://dev.to/moofoo/nestjspostgresprisma-multi-tenancy-using-nestjs-prisma-nestjs-cls-and-prisma-client-extensions-ok7) - AsyncLocalStorage pattern, Prisma extension for RLS
- [NestJS Multi-Tenant with Prisma Proxy](https://dev.to/murilogervasio/how-to-make-multi-tenant-applications-with-nestjs-and-a-prisma-proxy-to-automatically-filter-tenant-queries--4kl2) - Prisma client extension factory pattern
- [nest-supabase-guard](https://github.com/MichaelMilstead/nest-supabase-guard) - Simple NestJS guard for Supabase JWT
- [nestjs-supabase-auth](https://github.com/hiro1107/nestjs-supabase-auth) - Passport strategy for Supabase
- [nestjs-resend](https://github.com/jiangtaste/nestjs-resend) - NestJS provider for Resend
- [Supabase Invite Discussion](https://github.com/orgs/supabase/discussions/6055) - Multi-tenant invite patterns

### Tertiary (LOW confidence)
- [Supabase `getClaims()` references](https://supabase.com/docs/guides/auth/server-side/nextjs) - Seen in recent docs but exact API availability needs verification at implementation time

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries are well-documented with official docs verified
- Architecture: HIGH - Monorepo + module patterns verified across multiple authoritative sources
- Auth flows: HIGH - Supabase official docs provide exact API signatures and patterns
- Multi-tenancy: MEDIUM - Prisma Client Extension pattern verified across community sources; type-safety details unclear
- Invite flow: MEDIUM - Supabase Admin API documented but multi-tenant invite wiring requires custom implementation
- Pitfalls: HIGH - Common issues well-documented across Supabase issues, community discussions, and official troubleshooting

**Research date:** 2026-02-08
**Valid until:** 2026-03-08 (30 days - stack is stable)

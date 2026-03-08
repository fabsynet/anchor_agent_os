# Phase 9: Founder / Super-Admin Dashboard - Research

**Researched:** 2026-03-07
**Domain:** Platform-level admin panel (separate Next.js app), cross-tenant Prisma queries, Supabase impersonation, analytics aggregation
**Confidence:** HIGH

## Summary

This phase builds an entirely separate admin application (`apps/admin`) within the existing Turborepo monorepo. The admin panel provides the platform founder with cross-tenant visibility, agency management, user support actions, impersonation, and platform-wide analytics. The existing monorepo infrastructure (pnpm-workspace, Turborepo, shared packages) already supports adding a new app. The NestJS API already has cross-tenant query capability via raw `PrismaService` (bypassing `tenantClient`), the Supabase admin client (`createSupabaseAdmin`) for auth operations, and export utilities (CSV/PDF) in the web app that can be replicated.

The main architectural challenges are: (1) establishing a separate super-admin auth flow isolated from tenant auth, (2) implementing impersonation via Supabase `generateLink` + `verifyOtp`, (3) building cross-tenant API endpoints that bypass tenant scoping, and (4) creating a comprehensive audit trail for all admin actions.

**Primary recommendation:** Build `apps/admin` as a standalone Next.js 16 app sharing `@anchor/shared` types and `packages/database` Prisma. Add new `super_admin` role enum and `SuperAdmin` model to Prisma schema. All admin API endpoints go under a new `/admin` prefix in the existing NestJS API, protected by a `SuperAdminGuard`. Use Recharts (already installed pattern) for analytics charts.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Landing view: summary cards at top (total agencies, users, policies, clients) + health alerts below
- Metrics categories: growth (new agencies/users/clients over time), engagement (active agencies, login frequency, feature usage), business (total policies, premium value, renewal rates), operational (email delivery, storage, errors)
- Visual charts (line graphs, bar charts) with CSV/PDF export option
- Time range: preset periods (7d, 30d, 90d, All Time) plus custom date picker
- Searchable table for agency list (name, plan, user count, created date -- search/filter/sort)
- Click into agency opens a dedicated agency profile page with tabs (overview, users, policies summary, activity log)
- Full read access to individual records within any agency
- Full impersonation -- super-admin can act as agency admin, make changes on their behalf for support
- Impersonation banner: "Acting as [Agency]" clearly visible
- Impersonation sessions auto-expire (e.g., 30 min) -- must re-enter to continue
- Trigger password reset email for any user
- Disable/enable user accounts (lock out or re-enable)
- Change user role within their agency (promote/demote)
- Deactivate user (soft delete -- NOT permanent deletion)
- Suspend entire agency (all users locked out until re-enabled)
- Export agency's full data (clients, policies, etc.) as CSV/JSON
- Adjust agency-specific limits (user cap, storage, etc.)
- No agency deletion -- suspend only
- Modal confirmation for all destructive actions (suspend, deactivate, role changes)
- Non-destructive actions (password reset, view) proceed without confirmation
- Every super-admin action logged with timestamp, action type, target user/agency
- Full audit log viewable in the admin panel
- Separate login route (/admin/login or similar) -- isolated from tenant auth
- Separate Next.js app in the monorepo (apps/admin) -- fully isolated deployment
- Small team access (2-3 super-admins) -- need ability to add/remove super-admins
- Impersonation sessions time-limited with auto-expiry

### Claude's Discretion
- Exact chart library and visualization approach (likely Recharts, matching existing patterns)
- Impersonation session duration (30 min suggested, Claude can adjust)
- Admin app styling (can match or diverge from tenant app)
- Audit log retention policy
- Super-admin invitation/onboarding flow mechanics
- Health alert thresholds and definitions

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | Admin frontend app | Matches existing `apps/web`, same Turborepo setup |
| NestJS | 11.x | Admin API endpoints (same API server) | Reuse existing API, add admin module |
| Prisma | 6.19.x | Cross-tenant DB queries | Already configured; raw `PrismaService` bypasses tenant scoping |
| Supabase Auth | 2.95.x | Super-admin auth + impersonation | `generateLink` + `verifyOtp` for impersonation |
| Recharts | 3.7.x | Charts (line, bar, area) | Already installed and used in `apps/web` analytics |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui | latest | UI components | Re-initialize for `apps/admin` via `npx shadcn@latest init` |
| @tanstack/react-table | 8.x | Agency/user tables with search/sort/filter | Same pattern as existing tables |
| date-fns | 4.x | Date range calculations | Already in use across the stack |
| papaparse | 5.x | CSV export | Already in `apps/web`, replicate pattern |
| jspdf + jspdf-autotable | 4.x/5.x | PDF export | Already in `apps/web`, replicate pattern |
| sonner | 2.x | Toast notifications | Standard across the project |
| lucide-react | latest | Icons | Standard across the project |
| zod | 4.x | Validation schemas | Shared via `@anchor/shared` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Separate `apps/admin` Next.js app | Route group in `apps/web` (e.g., `/admin/*`) | User decision: separate app for full isolation |
| Separate NestJS app for admin API | Admin module in existing API | Single API server is simpler, admin guard isolates routes |
| Recharts | Tremor or Chart.js | Recharts already installed and used, no reason to switch |

**Installation for apps/admin:**
```bash
pnpm create next-app apps/admin --typescript --tailwind --eslint --app --src-dir --no-import-alias
cd apps/admin
npx shadcn@latest init
pnpm add @anchor/shared@workspace:* @supabase/ssr @supabase/supabase-js recharts @tanstack/react-table date-fns papaparse jspdf jspdf-autotable lucide-react sonner zod react-hook-form @hookform/resolvers
```

## Architecture Patterns

### Recommended Project Structure

```
apps/admin/                    # NEW - Super-admin Next.js app
  src/
    app/
      (auth)/
        login/page.tsx         # /admin/login
      (admin)/
        layout.tsx             # Admin shell with sidebar
        page.tsx               # Dashboard landing (metrics + health)
        agencies/
          page.tsx             # Agency list table
          [id]/
            page.tsx           # Agency detail with tabs
        users/
          page.tsx             # Cross-tenant user search
        audit-log/
          page.tsx             # Audit log viewer
        settings/
          page.tsx             # Super-admin management
      layout.tsx               # Root layout
    components/
      layout/                  # Admin shell, sidebar, impersonation banner
      charts/                  # Recharts wrappers for metrics
      agencies/                # Agency-specific components
      users/                   # User management components
    lib/
      api.ts                   # Admin API client (same pattern as web)
      supabase/                # Supabase client config (separate from web)
    middleware.ts              # Auth middleware for admin app

apps/api/src/
  admin/                       # NEW - Admin module
    admin.module.ts
    admin.controller.ts        # Platform metrics, health
    admin.service.ts           # Cross-tenant aggregation queries
    agencies/
      agencies.controller.ts   # Agency CRUD, suspend, export
      agencies.service.ts
    users/
      users.controller.ts      # User management (disable, role change, password reset)
      users.service.ts
    impersonation/
      impersonation.controller.ts
      impersonation.service.ts
    audit/
      audit.controller.ts
      audit.service.ts
  auth/guards/
    super-admin.guard.ts       # NEW - SuperAdmin guard

packages/database/prisma/
  schema.prisma               # Add SuperAdmin model, AdminAuditLog, agency suspension fields
```

### Pattern 1: Super-Admin Authentication (Separate from Tenant Auth)

**What:** Super-admins are a different concept than tenant `admin` role users. They need a separate model and guard.

**When to use:** All admin API endpoints.

**Schema additions:**
```prisma
model SuperAdmin {
  id        String   @id @default(uuid()) @db.Uuid // matches auth.users.id
  email     String   @unique
  firstName String   @map("first_name")
  lastName  String   @map("last_name")
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  auditLogs AdminAuditLog[]

  @@map("super_admins")
}

model AdminAuditLog {
  id           String   @id @default(uuid()) @db.Uuid
  superAdminId String   @map("super_admin_id") @db.Uuid
  action       String   // e.g., 'user.disable', 'agency.suspend', 'impersonation.start'
  targetType   String   @map("target_type") // 'user', 'agency', 'tenant'
  targetId     String   @map("target_id") @db.Uuid
  metadata     Json?    // Additional context (old value, new value, etc.)
  ipAddress    String?  @map("ip_address")
  createdAt    DateTime @default(now()) @map("created_at")

  superAdmin SuperAdmin @relation(fields: [superAdminId], references: [id])

  @@index([superAdminId, createdAt(sort: Desc)])
  @@index([targetType, targetId])
  @@index([action, createdAt(sort: Desc)])
  @@map("admin_audit_logs")
}
```

**Tenant model additions:**
```prisma
// Add to existing Tenant model:
  isSuspended  Boolean  @default(false) @map("is_suspended")
  suspendedAt  DateTime? @map("suspended_at")
  userCap      Int      @default(3) @map("user_cap") // max users (admin + invited)
  storageCap   Int      @default(500) @map("storage_cap") // MB
```

**Guard implementation:**
```typescript
// apps/api/src/auth/guards/super-admin.guard.ts
@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing authorization token');
    }

    const token = authHeader.substring(7);

    // Validate with Supabase (same pattern as JwtAuthGuard)
    const supabase = createClient(
      this.configService.get('NEXT_PUBLIC_SUPABASE_URL'),
      this.configService.get('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) throw new UnauthorizedException('Invalid token');

    // Check super_admins table
    const superAdmin = await this.prisma.superAdmin.findUnique({
      where: { id: user.id, isActive: true },
    });

    if (!superAdmin) {
      throw new ForbiddenException('Not a super-admin');
    }

    request.user = { id: user.id, email: user.email, isSuperAdmin: true };
    return true;
  }
}
```

### Pattern 2: Cross-Tenant Queries (Raw PrismaService)

**What:** Admin endpoints must bypass tenant scoping. Use `this.prisma` directly (NOT `this.prisma.tenantClient`).

**When to use:** All admin service methods.

**Example:**
```typescript
// Cross-tenant aggregation
async getPlatformMetrics() {
  const [totalAgencies, totalUsers, totalPolicies, totalClients] = await Promise.all([
    this.prisma.tenant.count(),
    this.prisma.user.count(),
    this.prisma.policy.count(),
    this.prisma.client.count(),
  ]);

  return { totalAgencies, totalUsers, totalPolicies, totalClients };
}

// Agency-specific deep dive
async getAgencyDetails(tenantId: string) {
  return this.prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      users: { select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true } },
      _count: { select: { clients: true, policies: true, tasks: true, documents: true } },
    },
  });
}
```

### Pattern 3: Impersonation via Supabase Admin API

**What:** Super-admin generates a magic link for a target user, then verifies it to obtain that user's session. Track impersonation state in a separate cookie/session.

**When to use:** When super-admin needs to act as an agency admin.

**Implementation approach:**
```typescript
// Backend: apps/api/src/admin/impersonation/impersonation.service.ts
async startImpersonation(superAdminId: string, targetUserId: string) {
  // 1. Look up target user
  const targetUser = await this.prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) throw new NotFoundException('User not found');

  // 2. Generate magic link via Supabase admin
  const { data, error } = await this.supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: targetUser.email,
  });

  if (error) throw new InternalServerErrorException('Failed to generate impersonation link');

  // 3. Return token_hash and OTP for frontend to verify
  // The frontend will call verifyOtp to establish the session
  return {
    tokenHash: data.properties.hashed_token,
    email: targetUser.email,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min
    tenantId: targetUser.tenantId,
    tenantName: (await this.prisma.tenant.findUnique({ where: { id: targetUser.tenantId } }))?.name,
  };
}
```

```typescript
// Frontend: After receiving token, verify OTP to become that user
// Store original admin session info in a separate cookie before switching
const startImpersonation = async (targetUserId: string) => {
  // Save current admin session
  const { data: { session: adminSession } } = await supabase.auth.getSession();
  document.cookie = `admin_session=${JSON.stringify({
    accessToken: adminSession.access_token,
    refreshToken: adminSession.refresh_token,
    expiresAt: Date.now() + 30 * 60 * 1000,
  })}; path=/; max-age=1800; secure; samesite=strict`;

  // Call backend to generate link
  const { tokenHash, email } = await adminApi.post('/admin/impersonation/start', { targetUserId });

  // Verify OTP to switch session
  await supabase.auth.verifyOtp({ type: 'email', token_hash: tokenHash, email });

  // Now logged in as target user - redirect to tenant app
  window.location.href = `${TENANT_APP_URL}/?impersonating=true`;
};
```

### Pattern 4: Audit Trail Middleware

**What:** Automatically log every admin action with context.

**When to use:** Every mutating admin endpoint.

**Example:**
```typescript
// Decorator-based approach
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    superAdminId: string;
    action: string;
    targetType: string;
    targetId: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
  }) {
    await this.prisma.adminAuditLog.create({ data: params });
  }
}

// Usage in controller/service:
await this.auditService.log({
  superAdminId: user.id,
  action: 'agency.suspend',
  targetType: 'tenant',
  targetId: tenantId,
  metadata: { reason: dto.reason },
  ipAddress: request.ip,
});
```

### Anti-Patterns to Avoid
- **Using `tenantClient` in admin services:** Admin queries are cross-tenant -- always use raw `this.prisma`
- **Sharing auth flow with tenant app:** Super-admin auth is completely separate -- different guard, different model, different login page
- **Storing impersonation state only in frontend:** Must track server-side for auto-expiry and audit
- **Deleting users or agencies:** User decision is soft-delete/suspend only -- no hard deletes
- **Using Supabase REST API for DB queries:** Project standard is Prisma for all DB access

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Charts/visualization | Custom SVG charts | Recharts (already in project) | Complex responsive charts with tooltips, legends, animations |
| CSV export | Manual string concatenation | PapaParse `unparse()` | Edge cases with commas, quotes, unicode in data |
| PDF export | Raw PDF generation | jsPDF + jspdf-autotable | Table formatting, page breaks, headers |
| Data tables with sort/filter | Custom table implementation | @tanstack/react-table | Pagination, sorting, filtering, column visibility |
| Date range calculations | Manual date math | date-fns | Timezone handling, period calculations |
| Form validation | Custom validation | Zod schemas in @anchor/shared | Consistent with existing patterns |
| UI components | Custom buttons, dialogs, etc. | shadcn/ui | Consistent with existing design system |

**Key insight:** The existing `apps/web` already has established patterns for tables, charts, export, and forms. The admin app should replicate these patterns, not reinvent them.

## Common Pitfalls

### Pitfall 1: Tenant Scoping Leaking Into Admin Queries
**What goes wrong:** Using `tenantClient` (which auto-filters by tenant_id) in admin service methods returns only one tenant's data.
**Why it happens:** Muscle memory from building tenant-scoped features. The `PrismaService.tenantClient` getter reads from CLS context.
**How to avoid:** Admin services MUST use raw `this.prisma` (PrismaService directly). SuperAdminGuard does NOT set CLS tenantId.
**Warning signs:** Queries returning unexpectedly few results; errors about "Tenant context not set."

### Pitfall 2: Impersonation Session Conflicts
**What goes wrong:** Super-admin's impersonation signs out the actual user, or admin loses their session.
**Why it happens:** Supabase `verifyOtp` creates a real session -- signing out affects the actual user if using global scope.
**How to avoid:** (1) Store admin's original session in a separate secure cookie before switching. (2) Use `signOut({ scope: 'local' })` when ending impersonation. (3) Track impersonation server-side with expiry.
**Warning signs:** Users reporting unexpected logouts; admin unable to return to admin panel.

### Pitfall 3: Admin App Missing Shared Dependencies
**What goes wrong:** Build fails because `apps/admin` can't resolve `@anchor/shared` or Prisma types.
**Why it happens:** New app needs explicit workspace dependency declaration and may need `transpilePackages` config.
**How to avoid:** Add `@anchor/shared: workspace:*` to admin's package.json. Add `transpilePackages: ['@anchor/shared']` to next.config.ts. Run `pnpm install` from root after adding deps.
**Warning signs:** Module not found errors during build.

### Pitfall 4: Supabase Middleware Cookie Isolation
**What goes wrong:** Admin app and tenant app share Supabase cookies, causing session cross-contamination.
**Why it happens:** Both apps use the same Supabase project URL, so cookies have the same key prefix.
**How to avoid:** Deploy admin app on a different subdomain (e.g., `admin.anchor.com` vs `app.anchor.com`). In development, use different ports (3000 for web, 3002 for admin). Cookies are port-scoped in most browsers during development.
**Warning signs:** Logging into admin redirects to tenant dashboard; session state is confused.

### Pitfall 5: Agency Suspension Not Blocking Auth
**What goes wrong:** Setting `isSuspended = true` on tenant record, but users can still log in and use the API.
**Why it happens:** The existing `JwtAuthGuard` checks `user.isActive` but not `tenant.isSuspended`.
**How to avoid:** Add tenant suspension check to `JwtAuthGuard`: after resolving tenantId, query `tenant.isSuspended` and throw `ForbiddenException` if true. Cache this check briefly to avoid per-request DB lookup.
**Warning signs:** Suspended agency users still accessing the platform.

### Pitfall 6: Prisma Generate After Schema Changes
**What goes wrong:** TypeScript errors on new models (`SuperAdmin`, `AdminAuditLog`) after migration.
**Why it happens:** Prisma client not regenerated after schema changes (known project issue).
**How to avoid:** Always run `pnpm --filter database exec prisma generate` after any schema changes, before building.
**Warning signs:** TS2339 errors on new model accessors.

## Code Examples

### Cross-Tenant Platform Metrics Query
```typescript
// Source: Based on existing analytics.service.ts pattern
async getPlatformMetrics(range: { start: Date; end: Date }) {
  const [agencies, users, policies, clients, premiumAgg] = await Promise.all([
    this.prisma.tenant.count({ where: { createdAt: { gte: range.start, lte: range.end } } }),
    this.prisma.user.count({ where: { createdAt: { gte: range.start, lte: range.end } } }),
    this.prisma.policy.count({ where: { createdAt: { gte: range.start, lte: range.end } } }),
    this.prisma.client.count({ where: { createdAt: { gte: range.start, lte: range.end } } }),
    this.prisma.policy.aggregate({
      where: { status: { in: ['active', 'pending_renewal'] }, premium: { not: null } },
      _sum: { premium: true },
    }),
  ]);

  return {
    newAgencies: agencies,
    newUsers: users,
    newPolicies: policies,
    newClients: clients,
    totalPremiumValue: premiumAgg._sum.premium || 0,
  };
}
```

### Growth Time Series Data
```typescript
// Group by month for line charts
async getGrowthTimeSeries(months: number = 12) {
  const results = [];
  for (let i = months - 1; i >= 0; i--) {
    const start = startOfMonth(subMonths(new Date(), i));
    const end = endOfMonth(start);
    const [agencies, users, clients] = await Promise.all([
      this.prisma.tenant.count({ where: { createdAt: { gte: start, lte: end } } }),
      this.prisma.user.count({ where: { createdAt: { gte: start, lte: end } } }),
      this.prisma.client.count({ where: { createdAt: { gte: start, lte: end } } }),
    ]);
    results.push({ month: format(start, 'MMM yyyy'), agencies, users, clients });
  }
  return results;
}
```

### Agency List with Aggregation
```typescript
async getAgencyList(params: { search?: string; page: number; limit: number; sortBy: string; sortDir: 'asc' | 'desc' }) {
  const where = params.search ? {
    OR: [
      { name: { contains: params.search, mode: 'insensitive' as const } },
      { slug: { contains: params.search, mode: 'insensitive' as const } },
    ],
  } : {};

  const [agencies, total] = await Promise.all([
    this.prisma.tenant.findMany({
      where,
      include: {
        _count: { select: { users: true, clients: true, policies: true } },
      },
      orderBy: { [params.sortBy]: params.sortDir },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    this.prisma.tenant.count({ where }),
  ]);

  return { agencies, total, page: params.page, limit: params.limit };
}
```

### Admin Middleware (apps/admin)
```typescript
// apps/admin/src/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/login'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options));
        },
      },
    },
  );

  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    request.cookies.getAll().forEach(cookie => {
      if (cookie.name.startsWith('sb-')) supabaseResponse.cookies.delete(cookie.name);
    });
  }

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

## Discretionary Recommendations

### Chart Library: Recharts (CONFIRMED)
Recharts 3.7.x is already installed and used in 6 components across the existing web app (analytics tabs, dashboard charts). Use the same library for consistency. No need to add a new dependency.

### Impersonation Session Duration: 30 minutes
30 minutes is appropriate for support work. Implement server-side tracking with a `ImpersonationSession` record or a signed cookie with expiry. Auto-expire by checking timestamp on each admin API request during impersonation.

### Admin App Styling: Match tenant app with distinct color accent
Reuse the same shadcn/ui components and Tailwind v4 setup. Use a different primary/accent color (e.g., darker/corporate theme) to visually distinguish from tenant app. The impersonation banner should use a strong warning color (amber/orange).

### Audit Log Retention: No expiry (retain indefinitely)
For a small-team admin panel (2-3 users), audit log volume will be negligible. No need for retention limits. If needed later, add a `createdAt < X` cleanup job.

### Super-Admin Onboarding Flow
First super-admin: seeded directly into the database (migration or manual SQL). Additional super-admins: invited by existing super-admin via the admin panel settings page. Use Supabase `inviteUserByEmail` + add record to `super_admins` table. Simple flow, no complex role hierarchy needed.

### Health Alert Thresholds
- **Email delivery failures:** Alert if > 10% failure rate in last 24h
- **Inactive agencies:** Flag agencies with no logins in 30+ days
- **Storage approaching limit:** Alert at 80% of agency storage cap
- **Error spike:** Alert if error count doubles compared to previous period

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Admin panel as route group in main app | Separate app in monorepo | Current best practice | Full deployment isolation, separate middleware |
| Custom JWT for admin | Supabase auth with role check | N/A (using existing auth) | Reuse infrastructure, no custom token management |
| REST API per admin feature | Single admin module with sub-controllers | N/A | Organized, maintainable |

## Open Questions

1. **Supabase cookie isolation in development**
   - What we know: Both apps will use the same Supabase project, creating potential cookie conflicts on localhost
   - What's unclear: Whether different ports fully isolate cookies in all browsers during development
   - Recommendation: Use different ports (3000 for web, 3002 for admin). If issues arise, use different cookie storage keys via Supabase client config.

2. **Impersonation and the handle_new_user trigger**
   - What we know: Supabase `generateLink` + `verifyOtp` creates a real session for the target user
   - What's unclear: Whether this might trigger the `handle_new_user` trigger again for existing users
   - Recommendation: The trigger should be idempotent (user already exists), but verify with a test.

3. **Admin app deployment strategy**
   - What we know: Admin app will be in `apps/admin` as a separate Next.js app
   - What's unclear: Whether it deploys to the same host/Vercel project or a separate one
   - Recommendation: Plan for separate deployment (different Vercel project or subdomain). Can be decided at deployment time.

## Sources

### Primary (HIGH confidence)
- Existing codebase analysis: `apps/api/src/auth/guards/jwt-auth.guard.ts`, `apps/api/src/common/prisma/prisma.service.ts`, `apps/api/src/common/config/supabase.config.ts`
- Existing codebase: `apps/web/src/middleware.ts`, `apps/web/src/lib/api.ts`, `turbo.json`, `pnpm-workspace.yaml`
- Prisma schema: `packages/database/prisma/schema.prisma`
- Existing analytics/dashboard services for query patterns

### Secondary (MEDIUM confidence)
- [Supabase Impersonation Guide (catjam.fi)](https://catjam.fi/articles/supabase-admin-impersonation) - Detailed implementation with generateLink + verifyOtp
- [Supabase Admin generateLink docs](https://supabase.com/docs/reference/javascript/auth-admin-generatelink) - Official API reference
- [Supabase Impersonation Discussion #31244](https://github.com/orgs/supabase/discussions/31244) - Community patterns

### Tertiary (LOW confidence)
- [Supabase Discussion #36310](https://github.com/orgs/supabase/discussions/36310) - Feature request for native impersonation SDK support (not yet available)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use in the monorepo, patterns well established
- Architecture: HIGH - Follows existing monorepo patterns, clear separation of concerns
- Super-admin auth: HIGH - Uses same Supabase auth infrastructure with additional DB check
- Impersonation: MEDIUM - Pattern is documented but has edge cases (cookie isolation, trigger side effects)
- Pitfalls: HIGH - Based on documented project learnings and codebase analysis

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (30 days - stable domain, established patterns)

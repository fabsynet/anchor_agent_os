# Phase 6: Trust & Reputation - Research

**Researched:** 2026-02-22
**Domain:** Public-facing agent profile pages, testimonial collection/curation, Supabase Storage for images
**Confidence:** HIGH (all patterns established in prior phases)

## Summary

Phase 6 introduces the first public-facing pages in the Anchor MVP: a testimonial submission form (accessible via shareable link) and a public agent badge page. The core technical challenges are: (1) creating unauthenticated API endpoints and Next.js pages alongside the existing authenticated infrastructure, (2) extending the database schema with new models for testimonials, agent profile data, and badge page customization, (3) handling image uploads (profile photo, cover banner) via the established Supabase Storage pattern, and (4) implementing slug-based vanity URLs with conflict handling.

The standard approach uses all existing project patterns (NestJS modules, Prisma models, Supabase Storage, shadcn/ui components) with one key architectural addition: public API endpoints that bypass `JwtAuthGuard` for testimonial submission and badge page data retrieval. The existing notification infrastructure (`AlertsService`) handles testimonial notifications seamlessly.

**Primary recommendation:** Extend the database with `AgentProfile` and `Testimonial` models, create a new `badge` NestJS module with both authenticated (agent management) and unauthenticated (public view/submit) endpoints, and add a new `(public)` Next.js route group for `/agent/[slug]` and `/testimonial/[slug]` pages.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Testimonial Collection:** Agent generates a generic shareable link (not per-client) -- one link per agent that anyone can use. Client enters their name/info on the form when submitting. No system-sent emails -- agent copies the link and shares however they want. Submission form includes: 1-5 star rating, free-text testimonial area, and strength category checkboxes (e.g., responsiveness, knowledge, trustworthiness). Client chooses whether to display their name or submit anonymously.
- **Testimonial Curation:** New testimonials are auto-approved -- appear on badge page immediately. Agent can hide/show individual testimonials (toggle visibility) but cannot edit client's text. Agent receives in-app notification (via existing Phase 5 notification bell) when a new testimonial is submitted. Testimonials ordered most recent first on badge page.
- **Badge Page Presentation:** URL structure: `/agent/[name-slug]` -- clean vanity URL with agent's name (e.g., `/agent/john-smith`). Full professional profile: photo, full name, license number, agency name, contact info, social links. Products offered section -- agent lists the types of insurance they sell. Embeddable links -- agent can add custom links (website, booking page, etc.). Testimonial display: 1-2 featured/highlighted testimonials at top, then a list of remaining ones below. Light customization: agent can set a cover photo/banner and choose an accent color. Page is publicly accessible -- no authentication required to view.

### Claude's Discretion
- Strength category labels (specific checkbox options for testimonial form)
- Badge page responsive layout and exact component structure
- Slug generation logic and conflict handling
- How featured testimonials are selected (manual pin or auto-select highest rated)
- Cover photo/banner dimensions and upload constraints

### Deferred Ideas (OUT OF SCOPE)
- **Feedback surveys** -- custom survey creation, question types, template + customize flow, survey responses on client profile. IGNORE completely.
- **Per-client testimonial links** -- using generic link only; per-client links deferred.
- **Email notifications for new testimonials** -- in-app only; email deferred.
</user_constraints>

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| Prisma | existing | Database schema + queries | New models: AgentProfile, Testimonial |
| NestJS | 11 | Backend API | New testimonials module + badge module |
| Next.js | 16 | Frontend | New (public) route group for badge pages |
| Supabase Storage | existing | Image uploads | New `badge-assets` bucket for photos/banners |
| shadcn/ui | existing | UI components | Star rating, form inputs, cards |
| Zod v4 | existing | Validation | Shared schemas for testimonial + profile forms |
| @hookform/resolvers v5 | existing | Form validation | React Hook Form integration |

### Supporting (already in project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| AlertsService | existing | In-app notifications | Notify agent of new testimonial submission |
| class-validator | existing | NestJS DTO validation | Backend DTOs for testimonial + profile endpoints |
| multer | existing | File upload handling | Cover photo and profile photo uploads |
| crypto | built-in | UUID generation | Unique storage paths for uploaded images |

### No New Dependencies Required
All functionality can be built using the existing stack. No new libraries needed.

## Architecture Patterns

### Recommended Database Schema

```prisma
// New models to add to schema.prisma

model AgentProfile {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @unique @map("user_id") @db.Uuid
  tenantId    String   @map("tenant_id") @db.Uuid
  slug        String   @unique

  // Professional info
  licenseNumber  String?  @map("license_number")
  bio            String?
  phone          String?
  email          String?  // Public contact email (may differ from auth email)

  // Social links
  website        String?
  linkedIn       String?  @map("linkedin")
  twitter        String?
  facebook       String?
  instagram      String?
  whatsApp       String?  @map("whatsapp")

  // Products offered (JSON array of strings)
  productsOffered String[] @map("products_offered")

  // Custom links (JSON array of {label, url})
  customLinks    Json?    @map("custom_links") @default("[]")

  // Customization
  coverPhotoPath String?  @map("cover_photo_path")
  accentColor    String?  @map("accent_color") @default("#0f172a")

  isPublished    Boolean  @default(false) @map("is_published")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  user          User          @relation(fields: [userId], references: [id])
  tenant        Tenant        @relation(fields: [tenantId], references: [id])
  testimonials  Testimonial[]

  @@index([tenantId])
  @@index([slug])
  @@map("agent_profiles")
}

model Testimonial {
  id              String   @id @default(uuid()) @db.Uuid
  agentProfileId  String   @map("agent_profile_id") @db.Uuid

  // Submitter info
  authorName      String   @map("author_name")
  authorEmail     String?  @map("author_email")
  isAnonymous     Boolean  @default(false) @map("is_anonymous")

  // Content
  rating          Int      // 1-5
  content         String
  strengths       String[] // Array of strength category values

  // Curation
  isVisible       Boolean  @default(true) @map("is_visible")
  isFeatured      Boolean  @default(false) @map("is_featured")

  createdAt       DateTime @default(now()) @map("created_at")

  agentProfile    AgentProfile @relation(fields: [agentProfileId], references: [id], onDelete: Cascade)

  @@index([agentProfileId, isVisible, createdAt(sort: Desc)])
  @@index([agentProfileId, isFeatured])
  @@map("testimonials")
}
```

### Key Schema Decisions

1. **AgentProfile is separate from User**: The User model is auth-focused. AgentProfile holds public-facing badge data. One-to-one via `userId @unique`. This avoids bloating the User model and keeps badge data cleanly separated.

2. **Slug on AgentProfile (not User)**: The slug is for the public badge page URL, which is an agent profile concern. Users who never set up a badge page don't need slugs.

3. **`productsOffered` as String array**: Simple string array covers the "types of insurance they sell" requirement without needing a separate model. Values like `["auto", "home", "life", "commercial", "travel", "health"]`.

4. **`customLinks` as JSON**: Flexible array of `{label: string, url: string}` objects. Avoids a separate model for a simple key-value structure.

5. **`isFeatured` on Testimonial**: Manual pin approach (agent explicitly marks 1-2 as featured). This is better than auto-select because: (a) agent has full control over what's highlighted, (b) a 5-star review might not be the one the agent wants featured, (c) simpler to implement -- just a boolean toggle.

6. **`isVisible` on Testimonial**: Default true (auto-approved). Agent toggles to hide. This matches the "auto-approved, agent can hide/show" decision.

7. **Tenant relation on AgentProfile**: Maintains tenant isolation pattern established throughout the app.

### Recommended Project Structure

```
apps/api/src/
  badge/
    badge.module.ts
    badge.controller.ts         # Authenticated endpoints (agent manages profile)
    badge-public.controller.ts  # Unauthenticated endpoints (public view + testimonial submit)
    badge.service.ts
    dto/
      create-profile.dto.ts
      update-profile.dto.ts
      submit-testimonial.dto.ts

apps/web/src/
  app/
    (public)/                   # New route group -- NO auth layout
      agent/
        [slug]/
          page.tsx              # Public badge page
      testimonial/
        [slug]/
          page.tsx              # Public testimonial submission form
      layout.tsx                # Minimal layout, no sidebar/nav
    (dashboard)/
      settings/
        badge/
          page.tsx              # Agent badge page management (profile + testimonials)
  components/
    badge/
      badge-page-view.tsx       # Public badge page display component
      testimonial-form.tsx      # Public testimonial submission form
      testimonial-card.tsx      # Individual testimonial display
      profile-editor.tsx        # Agent profile editing form
      testimonial-manager.tsx   # Agent testimonial curation (show/hide/feature)
      cover-photo-upload.tsx    # Cover photo upload component
      star-rating.tsx           # Star rating input + display component
      strength-badges.tsx       # Strength category badge display

packages/shared/src/
  types/
    badge.ts                    # AgentProfile, Testimonial types
  validation/
    badge.schema.ts             # Zod schemas for profile + testimonial
  constants/
    badge.ts                    # Strength categories, product types, accent colors
```

### Pattern 1: Public API Endpoints (No Auth Guard)

**What:** NestJS controller endpoints that do NOT use `@UseGuards(JwtAuthGuard)`. These serve the public badge page data and accept testimonial submissions.

**When to use:** Badge page view and testimonial submission -- both are accessed by unauthenticated visitors.

**Example:**
```typescript
// badge-public.controller.ts
// Source: Established NestJS pattern - controller without UseGuards decorator

@Controller('public/badge')
export class BadgePublicController {
  constructor(private readonly badgeService: BadgeService) {}

  /**
   * GET /api/public/badge/:slug
   * Public: Fetch agent profile + visible testimonials for badge page.
   * No authentication required.
   */
  @Get(':slug')
  async getPublicProfile(@Param('slug') slug: string) {
    return this.badgeService.getPublicProfile(slug);
  }

  /**
   * POST /api/public/badge/:slug/testimonials
   * Public: Submit a testimonial for an agent.
   * No authentication required.
   */
  @Post(':slug/testimonials')
  async submitTestimonial(
    @Param('slug') slug: string,
    @Body() dto: SubmitTestimonialDto,
  ) {
    return this.badgeService.submitTestimonial(slug, dto);
  }
}
```

**Critical:** The `badge-public.controller.ts` must NOT have `@UseGuards(JwtAuthGuard)` at the class level. The authenticated `badge.controller.ts` DOES have it.

### Pattern 2: Public Next.js Route Group

**What:** A new `(public)` route group in the Next.js app that has NO authentication middleware redirect, NO dashboard layout (sidebar/nav), and its own minimal layout.

**When to use:** Badge page view at `/agent/[slug]` and testimonial form at `/testimonial/[slug]`.

**Example:**
```typescript
// apps/web/src/app/(public)/layout.tsx
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Minimal layout -- no sidebar, no auth check
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
```

**Critical middleware update required:** The middleware.ts must add `/agent` and `/testimonial` to PUBLIC_ROUTES:
```typescript
const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/verify',
  '/reset-password',
  '/update-password',
  '/accept-invite',
  '/auth/callback',
  '/agent',       // Public badge pages
  '/testimonial', // Public testimonial submission
];
```

### Pattern 3: Slug Generation and Conflict Handling

**What:** Generate URL-safe slug from agent's name, handle conflicts with numeric suffix.

**Recommendation (Claude's Discretion):**
```typescript
function generateSlug(firstName: string, lastName: string): string {
  const base = `${firstName}-${lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
  return base;
}

// In service - check for conflicts
async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (await this.prisma.agentProfile.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
```

The slug is generated once when the agent first creates their badge profile. Agent could also be allowed to edit their slug (with re-validation for uniqueness).

### Pattern 4: Image Upload for Badge Assets

**What:** Reuse the established Supabase Storage pattern from documents/receipts for cover photos and profile photos.

**Example:**
```typescript
// In badge.service.ts - follows same pattern as documents.service.ts

const BADGE_ASSETS_BUCKET = 'badge-assets';

async uploadCoverPhoto(
  tenantId: string,
  userId: string,
  file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
): Promise<string> {
  const uuid = crypto.randomUUID();
  const ext = file.originalname.split('.').pop();
  const storagePath = `${tenantId}/${userId}/cover-${uuid}.${ext}`;

  const { error } = await this.supabaseAdmin.storage
    .from(BADGE_ASSETS_BUCKET)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) throw new BadRequestException(`Upload failed: ${error.message}`);

  return storagePath;
}
```

**For the badge page (public):** Use Supabase's `getPublicUrl()` if the bucket is public, OR `createSignedUrl()` with a long expiry if the bucket is private. **Recommendation: Make `badge-assets` bucket public** since cover photos and profile photos are displayed on a public page. This avoids generating signed URLs and simplifies the public page rendering.

### Pattern 5: Notification for New Testimonial

**What:** Reuse the existing `AlertsService.create()` to send in-app notifications when a testimonial is submitted.

**Example:**
```typescript
// In badge.service.ts after creating a testimonial
await this.alertsService.create(
  agentProfile.tenantId,
  agentProfile.userId,
  {
    type: 'new_testimonial',
    title: 'New Testimonial Received',
    message: `${isAnonymous ? 'Someone' : authorName} left you a ${rating}-star testimonial.`,
    metadata: {
      testimonialId: testimonial.id,
      rating,
      agentProfileSlug: agentProfile.slug,
    },
  },
);
```

### Anti-Patterns to Avoid

- **Don't put badge page under `(dashboard)` route group:** Badge pages are public -- they must NOT be behind the dashboard layout or auth middleware.
- **Don't use `prisma.tenantClient` for public endpoints:** Public endpoints have no CLS tenant context (no JwtAuthGuard sets it). Use raw `this.prisma` with explicit where clauses including tenantId/slug.
- **Don't create a separate "public API" NestJS application:** Just use a separate controller without auth guards within the same app. The `/api/public/*` prefix makes it clear.
- **Don't store images as base64 in the database:** Use Supabase Storage for all image assets. Store only the storage path in Prisma.
- **Don't create a new notification system:** Reuse the existing `AlertsService` + `InAppNotification` model + frontend notification bell from Phase 5.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Star rating input | Custom star SVG component from scratch | Simple reusable component with lucide-react `Star` icon | Consistent with existing icon usage, accessible |
| Image upload + storage | Custom file storage solution | Supabase Storage (established pattern) | Already working in documents + receipts |
| In-app notifications | New notification system | AlertsService + InAppNotification model | Exact same pattern as budget alerts |
| Form validation | Manual validation | Zod v4 shared schemas + class-validator DTOs | Project standard |
| Slug generation | Complex NLP slug library | Simple regex-based slugify function | Name-to-slug is straightforward, no library needed |
| URL-safe slug | npm `slugify` package | 3-line regex function | Too simple to warrant a dependency |

**Key insight:** Every technical pattern needed for Phase 6 already exists in the codebase from prior phases. The only genuinely new thing is public (unauthenticated) API endpoints and Next.js pages.

## Common Pitfalls

### Pitfall 1: Middleware Blocking Public Pages
**What goes wrong:** The Next.js middleware redirects unauthenticated users to `/login` for ALL routes not in `PUBLIC_ROUTES`. If `/agent` and `/testimonial` aren't added, public badge pages will redirect to login.
**Why it happens:** Middleware was designed when all pages were authenticated.
**How to avoid:** Add `/agent` and `/testimonial` to `PUBLIC_ROUTES` in `middleware.ts` BEFORE building any public pages.
**Warning signs:** Badge page works when logged in but redirects to login when accessed in incognito.

### Pitfall 2: Using `prisma.tenantClient` in Public Endpoints
**What goes wrong:** Public endpoints have no JwtAuthGuard, so CLS `tenantId` is never set. `prisma.tenantClient` throws "Tenant context not set."
**Why it happens:** All existing services use `tenantClient` because all existing endpoints are authenticated.
**How to avoid:** Public service methods must use `this.prisma` (raw client) with explicit `where: { slug }` or `where: { id }` conditions. Never rely on CLS tenant context for public endpoints.
**Warning signs:** 500 errors on public badge page with "Tenant context not set" in logs.

### Pitfall 3: CORS Blocking Public Testimonial Submissions
**What goes wrong:** Testimonial form submissions from the public badge page may be blocked if CORS origin doesn't include the domain.
**Why it happens:** Current CORS is set to `process.env.CORS_ORIGIN || 'http://localhost:3000'`. Since the public page and the API are on the same domain (Next.js proxies to NestJS), this should work in development. But in production with separate domains, it could break.
**How to avoid:** The testimonial submission goes through the Next.js frontend (which calls the NestJS API), so CORS is between Next.js server and NestJS API -- same origin. NOT a direct browser-to-NestJS call. This is fine with the existing setup.
**Warning signs:** None expected if using the standard `api.ts` pattern or direct fetch from Next.js.

### Pitfall 4: Public Badge Page Calling Authenticated API
**What goes wrong:** The public badge page tries to use the `api.ts` helper which attaches Bearer tokens. For unauthenticated visitors, there's no token, so the request fails or gets a 401.
**Why it happens:** All existing frontend API calls use the authenticated `api.ts` wrapper.
**How to avoid:** For public pages, use plain `fetch()` directly to the NestJS public endpoints (e.g., `fetch(\`${API_BASE_URL}/api/public/badge/${slug}\`)`). Alternatively, create a `publicApi` helper that doesn't attach auth headers. Or better yet: use Next.js server components to fetch data server-side (the badge page can be a server component that fetches from the API directly).
**Warning signs:** 401 errors in browser console on public badge page.

### Pitfall 5: Supabase Storage Bucket Visibility
**What goes wrong:** Cover photos and profile photos stored in a private bucket can't be displayed on the public badge page without signed URLs, which expire.
**Why it happens:** Existing buckets (`documents`, `receipts`) are private because they contain sensitive data. Badge assets are different -- they're meant to be publicly visible.
**How to avoid:** Create the `badge-assets` bucket as **public** (`{ public: true }`). This allows direct URL access via `getPublicUrl()` without signed URLs. This is appropriate because cover photos and profile photos on a public badge page are inherently public content.
**Warning signs:** Broken images on badge page, or images that work briefly then stop (signed URL expiry).

### Pitfall 6: Slug Uniqueness Across Tenants
**What goes wrong:** Two agents at different agencies both named "John Smith" collide on slug `john-smith`.
**Why it happens:** Slugs are globally unique (for URL routing), not per-tenant.
**How to avoid:** The schema already has `slug String @unique` on AgentProfile. The slug generation must check global uniqueness and append a numeric suffix on conflict.
**Warning signs:** Prisma unique constraint violation error on profile creation.

### Pitfall 7: Featured Testimonial Count
**What goes wrong:** Agent marks more than 2 testimonials as featured, breaking the badge page layout.
**Why it happens:** No server-side limit on featured count.
**How to avoid:** When setting `isFeatured = true`, check the current count. If already 2 featured, either reject or auto-unfeature the oldest one. **Recommendation:** Auto-unfeature the oldest one (simpler UX -- no error messages).
**Warning signs:** Badge page layout looks wrong with too many featured testimonials.

## Code Examples

### Strength Categories (Claude's Discretion)

Recommended strength category options for the testimonial submission form:

```typescript
// packages/shared/src/constants/badge.ts

export const STRENGTH_CATEGORIES = [
  { value: 'responsiveness', label: 'Responsiveness' },
  { value: 'knowledge', label: 'Knowledge & Expertise' },
  { value: 'trustworthiness', label: 'Trustworthiness' },
  { value: 'communication', label: 'Communication' },
  { value: 'professionalism', label: 'Professionalism' },
  { value: 'claims_support', label: 'Claims Support' },
  { value: 'value', label: 'Value for Money' },
  { value: 'availability', label: 'Availability' },
] as const;

export type StrengthCategory = typeof STRENGTH_CATEGORIES[number]['value'];

export const INSURANCE_PRODUCTS = [
  { value: 'auto', label: 'Auto Insurance' },
  { value: 'home', label: 'Home Insurance' },
  { value: 'life', label: 'Life Insurance' },
  { value: 'health', label: 'Health & Dental' },
  { value: 'commercial', label: 'Commercial Insurance' },
  { value: 'travel', label: 'Travel Insurance' },
  { value: 'tenant', label: 'Tenant Insurance' },
  { value: 'condo', label: 'Condo Insurance' },
  { value: 'umbrella', label: 'Umbrella/Liability' },
  { value: 'disability', label: 'Disability Insurance' },
  { value: 'critical_illness', label: 'Critical Illness' },
] as const;

export const ACCENT_COLOR_PRESETS = [
  { value: '#0f172a', label: 'Navy' },
  { value: '#1e40af', label: 'Blue' },
  { value: '#0d9488', label: 'Teal' },
  { value: '#059669', label: 'Emerald' },
  { value: '#7c3aed', label: 'Purple' },
  { value: '#dc2626', label: 'Red' },
  { value: '#ea580c', label: 'Orange' },
  { value: '#000000', label: 'Black' },
] as const;

export const MAX_FEATURED_TESTIMONIALS = 2;
```

### Testimonial Submission Zod Schema

```typescript
// packages/shared/src/validation/badge.schema.ts

import { z } from 'zod';

export const submitTestimonialSchema = z.object({
  authorName: z.string().min(1, 'Name is required').max(100),
  authorEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  isAnonymous: z.boolean().default(false),
  rating: z.coerce.number().int().min(1).max(5),
  content: z.string().min(10, 'Please write at least 10 characters').max(2000),
  strengths: z.array(z.string()).min(1, 'Select at least one strength').max(5),
});

export type SubmitTestimonialInput = z.input<typeof submitTestimonialSchema>;

export const updateAgentProfileSchema = z.object({
  licenseNumber: z.string().max(50).optional().or(z.literal('')),
  bio: z.string().max(500).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
  linkedIn: z.string().url().optional().or(z.literal('')),
  twitter: z.string().url().optional().or(z.literal('')),
  facebook: z.string().url().optional().or(z.literal('')),
  instagram: z.string().url().optional().or(z.literal('')),
  whatsApp: z.string().max(20).optional().or(z.literal('')),
  productsOffered: z.array(z.string()).optional(),
  customLinks: z.array(z.object({
    label: z.string().min(1).max(50),
    url: z.string().url(),
  })).max(5).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  isPublished: z.boolean().optional(),
});

export type UpdateAgentProfileInput = z.input<typeof updateAgentProfileSchema>;
```

### Star Rating Component

```tsx
// apps/web/src/components/badge/star-rating.tsx

'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { sm: 'size-4', md: 'size-5', lg: 'size-6' };

export function StarRating({ value, onChange, readonly = false, size = 'md' }: StarRatingProps) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn(
            'transition-colors',
            readonly ? 'cursor-default' : 'cursor-pointer hover:text-yellow-400',
          )}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          <Star
            className={cn(
              sizes[size],
              star <= value
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-none text-muted-foreground/30',
            )}
          />
        </button>
      ))}
    </div>
  );
}
```

### Public Badge Page (Server Component)

```tsx
// apps/web/src/app/(public)/agent/[slug]/page.tsx

import { notFound } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Server component -- fetches data server-side, no auth needed
export default async function BadgePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // Next.js 16: React.use(params) or await in server component

  const res = await fetch(`${API_BASE_URL}/api/public/badge/${slug}`, {
    cache: 'no-store', // Always fresh
  });

  if (!res.ok) {
    notFound();
  }

  const profile = await res.json();

  return <BadgePageView profile={profile} />;
}
```

### Cover Photo Upload Constraints (Claude's Discretion)

Recommended dimensions and constraints for cover photo/banner:
- **Aspect ratio:** 3:1 (e.g., 1200x400 px recommended)
- **Max file size:** 5MB
- **Allowed types:** image/jpeg, image/png, image/webp
- **Storage:** Supabase Storage `badge-assets` bucket (public)
- **Display:** Full-width banner at top of badge page, with CSS `object-cover` for cropping

Profile photo uses the existing `avatarUrl` field on the User model. If a separate upload is needed for the badge page, store it on AgentProfile. **Recommendation:** Use the User's `avatarUrl` for the badge page photo (single source of truth). The agent's Settings > Profile page can handle avatar uploads (not yet implemented, but belongs there). For Phase 6, if the profile photo upload is needed, add it to the badge settings page and update `users.avatarUrl`.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate micro-frontend for public pages | Route groups in Next.js App Router | Next.js 13+ | Public and private pages coexist in same app |
| API-level auth middleware blocking all routes | Per-controller guard decoration in NestJS | Always been the pattern | Fine-grained control over which endpoints need auth |
| Signed URLs for all storage | Public buckets for public content | Supabase supports both | Simpler for badge page assets |

## Open Questions

1. **Avatar upload flow**
   - What we know: User model has `avatarUrl` field. Badge page needs to display agent photo.
   - What's unclear: There's no existing avatar upload mechanism (Settings > Profile is a placeholder). Should Phase 6 implement avatar upload as part of badge settings, or just display whatever is in `avatarUrl`?
   - Recommendation: Implement avatar upload within the badge profile settings page. Update `users.avatarUrl` via the existing users endpoint (add a new PATCH endpoint). This keeps the avatar as a User-level concern reusable across the app.

2. **Testimonial rate limiting**
   - What we know: The testimonial submission form is public and unauthenticated.
   - What's unclear: Should there be rate limiting to prevent spam?
   - Recommendation: For MVP, add a simple check: max 1 testimonial per email per agent per 24 hours (at the service level, not infrastructure level). This is sufficient for an MVP. If no email is provided (anonymous), skip rate limiting -- low risk at this scale.

3. **SEO metadata for badge pages**
   - What we know: Badge pages are public and could benefit from proper meta tags.
   - What's unclear: How much SEO optimization is needed for MVP?
   - Recommendation: Add basic metadata (title, description, og:image) via Next.js `generateMetadata()` using the agent's profile data. This is low effort and high value for a public page.

## Sources

### Primary (HIGH confidence)
- **Existing codebase patterns**: All code examples verified against actual project files
  - `apps/api/src/expenses/expenses.controller.ts` -- Controller + guard pattern
  - `apps/api/src/documents/documents.service.ts` -- Supabase Storage upload pattern
  - `apps/api/src/alerts/alerts.service.ts` -- In-app notification creation pattern
  - `apps/api/src/auth/guards/jwt-auth.guard.ts` -- Auth guard + CLS pattern
  - `apps/web/src/middleware.ts` -- Public routes configuration
  - `packages/database/prisma/schema.prisma` -- Full schema reference
  - `packages/shared/src/index.ts` -- Shared types/validation export pattern

### Secondary (MEDIUM confidence)
- Next.js 16 `(public)` route group pattern -- standard App Router feature, verified by existing `(auth)` and `(dashboard)` route groups in codebase
- Supabase Storage public bucket -- documented feature, consistent with existing private bucket usage

### Tertiary (LOW confidence)
- None -- all research is based on verified codebase patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- using existing stack, no new dependencies
- Architecture: HIGH -- all patterns verified in existing codebase
- Database schema: HIGH -- follows established Prisma patterns, reviewed existing models
- Pitfalls: HIGH -- identified from direct codebase analysis (middleware, CLS, storage)
- Code examples: HIGH -- derived from actual project code patterns

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (stable -- all patterns are established project conventions)

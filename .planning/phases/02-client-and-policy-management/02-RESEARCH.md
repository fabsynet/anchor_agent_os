# Phase 2: Client & Policy Management - Research

**Researched:** 2026-02-21
**Domain:** CRUD application with multi-tenant data, form-heavy UI, activity timeline, togglable list views
**Confidence:** HIGH

## Summary

Phase 2 builds the core business domain of the insurance agent operating system: client management (including leads), activity timelines with notes, and policy records linked to clients. The existing codebase from Phase 1 establishes clear patterns for NestJS modules (controller/service/module/DTO), Prisma with tenant-scoping via CLS extension, shared types in `@anchor/shared`, Zod v4 validation schemas, react-hook-form with shadcn/ui `<Form>` components, and the `api.ts` wrapper for authenticated fetch calls.

This phase requires: (1) Prisma schema additions for Client, ActivityEvent, Note, and Policy models with new enums, (2) three NestJS modules mirroring the existing invitations pattern, (3) shared Zod validation schemas and TypeScript types in `@anchor/shared`, (4) new shadcn/ui components (Tabs, Dialog, AlertDialog, Textarea, plus @tanstack/react-table for data tables), and (5) frontend pages under `(dashboard)/clients/` and `(dashboard)/policies/`.

**Primary recommendation:** Follow the exact patterns established in Phase 1 -- NestJS module with class-validator DTOs, Prisma tenantClient for all queries, shared types in `@anchor/shared`, and react-hook-form + Zod + shadcn Form components on the frontend. Add @tanstack/react-table for the togglable table views. Keep all activity events as immutable database records.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Toggle between table rows and cards grid on the clients list page (user can switch)
- Blended key fields: name, phone, status (Lead/Client), policy count, next renewal date
- Search bar plus filter dropdowns (status, policy type, etc.)
- Client detail/profile page uses tabbed sections: Overview, Policies, Timeline/Notes, Documents (future)
- Lead requires minimal data: just name + email or phone
- Client requires full contact details: name, email, phone, address, DOB, etc.
- Conversion: auto-convert to Client when first policy is added, AND manual "Convert to Client" button available
- Reversal allowed: can set a Client back to Lead if relationship didn't work out
- Separate tabs on the clients list: "Clients" tab and "Leads" tab
- Everything tracked: client created, status changed, policy added/updated/expired, note added, email sent, task created/completed, document uploaded, invitation sent
- Notes are plain text only -- quick to add, easy to scan
- Everything immutable: auto-logged events are permanent, notes cannot be deleted (corrections can be added)
- Default view is compact list (icon + description + timestamp), with option to switch to expanded cards
- Policy types: standard Canadian set (Auto, Home, Life, Health, Commercial, Travel, Umbrella) PLUS custom/other with free text
- Detailed status lifecycle: Draft -> Active -> Pending Renewal -> Renewed/Expired/Cancelled
- Display on client profile: summary cards by default (type icon, carrier, premium, expiry, status badge) with toggle to table rows
- Full detail fields: type, carrier, policy number, start/end date, premium, status, coverage amount, deductible, payment frequency, broker commission, notes
- User prefers toggle-able views (table/cards) on both client list and policy list -- consistent pattern
- Compact-by-default with expand option is a recurring preference (timeline, policy display)
- Immutable timeline serves as compliance audit trail for insurance regulators
- Canadian insurance context: types, carriers, and terminology should reflect Canadian market

### Claude's Discretion
- Exact card/table component styling and spacing
- Filter dropdown options and behavior
- Tab ordering and icons on profile page
- Timeline event icon design
- Policy type icons
- Form validation UX (inline vs summary)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

The established libraries/tools for this phase, building on Phase 1:

### Core (Already Installed)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| Prisma | 6.19+ | ORM for Client, Policy, ActivityEvent, Note models | Already in `@anchor/database` |
| NestJS | 11.x | Backend modules: ClientsModule, PoliciesModule, TimelineModule | Already in `apps/api` |
| class-validator + class-transformer | 0.14.3 / 0.5.1 | DTO validation for all endpoints | Already installed |
| react-hook-form | 7.71.1 | Form state management | Already installed |
| @hookform/resolvers | 5.2.2 | Zod resolver for forms | Already installed |
| Zod | 4.3.6 | Validation schemas in `@anchor/shared` | Already installed |
| shadcn/ui (new-york style) | Latest | UI components | Already configured |
| lucide-react | 0.563+ | Icons | Already installed |
| sonner | 2.0.7+ | Toast notifications | Already installed |

### New Dependencies Required
| Library | Version | Purpose | Why Needed |
|---------|---------|---------|------------|
| @tanstack/react-table | 8.x | Headless table with sorting, filtering, pagination | Data tables for client list and policy list (user wants togglable table/card views) |
| date-fns | 4.x | Date formatting and calculations | Policy date display, renewal date calculations, timeline timestamps |

### shadcn/ui Components to Add
| Component | CLI Command | Purpose |
|-----------|-------------|---------|
| Tabs | `npx shadcn@latest add tabs` | Client list tabs (Clients/Leads), profile page tabs |
| Dialog | `npx shadcn@latest add dialog` | Create/edit client and policy forms |
| AlertDialog | `npx shadcn@latest add alert-dialog` | Delete confirmation dialogs |
| Textarea | `npx shadcn@latest add textarea` | Notes input, policy notes field |
| Pagination | `npx shadcn@latest add pagination` | Table pagination controls |
| ScrollArea | `npx shadcn@latest add scroll-area` | Timeline scroll in client profile |

**Note:** Table, Card, Badge, Button, Input, Select, Form, Label already exist from Phase 1.

**Installation:**
```bash
# From monorepo root
pnpm --filter web add @tanstack/react-table date-fns
pnpm --filter api add date-fns

# shadcn/ui components (run from apps/web/)
cd apps/web
npx shadcn@latest add tabs dialog alert-dialog textarea pagination scroll-area
```

## Architecture Patterns

### Recommended Project Structure

```
packages/database/prisma/
  schema.prisma              # Add Client, Policy, ActivityEvent, Note models + enums

packages/shared/src/
  types/
    client.ts                # ClientStatus, Client, ClientListItem types
    policy.ts                # PolicyType, PolicyStatus, Policy types
    activity.ts              # ActivityEventType, ActivityEvent, Note types
  validation/
    client.schema.ts         # createClientSchema, updateClientSchema
    policy.schema.ts         # createPolicySchema, updatePolicySchema
    note.schema.ts           # createNoteSchema
  constants/
    insurance.ts             # POLICY_TYPES, POLICY_STATUSES, CANADIAN_PROVINCES, CARRIERS
  index.ts                   # Re-export all new types

apps/api/src/
  clients/
    clients.module.ts
    clients.controller.ts    # CRUD + search + convert status
    clients.service.ts       # Business logic, auto-convert on policy add
    dto/
      create-client.dto.ts
      update-client.dto.ts
      search-clients.dto.ts  # Query params for search/filter
  policies/
    policies.module.ts
    policies.controller.ts   # CRUD, nested under clients
    policies.service.ts      # Business logic, status transitions
    dto/
      create-policy.dto.ts
      update-policy.dto.ts
  timeline/
    timeline.module.ts
    timeline.controller.ts   # GET timeline, POST notes
    timeline.service.ts      # Create activity events, list timeline
    dto/
      create-note.dto.ts

apps/web/src/app/(dashboard)/
  clients/
    page.tsx                 # Client list with Leads/Clients tabs + table/card toggle
    [id]/
      page.tsx               # Client profile with tabbed sections
      edit/
        page.tsx             # Edit client form (or use dialog)
    new/
      page.tsx               # Create client form (or use dialog)

apps/web/src/components/
  clients/
    client-list.tsx          # Main list with search + filters
    client-table.tsx         # Table view using @tanstack/react-table
    client-cards.tsx         # Card grid view
    client-form.tsx          # Create/edit form (shared between new + edit)
    client-profile-header.tsx
    client-overview-tab.tsx
    client-policies-tab.tsx
    client-timeline-tab.tsx
  policies/
    policy-cards.tsx         # Summary card display
    policy-table.tsx         # Table view
    policy-form.tsx          # Create/edit policy form (dialog)
    policy-status-badge.tsx  # Status badge with colors
  timeline/
    timeline-list.tsx        # Compact timeline view
    timeline-expanded.tsx    # Expanded card view
    note-form.tsx            # Add note form
    activity-icon.tsx        # Icon for each event type
```

### Pattern 1: NestJS Module with Tenant-Scoped Prisma

**What:** Follow the exact pattern from InvitationsModule for all new modules.
**When to use:** Every new NestJS module in this phase.

```typescript
// clients.controller.ts - follows invitations.controller.ts pattern
@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  async create(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateClientDto,
  ) {
    return this.clientsService.create(tenantId, user.id, dto);
  }

  @Get()
  async findAll(
    @TenantId() tenantId: string,
    @Query() query: SearchClientsDto,
  ) {
    return this.clientsService.findAll(tenantId, query);
  }

  @Get(':id')
  async findOne(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.clientsService.findOne(tenantId, id);
  }

  @Patch(':id')
  async update(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  async remove(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.clientsService.remove(tenantId, id);
  }
}
```

**Key:** Use `this.prisma.tenantClient` (not raw `this.prisma`) for all queries to ensure tenant isolation. The `tenantClient` extension auto-injects `tenantId` into where clauses and create data.

### Pattern 2: Shared Types + Zod Schemas in @anchor/shared

**What:** Define all types and validation schemas in the shared package, use them in both frontend and backend.
**When to use:** Every new entity type.

```typescript
// packages/shared/src/types/client.ts
export type ClientStatus = 'lead' | 'client';

export interface Client {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  dateOfBirth: string | null; // ISO date string
  status: ClientStatus;
  notes: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

// packages/shared/src/validation/client.schema.ts
import { z } from 'zod';

export const createClientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  status: z.enum(['lead', 'client']).default('lead'),
  // Full fields required only for 'client' status (enforced via .refine or backend)
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  province: z.string().optional().or(z.literal('')),
  postalCode: z.string().optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
}).refine(
  (data) => {
    if (data.status === 'lead') {
      // Lead: name + (email OR phone) required
      return !!(data.email || data.phone);
    }
    return true; // Client validation handled separately or all required
  },
  { message: 'Lead requires at least email or phone', path: ['email'] }
);
```

### Pattern 3: Toggle-able Views (Table vs Cards)

**What:** A consistent component pattern for switching between table and card views.
**When to use:** Client list page, policy list on profile page.

```typescript
// Reusable view toggle pattern
'use client';
import { useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ViewMode = 'table' | 'cards';

function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-md border p-1">
      <Button
        variant={mode === 'table' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onChange('table')}
      >
        <List className="size-4" />
      </Button>
      <Button
        variant={mode === 'cards' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onChange('cards')}
      >
        <LayoutGrid className="size-4" />
      </Button>
    </div>
  );
}
```

### Pattern 4: Activity Timeline (Immutable Event Log)

**What:** All significant actions create immutable ActivityEvent records. Notes are a separate model also immutable.
**When to use:** Any create/update/delete/status-change operation.

```typescript
// In the service, after any mutation, create an activity event:
async createActivityEvent(
  tenantId: string,
  clientId: string,
  userId: string,
  type: ActivityEventType,
  description: string,
  metadata?: Record<string, unknown>,
) {
  return this.prisma.activityEvent.create({
    data: {
      tenantId,
      clientId,
      userId,
      type,
      description,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}
```

### Anti-Patterns to Avoid

- **Using `this.prisma` instead of `this.prisma.tenantClient`:** Bypasses tenant isolation. Only use raw `this.prisma` for cross-tenant admin operations (there are none in this phase).
- **Defining types in frontend only:** ALL types must go in `@anchor/shared` to prevent drift between frontend and backend. The MEMORY.md notes this has caused build failures before.
- **Using `string` instead of shared union types:** Always use `ClientStatus`, `PolicyType`, `PolicyStatus` from `@anchor/shared` when typing API responses in the frontend. Using `string` will cause silent type mismatches.
- **Mutable timeline:** Events and notes must never be deletable or editable. This is a compliance requirement for insurance regulators.
- **Direct DB queries from frontend:** All data access goes through the NestJS API via `api.ts`. Never query Supabase tables directly from the frontend (lesson from Phase 1).
- **findUnique with tenantClient:** The tenant extension does NOT override `findUnique` (see `prisma-tenant.extension.ts`). Use `findFirst` with the ID instead, or validate `tenantId` after fetching.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Data tables with sorting/filtering/pagination | Custom table sorting logic | @tanstack/react-table + shadcn Table | Column definitions, sorting state, pagination math are all handled |
| Date formatting | Manual date string manipulation | date-fns `format()`, `formatDistanceToNow()` | Handles locales, edge cases, relative time |
| Form validation | Manual field checking | Zod schema + react-hook-form + zodResolver | Type inference, consistent error messages, reusable across frontend/backend |
| UUID validation in controllers | Manual regex checking | NestJS `ParseUUIDPipe` | Already used in invitations, handles validation and error response |
| Delete confirmation | Custom modal logic | shadcn AlertDialog | Accessible, focus-trapped, keyboard navigable |
| Toast notifications | Custom notification system | sonner (already installed) | Already used in Phase 1, consistent UX |
| Multi-tenant query scoping | Manual `where: { tenantId }` | `this.prisma.tenantClient` | Auto-injects tenantId via CLS context |

## Common Pitfalls

### Pitfall 1: Prisma Enum Migration in PostgreSQL
**What goes wrong:** Adding new enum values can fail with "ALTER TYPE ... ADD cannot run inside a transaction block" on older PostgreSQL versions.
**Why it happens:** PostgreSQL wraps migrations in transactions by default, and `ALTER TYPE ... ADD VALUE` cannot run inside a transaction on PG <12.
**How to avoid:** Supabase uses PG 15, so this should work fine. However, if adding a new enum value AND using it as a default in the same migration, Prisma may generate SQL that fails because new values must be committed before they can be referenced. Test locally with `prisma migrate dev` and inspect the generated SQL. If needed, split into two migrations.
**Warning signs:** Migration fails with "New enum values must be committed before they can be used."

### Pitfall 2: tenantClient and findUnique
**What goes wrong:** Using `findUnique` with the tenant-scoped client silently skips tenant filtering.
**Why it happens:** The `prisma-tenant.extension.ts` explicitly does NOT override `findUnique` because its where clause only accepts unique fields. If a model's unique field is `id`, you cannot add `tenantId` to the where clause.
**How to avoid:** Always use `findFirst` with both `id` and `tenantId` in the where clause, or use `findUnique` on raw `this.prisma` and validate `tenantId` matches afterward.
**Warning signs:** Data leaking between tenants on single-record lookups.

### Pitfall 3: Frontend Type Mismatches with API Responses
**What goes wrong:** TypeScript allows `api.get<SomeType>()` without runtime validation. If the actual API response has different field names or types (e.g., `role: "admin"` string vs `role: UserRole` union), builds pass but behavior is wrong.
**Why it happens:** `api.get<T>()` does type assertion, not runtime validation.
**How to avoid:** Always use the exact shared types from `@anchor/shared` for API response typing. Import `ClientStatus`, `PolicyType`, etc. -- never use `string`. Run `pnpm build` after any API integration to catch type mismatches early.
**Warning signs:** Badge displays "undefined", filters don't match, comparisons fail silently.

### Pitfall 4: Auto-Convert Lead to Client Race Condition
**What goes wrong:** When adding a policy to a lead, the auto-convert to client status and the policy creation could conflict if not done atomically.
**Why it happens:** Two separate Prisma operations (update client status + create policy) without a transaction.
**How to avoid:** Use `this.prisma.$transaction()` to wrap the policy creation and client status update together. Create the activity events for both actions within the same transaction.
**Warning signs:** Client stuck in "lead" status despite having policies, or policy created but status not updated.

### Pitfall 5: Policy Status Transition Validation
**What goes wrong:** Invalid status transitions (e.g., Cancelled -> Active) are allowed.
**Why it happens:** No server-side validation of status transitions.
**How to avoid:** Define a state machine in the PolicyService that validates transitions:
- Draft -> Active
- Active -> Pending Renewal, Cancelled, Expired
- Pending Renewal -> Renewed, Expired, Cancelled
- Renewed -> Active (becomes new active period)
- Expired/Cancelled are terminal (no transitions out)

### Pitfall 6: Missing `/api` Prefix on Frontend API Calls
**What goes wrong:** 404 errors when calling the NestJS API.
**Why it happens:** NestJS has `app.setGlobalPrefix('api')` in main.ts. All endpoints are `/api/clients`, not `/clients`.
**How to avoid:** Always include `/api/` prefix in `api.get()`, `api.post()`, etc. calls. This is documented in ISS-001 from Phase 1.
**Warning signs:** 404 responses from API calls.

## Code Examples

### Prisma Schema Additions

```prisma
// packages/database/prisma/schema.prisma - additions

enum ClientStatus {
  lead
  client
  @@map("client_status")
}

enum PolicyType {
  auto
  home
  life
  health
  commercial
  travel
  umbrella
  other
  @@map("policy_type")
}

enum PolicyStatus {
  draft
  active
  pending_renewal
  renewed
  expired
  cancelled
  @@map("policy_status")
}

enum PaymentFrequency {
  monthly
  quarterly
  semi_annual
  annual
  @@map("payment_frequency")
}

enum ActivityEventType {
  client_created
  client_updated
  client_status_changed
  note_added
  policy_created
  policy_updated
  policy_status_changed
  policy_deleted
  // Future event types (tasks, documents, emails) added in later phases
  @@map("activity_event_type")
}

model Client {
  id          String       @id @default(uuid()) @db.Uuid
  tenantId    String       @map("tenant_id") @db.Uuid
  firstName   String       @map("first_name")
  lastName    String       @map("last_name")
  email       String?
  phone       String?
  address     String?
  city        String?
  province    String?
  postalCode  String?      @map("postal_code")
  dateOfBirth DateTime?    @map("date_of_birth") @db.Date
  status      ClientStatus @default(lead)
  createdById String       @map("created_by_id") @db.Uuid
  createdAt   DateTime     @default(now()) @map("created_at")
  updatedAt   DateTime     @updatedAt @map("updated_at")

  tenant          Tenant          @relation(fields: [tenantId], references: [id])
  createdBy       User            @relation("clientCreatedBy", fields: [createdById], references: [id])
  policies        Policy[]
  activityEvents  ActivityEvent[]
  notes           Note[]

  @@index([tenantId])
  @@index([tenantId, status])
  @@index([tenantId, lastName, firstName])
  @@map("clients")
}

model Policy {
  id               String           @id @default(uuid()) @db.Uuid
  tenantId         String           @map("tenant_id") @db.Uuid
  clientId         String           @map("client_id") @db.Uuid
  type             PolicyType
  customType       String?          @map("custom_type") // for "other" type
  carrier          String?
  policyNumber     String?          @map("policy_number")
  startDate        DateTime?        @map("start_date") @db.Date
  endDate          DateTime?        @map("end_date") @db.Date
  premium          Decimal?         @db.Decimal(12, 2)
  coverageAmount   Decimal?         @map("coverage_amount") @db.Decimal(12, 2)
  deductible       Decimal?         @db.Decimal(12, 2)
  paymentFrequency PaymentFrequency? @map("payment_frequency")
  brokerCommission Decimal?         @map("broker_commission") @db.Decimal(5, 2) // percentage
  status           PolicyStatus     @default(draft)
  notes            String?
  createdById      String           @map("created_by_id") @db.Uuid
  createdAt        DateTime         @default(now()) @map("created_at")
  updatedAt        DateTime         @updatedAt @map("updated_at")

  tenant    Tenant @relation(fields: [tenantId], references: [id])
  client    Client @relation(fields: [clientId], references: [id], onDelete: Cascade)
  createdBy User   @relation("policyCreatedBy", fields: [createdById], references: [id])

  @@index([tenantId])
  @@index([clientId])
  @@index([tenantId, status])
  @@map("policies")
}

model ActivityEvent {
  id          String            @id @default(uuid()) @db.Uuid
  tenantId    String            @map("tenant_id") @db.Uuid
  clientId    String            @map("client_id") @db.Uuid
  userId      String            @map("user_id") @db.Uuid
  type        ActivityEventType
  description String
  metadata    Json?             // Stores old/new values for changes
  createdAt   DateTime          @default(now()) @map("created_at")

  tenant Tenant @relation(fields: [tenantId], references: [id])
  client Client @relation(fields: [clientId], references: [id], onDelete: Cascade)
  user   User   @relation("activityEventUser", fields: [userId], references: [id])

  @@index([clientId, createdAt(sort: Desc)])
  @@index([tenantId])
  @@map("activity_events")
}

model Note {
  id        String   @id @default(uuid()) @db.Uuid
  tenantId  String   @map("tenant_id") @db.Uuid
  clientId  String   @map("client_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  content   String
  createdAt DateTime @default(now()) @map("created_at")

  tenant Tenant @relation(fields: [tenantId], references: [id])
  client Client @relation(fields: [clientId], references: [id], onDelete: Cascade)
  user   User   @relation("noteUser", fields: [userId], references: [id])

  @@index([clientId, createdAt(sort: Desc)])
  @@index([tenantId])
  @@map("notes")
}
```

**IMPORTANT:** The existing User and Tenant models need new relation fields added:
```prisma
// Add to User model:
  clientsCreated    Client[]        @relation("clientCreatedBy")
  policiesCreated   Policy[]        @relation("policyCreatedBy")
  activityEvents    ActivityEvent[] @relation("activityEventUser")
  notesMade         Note[]          @relation("noteUser")

// Add to Tenant model:
  clients         Client[]
  policies        Policy[]
  activityEvents  ActivityEvent[]
  notes           Note[]
```

### NestJS DTO with class-validator

```typescript
// apps/api/src/clients/dto/create-client.dto.ts
import {
  IsString, IsEmail, IsOptional, IsEnum, IsDateString,
  MinLength, ValidateIf,
} from 'class-validator';

export class CreateClientDto {
  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEnum(['lead', 'client'])
  status!: 'lead' | 'client';

  // Fields required for 'client' status
  @ValidateIf((o) => o.status === 'client')
  @IsString()
  address?: string;

  @ValidateIf((o) => o.status === 'client')
  @IsString()
  city?: string;

  @ValidateIf((o) => o.status === 'client')
  @IsString()
  province?: string;

  @ValidateIf((o) => o.status === 'client')
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}
```

### Canadian Insurance Constants

```typescript
// packages/shared/src/constants/insurance.ts

export const POLICY_TYPES = [
  { value: 'auto', label: 'Auto', icon: 'Car' },
  { value: 'home', label: 'Home', icon: 'Home' },
  { value: 'life', label: 'Life', icon: 'Heart' },
  { value: 'health', label: 'Health', icon: 'Activity' },
  { value: 'commercial', label: 'Commercial', icon: 'Building2' },
  { value: 'travel', label: 'Travel', icon: 'Plane' },
  { value: 'umbrella', label: 'Umbrella', icon: 'Umbrella' },
  { value: 'other', label: 'Other', icon: 'FileText' },
] as const;

export const POLICY_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'secondary' },
  { value: 'active', label: 'Active', color: 'default' },
  { value: 'pending_renewal', label: 'Pending Renewal', color: 'warning' },
  { value: 'renewed', label: 'Renewed', color: 'default' },
  { value: 'expired', label: 'Expired', color: 'destructive' },
  { value: 'cancelled', label: 'Cancelled', color: 'destructive' },
] as const;

export const CANADIAN_PROVINCES = [
  { value: 'AB', label: 'Alberta' },
  { value: 'BC', label: 'British Columbia' },
  { value: 'MB', label: 'Manitoba' },
  { value: 'NB', label: 'New Brunswick' },
  { value: 'NL', label: 'Newfoundland and Labrador' },
  { value: 'NS', label: 'Nova Scotia' },
  { value: 'NT', label: 'Northwest Territories' },
  { value: 'NU', label: 'Nunavut' },
  { value: 'ON', label: 'Ontario' },
  { value: 'PE', label: 'Prince Edward Island' },
  { value: 'QC', label: 'Quebec' },
  { value: 'SK', label: 'Saskatchewan' },
  { value: 'YT', label: 'Yukon' },
] as const;

// Common Canadian insurance carriers for autocomplete/suggestions
export const COMMON_CARRIERS = [
  'Intact Insurance',
  'Aviva Canada',
  'Desjardins Insurance',
  'The Co-operators',
  'Wawanesa Insurance',
  'Economical Insurance',
  'RSA Canada',
  'Travelers Canada',
  'Zurich Canada',
  'Sun Life',
  'Manulife',
  'Canada Life',
  'Industrial Alliance (iA)',
  'Empire Life',
  'Equitable Life',
  'TD Insurance',
  'RBC Insurance',
  'BMO Insurance',
  'Scotia Life Insurance',
] as const;

export const PAYMENT_FREQUENCIES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semi_annual', label: 'Semi-Annual' },
  { value: 'annual', label: 'Annual' },
] as const;
```

### Frontend Data Table with @tanstack/react-table

```typescript
// Example column definitions for client table
import { ColumnDef } from '@tanstack/react-table';
import type { ClientListItem } from '@anchor/shared';

export const clientColumns: ColumnDef<ClientListItem>[] = [
  {
    accessorKey: 'lastName',
    header: 'Name',
    cell: ({ row }) => {
      const { firstName, lastName } = row.original;
      return `${firstName} ${lastName}`;
    },
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.status === 'client' ? 'default' : 'secondary'}>
        {row.original.status === 'client' ? 'Client' : 'Lead'}
      </Badge>
    ),
  },
  {
    accessorKey: 'policyCount',
    header: 'Policies',
  },
  {
    accessorKey: 'nextRenewalDate',
    header: 'Next Renewal',
    cell: ({ row }) => {
      const date = row.original.nextRenewalDate;
      return date ? format(new Date(date), 'MMM d, yyyy') : '--';
    },
  },
];
```

### API Endpoint Design

```
# Client endpoints
GET    /api/clients?status=lead|client&search=term&page=1&limit=20
POST   /api/clients
GET    /api/clients/:id
PATCH  /api/clients/:id
DELETE /api/clients/:id
PATCH  /api/clients/:id/convert     # Convert lead <-> client

# Policy endpoints (nested under clients)
GET    /api/clients/:clientId/policies
POST   /api/clients/:clientId/policies
GET    /api/clients/:clientId/policies/:id
PATCH  /api/clients/:clientId/policies/:id
DELETE /api/clients/:clientId/policies/:id

# Timeline endpoints (nested under clients)
GET    /api/clients/:clientId/timeline?page=1&limit=50
POST   /api/clients/:clientId/notes
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual table sorting/filtering | @tanstack/react-table headless | Standard since 2023 | Column definitions + hooks handle all logic |
| Zod v3 `z.string().optional()` | Zod v4 same API | 2025 | Compatible, but use `@hookform/resolvers@5.2.2` |
| class-validator standalone | class-validator + class-transformer with NestJS pipes | Stable pattern | `whitelist: true` + `transform: true` already configured in main.ts |
| Direct Supabase DB queries | All through Prisma via NestJS | Changed in Phase 1 auth rewrite | Never use Supabase REST API for DB access |

**Deprecated/outdated:**
- shadcn/ui `toast` component: Deprecated in favor of `sonner` (already using sonner)
- `passport-jwt` for auth: Replaced with direct Supabase `auth.getUser()` in Phase 1

## Open Questions

1. **Decimal handling in Prisma + frontend**
   - What we know: Prisma `Decimal` fields serialize to strings in JSON responses, not numbers. The frontend needs to handle this.
   - What's unclear: Whether to convert to numbers on the API side (loses precision) or handle string-to-number on the frontend.
   - Recommendation: Keep as strings in API responses, parse to numbers on the frontend display layer. Use `parseFloat()` only for display, not for calculations. Document this in the shared types as `premium: string` (serialized Decimal).

2. **Pagination strategy (offset vs cursor)**
   - What we know: Offset-based pagination is simpler and works well for <10K records. Cursor-based is needed for infinite scroll or very large datasets.
   - What's unclear: Expected client/policy volume per agency.
   - Recommendation: Use offset-based pagination (page + limit) since insurance agencies typically have hundreds to low thousands of clients. This aligns with @tanstack/react-table's built-in pagination. Use `skip` + `take` in Prisma.

3. **Search implementation**
   - What we know: Prisma supports `contains` for simple text search, and PostgreSQL has full-text search via `@@` operator.
   - What's unclear: Whether simple `contains` is sufficient or if full-text search is needed.
   - Recommendation: Start with Prisma `contains` (case-insensitive via `mode: 'insensitive'`) on name, email, and phone. This is sufficient for the expected data volume. Full-text search can be added later if needed.

## Sources

### Primary (HIGH confidence)
- Existing codebase analysis: `packages/database/prisma/schema.prisma`, `apps/api/src/invitations/`, `apps/web/src/components/` -- established patterns
- Existing `packages/shared/src/` -- type and validation schema patterns
- `apps/api/src/common/prisma/prisma-tenant.extension.ts` -- tenant scoping mechanism
- `apps/web/src/lib/api.ts` -- API call wrapper pattern
- `.planning/ISSUES.md` -- documented pitfalls from Phase 1
- MEMORY.md -- accumulated learnings about auth, types, and env setup

### Secondary (MEDIUM confidence)
- [shadcn/ui Tabs](https://ui.shadcn.com/docs/components/radix/tabs) -- component API
- [shadcn/ui Dialog](https://ui.shadcn.com/docs/components/radix/dialog) -- component API
- [shadcn/ui Data Table](https://ui.shadcn.com/docs/components/radix/data-table) -- TanStack Table integration
- [Prisma Migrate docs](https://www.prisma.io/docs/orm/prisma-migrate/getting-started) -- migration workflow
- [NestJS Validation docs](https://docs.nestjs.com/techniques/validation) -- DTO validation patterns
- [TanStack Table docs](https://tanstack.com/table/latest/docs/overview) -- column definitions, sorting, pagination

### Tertiary (LOW confidence)
- [Canadian insurance carriers 2026](https://www.policyadvisor.com/insurance-companies/biggest-insurance-companies-canada/) -- carrier list may be incomplete
- WebSearch results for Zod v4 + RHF compatibility -- confirmed `@hookform/resolvers@5.2.2` needed

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- using exclusively the libraries already installed in Phase 1 plus @tanstack/react-table (recommended in STACK.md)
- Architecture: HIGH -- following exact patterns from existing Phase 1 modules
- Prisma schema: HIGH -- straightforward relational model, enums well-supported in PG 15
- Pitfalls: HIGH -- most are documented from Phase 1 experience in MEMORY.md and ISSUES.md
- Canadian insurance context: MEDIUM -- carrier list from web search, may need user validation

**Research date:** 2026-02-21
**Valid until:** 2026-03-21 (stable domain, no fast-moving dependencies)

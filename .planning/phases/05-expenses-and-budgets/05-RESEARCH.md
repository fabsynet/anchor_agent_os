# Phase 5: Expenses & Budgets - Research

**Researched:** 2026-02-22
**Domain:** Financial tracking (expense CRUD, budgets, approval workflow, cron, charting)
**Confidence:** HIGH

## Summary

Phase 5 adds expense tracking with receipt uploads, category budgets with auto-renewal, an approval workflow, 80% threshold alerts, recurring expense automation, and a dashboard financial widget. The codebase already has all required patterns established: Supabase Storage uploads (Phase 4), cron scheduling (Phase 3 renewals), role-based guards, dashboard widgets (three-state pattern), and the tenant extension for multi-tenant isolation.

The primary technical challenges are: (1) designing a Prisma schema that supports approval workflow, recurring expenses, and budget tracking with proper Decimal handling; (2) implementing two cron jobs (recurring expense creation, budget auto-renewal/threshold checking); (3) building an in-app notification system (no Notification model exists yet -- must be created); and (4) integrating a donut chart via Recharts for the dashboard financial widget.

**Primary recommendation:** Follow existing codebase patterns exactly -- NestJS module structure, Prisma tenant extension, Supabase Storage for receipts, `@Cron` decorator for scheduled jobs, and shadcn/ui Card-based dashboard widgets. Add Recharts for the donut chart. Create an in-app Notification model for budget alerts.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Preset categories for insurance agencies + ability to add custom categories
- Everyone can submit expenses, but admin must approve before they count toward budgets (approval workflow)
- Simple recurring expenses supported -- mark as recurring (weekly/monthly/yearly) and auto-create on schedule
- No client or policy linkage on expenses -- expenses stand alone
- Currency is CAD (per success criteria)
- File picker + drag-and-drop zone on the expense form
- Multiple receipts per expense (e.g., itemized receipt + credit card statement)
- Inline preview -- thumbnail/lightbox for images, browser viewer for PDFs
- Accepted file types: JPEG, PNG, WebP, and PDF
- Reuse Phase 4 Supabase Storage patterns for receipt uploads
- Two-level budget structure: overall monthly budget AND optional per-category limits
- Budgets are admin-only (create, modify, delete). Team members can view but not change.
- 80% threshold alerts delivered in-app only (banner/toast), no email
- Auto-retirement at month end with auto-creation of next month's budget (same limits carry forward)
- Combined widget: budget progress bars per category AND expense summary numbers (total spent, expense count, top category)
- Current month only -- no comparison to previous months
- Donut/pie chart for category breakdown alongside numbers and progress bars
- Admin-only by default, with ability for admin to grant select team members view access
- Follows existing dashboard widget patterns (three-state: loading/empty/data)

### Claude's Discretion
- Preset expense category list (pick sensible defaults for insurance agencies)
- Approval workflow UX (inline approve/reject or separate queue)
- Recurring expense cron schedule and edge cases
- In-app alert presentation (toast, banner, or badge)
- Donut chart library choice
- How "grant team member view access" is implemented (simple flag vs settings UI)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | ^6.19.2 | ORM, schema, Decimal fields | Already used for all DB access |
| @nestjs/schedule | ^6.1.1 | Cron jobs for recurring expenses + budget renewal | Already in use for renewals/notifications |
| Supabase Storage | via @supabase/supabase-js ^2.95 | Receipt file storage | Phase 4 pattern established |
| date-fns | ^4.1.0 | Date manipulation for month boundaries | Already used throughout |
| Zod | ^4.3.6 | Schema validation | Already used for all form schemas |
| react-hook-form + @hookform/resolvers | ^7.71.1 / ^5.2.2 | Form state management | Already used for all forms |
| sonner | ^2.0.7 | Toast notifications | Already used for all toasts |

### New Dependencies Required
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| recharts | ^3.7.0 | Donut chart for financial widget | Dashboard financial widget pie/donut chart |

**Note on Recharts and React 19:** Recharts 3.7.0 supports React 19. The project uses React 19.2.3. If peer dependency warnings occur, add `react-is` to overrides. Alternatively, Recharts 2.15.x is known stable with React 19 and may be safer. **Recommendation:** Install `recharts@^2.15.0` to match what shadcn/ui charts are built against (they are still on v2 pattern), avoiding potential v3 breaking changes.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts | Chart.js / react-chartjs-2 | Recharts is the shadcn/ui standard; Chart.js is heavier |
| Recharts | Victory | Victory is less maintained; Recharts has better shadcn integration |
| Recharts | Nivo | More complex API; Recharts matches existing shadcn patterns |
| Custom SVG donut | Recharts PieChart | Custom SVG would avoid dependency but harder to maintain |

**Installation:**
```bash
pnpm --filter web add recharts
```

## Architecture Patterns

### Recommended Project Structure (New Files)

```
packages/shared/src/
  types/expense.ts              # Expense, ExpenseCategory, ExpenseStatus types
  types/budget.ts               # Budget, BudgetCategory, BudgetAlert types
  types/notification.ts         # InAppNotification type
  validation/expense.schema.ts  # createExpenseSchema, updateExpenseSchema, etc.
  validation/budget.schema.ts   # createBudgetSchema, updateBudgetSchema
  constants/expenses.ts         # EXPENSE_CATEGORIES, EXPENSE_STATUSES, RECURRENCE types

apps/api/src/
  expenses/
    expenses.module.ts
    expenses.controller.ts
    expenses.service.ts
    expenses.scheduler.ts       # Recurring expense cron
    dto/
      create-expense.dto.ts
      update-expense.dto.ts
  budgets/
    budgets.module.ts
    budgets.controller.ts
    budgets.service.ts
    budgets.scheduler.ts        # Budget auto-renewal + 80% threshold cron
    dto/
      create-budget.dto.ts
      update-budget.dto.ts
  alerts/                       # In-app notification system
    alerts.module.ts
    alerts.controller.ts
    alerts.service.ts

apps/web/src/
  app/(dashboard)/expenses/
    page.tsx                    # Replace placeholder
  components/expenses/
    expense-list.tsx
    expense-form-dialog.tsx
    expense-receipt-upload.tsx   # Reuses DocumentUploadZone pattern
    expense-receipt-preview.tsx
    expense-approval-queue.tsx   # Admin approval view
    expense-category-badge.tsx
  components/budgets/
    budget-list.tsx
    budget-form-dialog.tsx
    budget-progress-bar.tsx
  components/dashboard/
    financial-widget.tsx         # Combined budget + expense widget
    expense-donut-chart.tsx      # Recharts donut
```

### Pattern 1: Prisma Schema Design

**What:** New models for Expense, ExpenseReceipt, Budget, BudgetCategory, InAppNotification
**When to use:** Data foundation plan

```prisma
// New enums
enum ExpenseStatus {
  draft
  pending_approval
  approved
  rejected
  @@map("expense_status")
}

enum RecurrenceFrequency {
  weekly
  monthly
  yearly
  @@map("recurrence_frequency")
}

// New models
model Expense {
  id            String          @id @default(uuid()) @db.Uuid
  tenantId      String          @map("tenant_id") @db.Uuid
  amount        Decimal         @db.Decimal(12, 2)
  currency      String          @default("CAD") @db.VarChar(3)
  category      String          // Preset or custom category name
  description   String?
  date          DateTime        @db.Date
  status        ExpenseStatus   @default(draft)
  submittedById String          @map("submitted_by_id") @db.Uuid
  approvedById  String?         @map("approved_by_id") @db.Uuid
  approvedAt    DateTime?       @map("approved_at")
  rejectionNote String?         @map("rejection_note")
  isRecurring   Boolean         @default(false) @map("is_recurring")
  recurrence    RecurrenceFrequency?
  nextOccurrence DateTime?      @map("next_occurrence") @db.Date
  parentExpenseId String?       @map("parent_expense_id") @db.Uuid
  createdAt     DateTime        @default(now()) @map("created_at")
  updatedAt     DateTime        @updatedAt @map("updated_at")

  tenant      Tenant          @relation(fields: [tenantId], references: [id])
  submittedBy User            @relation("expenseSubmittedBy", fields: [submittedById], references: [id])
  approvedBy  User?           @relation("expenseApprovedBy", fields: [approvedById], references: [id])
  parentExpense Expense?      @relation("recurringExpenses", fields: [parentExpenseId], references: [id])
  childExpenses Expense[]     @relation("recurringExpenses")
  receipts    ExpenseReceipt[]

  @@index([tenantId])
  @@index([tenantId, status])
  @@index([tenantId, date])
  @@index([tenantId, category])
  @@index([tenantId, isRecurring, nextOccurrence])
  @@map("expenses")
}

model ExpenseReceipt {
  id          String   @id @default(uuid()) @db.Uuid
  expenseId   String   @map("expense_id") @db.Uuid
  tenantId    String   @map("tenant_id") @db.Uuid
  fileName    String   @map("file_name")
  mimeType    String   @map("mime_type")
  fileSize    Int      @map("file_size")
  storagePath String   @map("storage_path")
  createdAt   DateTime @default(now()) @map("created_at")

  expense Expense @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  tenant  Tenant  @relation(fields: [tenantId], references: [id])

  @@index([expenseId])
  @@index([tenantId])
  @@map("expense_receipts")
}

model Budget {
  id          String   @id @default(uuid()) @db.Uuid
  tenantId    String   @map("tenant_id") @db.Uuid
  month       Int      // 1-12
  year        Int
  totalLimit  Decimal  @map("total_limit") @db.Decimal(12, 2)
  isActive    Boolean  @default(true) @map("is_active")
  createdById String   @map("created_by_id") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  tenant      Tenant            @relation(fields: [tenantId], references: [id])
  createdBy   User              @relation("budgetCreatedBy", fields: [createdById], references: [id])
  categories  BudgetCategory[]

  @@unique([tenantId, month, year])
  @@index([tenantId])
  @@index([tenantId, isActive])
  @@map("budgets")
}

model BudgetCategory {
  id         String  @id @default(uuid()) @db.Uuid
  budgetId   String  @map("budget_id") @db.Uuid
  category   String  // Must match expense category names
  limitAmount Decimal @map("limit_amount") @db.Decimal(12, 2)

  budget Budget @relation(fields: [budgetId], references: [id], onDelete: Cascade)

  @@unique([budgetId, category])
  @@index([budgetId])
  @@map("budget_categories")
}

model InAppNotification {
  id        String   @id @default(uuid()) @db.Uuid
  tenantId  String   @map("tenant_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  type      String   // 'budget_warning', 'expense_approved', 'expense_rejected', etc.
  title     String
  message   String
  metadata  Json?
  isRead    Boolean  @default(false) @map("is_read")
  createdAt DateTime @default(now()) @map("created_at")

  tenant Tenant @relation(fields: [tenantId], references: [id])
  user   User   @relation(fields: [userId], references: [id])

  @@index([tenantId, userId, isRead])
  @@index([userId, createdAt(sort: Desc)])
  @@map("in_app_notifications")
}
```

**Critical Prisma notes:**
- Decimal(12,2) matches existing Policy.premium pattern
- `category` is a plain String (not enum) to support custom categories
- Budget uses `@@unique([tenantId, month, year])` for one budget per tenant per month
- `ExpenseReceipt` is separate from `Document` model -- receipts are expense-specific, not client-linked
- `InAppNotification` is new -- no existing notification model exists in the schema
- Must add relations to Tenant and User models (expenses, budgets, receipts, notifications)

### Pattern 2: Receipt Upload (Reuse Phase 4 Pattern)

**What:** Supabase Storage upload for receipt files, following the Document upload pattern exactly
**When to use:** Expense CRUD plan

```typescript
// Storage path pattern for receipts (different bucket or subfolder)
const RECEIPTS_BUCKET = 'receipts'; // OR reuse 'documents' bucket with receipts/ prefix
const storagePath = `${tenantId}/expenses/${expenseId}/${uuid}-${file.originalname}`;

// Upload pattern (from DocumentsService)
const { error: uploadError } = await this.supabaseAdmin.storage
  .from(RECEIPTS_BUCKET)
  .upload(storagePath, file.buffer, { contentType: file.mimetype });
```

**Key decision: Separate `receipts` bucket vs reuse `documents` bucket.**
Recommendation: Use a separate `receipts` bucket. Receipts are tenant-level (not client-linked), so the storage path structure differs. Using the same bucket with a `receipts/` prefix would also work but mixing concerns.

### Pattern 3: Approval Workflow

**What:** Expense status transitions: draft -> pending_approval -> approved/rejected
**When to use:** Expense service

```typescript
// Expense status flow:
// 1. User creates expense -> status: 'draft' (can still edit)
// 2. User submits for approval -> status: 'pending_approval'
// 3. Admin approves -> status: 'approved', sets approvedById + approvedAt
// 4. Admin rejects -> status: 'rejected', sets rejectionNote
// 5. User can edit rejected expense and resubmit

// Only 'approved' expenses count toward budget calculations
```

**UX Recommendation (Claude's Discretion):** Inline approve/reject on the expense list rather than a separate queue. Admin sees a filterable expense list with status tabs. Pending expenses show inline "Approve" and "Reject" buttons. On reject, a small modal/popover prompts for a note. This is simpler and matches the existing list-pattern UI. A separate "pending approvals" badge on the expenses page header shows the count.

### Pattern 4: Recurring Expense Automation

**What:** Cron job that auto-creates expenses based on recurrence schedule
**When to use:** Expenses scheduler

```typescript
// Cron: daily at 2 AM Toronto time (after renewals at 1 AM, before digest at 8 AM)
@Cron('0 0 2 * * *', {
  name: 'create-recurring-expenses',
  timeZone: 'America/Toronto',
})
async handleRecurringExpenses() {
  // 1. Find all recurring expenses where nextOccurrence <= today
  // 2. For each, create a new child expense (status: 'draft' -- requires approval)
  // 3. Advance nextOccurrence based on recurrence (weekly/monthly/yearly)
  // 4. Use raw this.prisma (no CLS context in cron)
}
```

**Edge cases:**
- Monthly recurrence on Jan 31 -> Feb should become Feb 28 (use date-fns `addMonths` which handles this)
- If cron misses a day, next run catches up (nextOccurrence is compared with `<=` today)
- Child expenses are independent -- can be edited before approval
- Stopping recurrence: set `isRecurring = false` on parent expense

### Pattern 5: Budget Auto-Renewal Cron

**What:** Monthly cron that retires expired budgets and creates new ones
**When to use:** Budgets scheduler

```typescript
// Cron: 1st of every month at midnight Toronto time
@Cron('0 0 0 1 * *', {
  name: 'auto-renew-budgets',
  timeZone: 'America/Toronto',
})
async handleBudgetAutoRenewal() {
  // 1. Find all active budgets for the PREVIOUS month
  // 2. Set isActive = false (retire)
  // 3. Check if budget for CURRENT month already exists
  // 4. If not, create new budget with same totalLimit and same category limits
  // 5. Use raw this.prisma (no CLS context)
}
```

### Pattern 6: 80% Threshold Alert

**What:** Check budget consumption after each expense approval, trigger in-app notification
**When to use:** Budget service, called from expense approval

```typescript
// Triggered whenever an expense is approved (not via cron -- real-time check)
async checkBudgetThreshold(tenantId: string, category: string, month: number, year: number) {
  // 1. Get budget for tenantId + month + year
  // 2. Sum approved expenses for that category in that month
  // 3. If sum >= 80% of category limit (or overall limit), create InAppNotification
  // 4. Idempotent: check if alert already sent for this budget+category+threshold
}
```

**Alert delivery (Claude's Discretion):** Use a persistent in-app notification model + a notification bell icon in the top nav. When a budget threshold is reached, create an InAppNotification record. Frontend polls `/api/alerts/unread` periodically (or on page navigation). Display count badge on bell icon. Clicking opens a dropdown with recent alerts. Additionally, show a dismissible banner on the expenses page when a budget is near/over limit.

### Pattern 7: Dashboard Financial Widget

**What:** Combined card with donut chart, progress bars, and summary numbers
**When to use:** Dashboard integration

```typescript
// API endpoint: GET /api/dashboard/financial
// Returns:
{
  totalSpent: number;       // Sum of approved expenses this month
  expenseCount: number;     // Count of approved expenses this month
  topCategory: string;      // Category with highest spend
  budgetTotal: number;      // Overall monthly budget limit
  budgetUsed: number;       // Percentage of overall budget used
  categories: {
    name: string;
    spent: number;
    limit: number | null;   // null if no per-category limit
    percentage: number;
  }[];
}
```

### Pattern 8: Admin View Access Control for Widget

**What:** Admin can grant individual team members access to financial widget
**When to use:** Settings or inline toggle

**Recommendation (Claude's Discretion):** Add a `canViewFinancials` boolean field on the User model. Default `false` for agents, always `true` for admins. Admin can toggle this per user on the /settings/team page (or inline on a simple management list). The dashboard financial widget endpoint checks this flag. This is simpler than a full settings UI and follows the existing pattern of user-level flags (like `digestOptOut`).

```prisma
// Add to User model:
canViewFinancials Boolean @default(false) @map("can_view_financials")
```

### Anti-Patterns to Avoid
- **Using Supabase REST API for expense queries:** Use Prisma for ALL database access (established decision)
- **Storing amounts as float/integer cents:** Use Prisma `Decimal(12,2)` and string serialization (established pattern from Policy.premium)
- **Putting budget calculations in the frontend:** All budget-vs-spend calculations happen on the backend; frontend only displays results
- **Making cron jobs use tenantClient:** Cron jobs have no CLS context; use raw `this.prisma` with manual tenantId (established pattern from renewals)
- **Sharing the Document model for receipts:** Receipts are not client-linked documents; use a separate ExpenseReceipt model
- **Using enum for categories:** Categories must support custom values; use String type with preset constants

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Donut chart | Custom SVG/Canvas | Recharts PieChart with innerRadius | Well-tested, accessible, responsive |
| Date month boundaries | Manual date math | date-fns `startOfMonth`/`endOfMonth`/`addMonths` | Already used, handles DST/leap year |
| File drag-and-drop | Custom drag listeners | Existing `DocumentUploadZone` pattern | Already validated in Phase 4 |
| Progress bars | Custom div widths | shadcn/ui Progress component (Radix) | Accessible, themed, animated |
| Currency formatting | Manual string formatting | `Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' })` | Already used in premium-income.tsx |
| Cron scheduling | setInterval/setTimeout | `@nestjs/schedule` `@Cron` decorator | Already configured, timezone-aware |
| Toast notifications | Custom alert system | sonner `toast()` | Already used throughout app |

**Key insight:** Almost every infrastructure pattern needed already exists in the codebase from Phases 1-4. The primary new work is the data models, business logic, and UI components.

## Common Pitfalls

### Pitfall 1: Decimal Serialization Mismatch
**What goes wrong:** Prisma serializes `Decimal` fields as strings in JSON responses. Frontend receives `"150.00"` (string) but expects `150` (number).
**Why it happens:** Prisma Decimal -> string serialization is automatic and non-obvious.
**How to avoid:** In shared types, type amount fields as `string`. Use `parseFloat()` only for display/math on frontend. This matches the existing pattern for `Policy.premium`.
**Warning signs:** NaN values in budget calculations or chart data.

### Pitfall 2: Tenant Extension Limitations
**What goes wrong:** `count()`, `aggregate()`, `$transaction()`, and `groupBy()` are NOT overridden by the tenant extension.
**Why it happens:** The extension only overrides `findMany`, `findFirst`, `create`, `update`, `delete`.
**How to avoid:** For any aggregation query (budget spending totals, expense counts), use raw `this.prisma` with manual `tenantId` in the where clause. Document this in every service method.
**Warning signs:** Queries returning data from other tenants or TypeScript errors on tenantClient.aggregate().

### Pitfall 3: Cron Context
**What goes wrong:** Cron services injecting `PrismaService.tenantClient` crash because CLS has no tenantId.
**Why it happens:** Cron jobs run outside HTTP request context -- no CLS middleware runs.
**How to avoid:** All cron methods use raw `this.prisma` (not `tenantClient`). Query all tenants, iterate with manual tenantId. Already established in `RenewalsService`.
**Warning signs:** "Tenant context not set" errors in logs at cron execution times.

### Pitfall 4: Receipt Storage Path Collision
**What goes wrong:** Two receipts uploaded with the same filename overwrite each other in Supabase Storage.
**Why it happens:** Supabase Storage is flat (no automatic deduplication).
**How to avoid:** Prefix every upload with `crypto.randomUUID()`, like the existing document upload pattern: `${tenantId}/expenses/${expenseId}/${uuid}-${file.originalname}`.
**Warning signs:** Missing receipt files, wrong receipts displaying.

### Pitfall 5: Budget Month/Year Uniqueness Race Condition
**What goes wrong:** Two simultaneous requests could create duplicate budgets for the same month/year.
**Why it happens:** Check-then-create without database-level constraint.
**How to avoid:** `@@unique([tenantId, month, year])` constraint on Budget model. Use `upsert` or catch unique constraint violation.
**Warning signs:** Duplicate budget entries, incorrect spending calculations.

### Pitfall 6: Recharts + React 19 Compatibility
**What goes wrong:** Recharts may have peer dependency warnings or rendering issues with React 19.
**Why it happens:** Recharts v3 is relatively new; v2 had explicit React 19 issues in earlier releases.
**How to avoid:** Use Recharts `^2.15.0` (stable React 19 support confirmed) unless v3 works cleanly. Test chart rendering before merging.
**Warning signs:** Blank chart area, console errors about `react-is`, SSR hydration mismatches.

### Pitfall 7: Approval Status in Budget Calculations
**What goes wrong:** Draft or pending expenses being counted toward budget, inflating spend numbers.
**Why it happens:** Forgetting to filter by `status: 'approved'` in aggregate queries.
**How to avoid:** Every budget calculation query MUST include `status: 'approved'` in the where clause. Document this as an invariant.
**Warning signs:** Budget alerts triggering prematurely, spend totals not matching approved expenses.

## Code Examples

### Expense Category Constants (Claude's Discretion -- Insurance Agency Defaults)
```typescript
// Source: Research on insurance agency operating expenses
export const EXPENSE_CATEGORIES = [
  { value: 'office_rent', label: 'Office Rent & Lease' },
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'technology', label: 'Technology & Software' },
  { value: 'marketing', label: 'Marketing & Advertising' },
  { value: 'licensing', label: 'Licensing & Regulatory Fees' },
  { value: 'eo_insurance', label: 'E&O Insurance' },
  { value: 'travel', label: 'Travel & Mileage' },
  { value: 'professional_development', label: 'Professional Development' },
  { value: 'salaries', label: 'Salaries & Commissions' },
  { value: 'client_entertainment', label: 'Client Entertainment' },
  { value: 'telephone', label: 'Telephone & Internet' },
  { value: 'postage', label: 'Postage & Shipping' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'other', label: 'Other' },
] as const;

// Custom categories stored as plain strings in the DB
// The UI will show presets + a "Custom" option with text input
```

### Currency Formatting (Existing Pattern)
```typescript
// Source: apps/web/src/components/dashboard/premium-income.tsx
const currencyFormatter = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return currencyFormatter.format(num);
}
```

### Recharts Donut Chart Pattern
```typescript
// Source: shadcn/ui charts documentation + Recharts docs
import { PieChart, Pie, Cell, Label, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

interface CategorySpend {
  name: string;
  value: number;
}

function ExpenseDonutChart({ data, total }: { data: CategorySpend[]; total: number }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
          ))}
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan x={viewBox.cx} y={viewBox.cy} className="text-2xl font-bold fill-foreground">
                      {formatCurrency(total)}
                    </tspan>
                    <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 20} className="text-xs fill-muted-foreground">
                      Total Spent
                    </tspan>
                  </text>
                );
              }
            }}
          />
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

### Budget Progress Bar Pattern
```typescript
// Radix Progress component (needs to be created as a shadcn/ui component)
// Source: shadcn/ui Progress component pattern
import * as ProgressPrimitive from '@radix-ui/react-progress';

function BudgetProgressBar({ category, spent, limit }: {
  category: string;
  spent: number;
  limit: number;
}) {
  const percentage = Math.min((spent / limit) * 100, 100);
  const isWarning = percentage >= 80;
  const isOver = percentage >= 100;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{category}</span>
        <span className="text-muted-foreground">
          {formatCurrency(spent)} / {formatCurrency(limit)}
        </span>
      </div>
      <ProgressPrimitive.Root className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full transition-all",
            isOver ? "bg-red-500" : isWarning ? "bg-yellow-500" : "bg-primary"
          )}
          style={{ width: `${percentage}%` }}
        />
      </ProgressPrimitive.Root>
    </div>
  );
}
```

### Cron Scheduler Pattern (Existing)
```typescript
// Source: apps/api/src/renewals/renewals.scheduler.ts
@Injectable()
export class ExpensesScheduler {
  private readonly logger = new Logger(ExpensesScheduler.name);

  constructor(private readonly expensesService: ExpensesService) {}

  // Daily at 2 AM Toronto time
  @Cron('0 0 2 * * *', {
    name: 'create-recurring-expenses',
    timeZone: 'America/Toronto',
  })
  async handleRecurringExpenses() {
    this.logger.log('Starting recurring expense creation...');
    try {
      await this.expensesService.createRecurringExpensesForAllTenants();
      this.logger.log('Recurring expense creation complete.');
    } catch (error) {
      this.logger.error('Recurring expense creation failed', error);
    }
  }
}
```

### Receipt Upload Reuse Pattern
```typescript
// Source: apps/api/src/documents/documents.service.ts (adapted for receipts)
async uploadReceipts(
  tenantId: string,
  expenseId: string,
  files: Express.Multer.File[],
) {
  const receipts = [];
  for (const file of files) {
    const uuid = crypto.randomUUID();
    const storagePath = `${tenantId}/expenses/${expenseId}/${uuid}-${file.originalname}`;

    const { error } = await this.supabaseAdmin.storage
      .from('receipts')
      .upload(storagePath, file.buffer, { contentType: file.mimetype });

    if (error) throw new BadRequestException(`Upload failed: ${error.message}`);

    const receipt = await this.prisma.tenantClient.expenseReceipt.create({
      data: {
        expenseId,
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        storagePath,
      } as any,
    });
    receipts.push(receipt);
  }
  return receipts;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Email-only budget alerts | In-app notifications + optional email | User decision | Need InAppNotification model |
| Single budget per month | Two-level: overall + per-category | User decision | More complex schema, richer UI |
| Admin-only expenses | Everyone submits, admin approves | User decision | Approval workflow needed |
| Manual monthly budget setup | Auto-renewal with carry-forward | User decision | Budget cron job needed |

**Deprecated/outdated:**
- Success criteria says "optional client linkage" but user explicitly decided NO client/policy linkage on expenses
- Requirement NOTF-03 says email alerts but user explicitly decided in-app only (no email)
- Requirement EXPN-06 says "invited users cannot access expense features" but user decided everyone can submit expenses

## Recommendations (Claude's Discretion Areas)

### 1. Preset Expense Categories
**Recommendation:** 14 categories (listed in Code Examples above) covering standard insurance agency operating expenses. Plus "Other" as catch-all. Custom categories stored as plain strings, with UI allowing freeform entry.
**Confidence:** MEDIUM -- based on insurance agency expense research.

### 2. Approval Workflow UX
**Recommendation:** Inline approve/reject on the expense list with status tabs (All / Pending / Approved / Rejected). Admin sees "Approve" and "Reject" buttons inline. Reject opens a small popover for notes. A badge on the Expenses nav shows pending count for admin.
**Confidence:** HIGH -- matches existing list/filter patterns in the codebase.

### 3. Recurring Expense Cron Schedule
**Recommendation:** Daily at 2 AM Toronto time. Check `nextOccurrence <= today`. Use date-fns `addWeeks`, `addMonths`, `addYears` to advance nextOccurrence. Auto-created expenses start as `draft` (not auto-approved).
**Confidence:** HIGH -- follows existing renewals cron pattern exactly.

### 4. In-App Alert Presentation
**Recommendation:** Three-pronged approach:
  1. **Notification bell** in top nav with unread count badge -- shows recent alerts in dropdown
  2. **Dismissible banner** on expenses page when a budget is >=80% consumed
  3. **Sonner toast** shown once per session on dashboard load when budget threshold is exceeded
**Confidence:** HIGH -- uses existing UI patterns (badge, banner, sonner toast).

### 5. Donut Chart Library
**Recommendation:** Recharts `^2.15.0` (stable React 19 support). Use `PieChart` with `innerRadius` prop for donut effect. shadcn/ui charts are built on Recharts, so styling integrates naturally.
**Confidence:** HIGH -- Recharts is the standard for shadcn/ui charts.

### 6. Team Member View Access
**Recommendation:** Add `canViewFinancials` boolean on User model (default false for agents). Admin toggles this per user via a simple checkbox on /settings/team page. Dashboard financial widget only renders if `profile.role === 'admin' || profile.canViewFinancials`. No separate settings page needed.
**Confidence:** HIGH -- follows existing `digestOptOut` flag pattern.

## Open Questions

1. **Bucket name for receipts**
   - What we know: Phase 4 uses 'documents' bucket for client documents
   - What's unclear: Should receipts use a separate 'receipts' bucket or the same 'documents' bucket?
   - Recommendation: Use separate 'receipts' bucket for clean separation. Receipts are tenant-level, not client-linked.

2. **Receipt upload timing**
   - What we know: User wants multiple receipts per expense
   - What's unclear: Can receipts be uploaded during expense creation (before save), or only after the expense is created?
   - Recommendation: Upload receipts as part of expense creation (single form submit). Multer handles multipart with both form fields and files. Alternatively, create expense first, then add receipts in a second step (simpler implementation).

3. **Custom category management**
   - What we know: User wants preset categories + custom categories
   - What's unclear: Should custom categories be stored in a separate table (reusable across expenses) or just as freeform strings per expense?
   - Recommendation: Store as plain strings on each expense. Add a `SELECT DISTINCT category FROM expenses WHERE tenant_id = ?` query for the category dropdown to show previously-used custom categories. No separate ExpenseCategory table needed for MVP.

4. **Recharts version**
   - What we know: Recharts 3.7.0 is latest, 2.15.x is stable with React 19
   - What's unclear: Does v3.7.0 work cleanly with React 19.2.3 in this project?
   - Recommendation: Start with `^2.15.0`. If issues, well-documented. Upgrade to v3 later if needed.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: Prisma schema, DocumentsService, DashboardService, RenewalsScheduler, tenant extension
- Existing patterns: Receipt upload (Phase 4), cron scheduling (Phase 3), dashboard widgets, role guards
- shadcn/ui charts documentation: Built on Recharts, PieChart with innerRadius for donut

### Secondary (MEDIUM confidence)
- [shadcn/ui Pie Charts](https://ui.shadcn.com/charts/pie) -- donut chart patterns with Recharts
- [shadcn/ui Chart Component](https://ui.shadcn.com/docs/components/radix/chart) -- installation guide
- [NestJS Task Scheduling](https://docs.nestjs.com/techniques/task-scheduling) -- @Cron decorator patterns
- [Prisma Aggregation Docs](https://www.prisma.io/docs/orm/prisma-client/queries/aggregation-grouping-summarizing) -- aggregate/groupBy limitations
- [recharts npm](https://www.npmjs.com/package/recharts) -- version 3.7.0 / 2.15.x compatibility

### Tertiary (LOW confidence)
- Insurance agency expense categories -- compiled from multiple web sources, not industry-standard list
- Recharts 3.x + React 19 exact compatibility -- needs runtime verification in this project

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in use except Recharts (well-documented addition)
- Architecture: HIGH -- follows all established codebase patterns exactly
- Pitfalls: HIGH -- documented from actual codebase analysis and past project issues (MEMORY.md)
- Schema design: HIGH -- follows existing Prisma conventions (Decimal, UUID, tenant relations, index patterns)
- Recharts compatibility: MEDIUM -- version 2.15.x is verified, v3 needs testing

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (30 days -- stable domain, established patterns)

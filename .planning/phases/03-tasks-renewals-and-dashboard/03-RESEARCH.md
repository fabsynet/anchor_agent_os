# Phase 3: Tasks, Renewals & Dashboard - Research

**Researched:** 2026-02-21
**Domain:** Task management, scheduling/cron, kanban UI, email notifications, dashboard widgets
**Confidence:** HIGH

## Summary

Phase 3 adds four major capabilities to the Anchor MVP: a task system (CRUD with client/policy linking), a renewal engine (auto-generating tasks from policy expiration dates via cron), a Today Dashboard (summary cards, renewals, overdue tasks, recent activity, premium income), and daily digest email notifications (via Resend + React Email).

The existing codebase provides strong patterns to follow: NestJS modules with tenant-scoped Prisma queries, `@tanstack/react-table` for list views, `ViewToggle` for table/card switching, shadcn/ui components (manually created), and Resend already installed as a dependency. The new additions required are `@nestjs/schedule` for cron jobs, `@dnd-kit/core` + `@dnd-kit/sortable` for kanban drag-and-drop, and new Prisma models for Task.

**Primary recommendation:** Follow existing codebase patterns exactly. Tasks module mirrors the Clients/Policies module structure. Renewal engine uses `@nestjs/schedule` cron jobs that query across all tenants. Dashboard is a server-less client page with multiple parallel API calls. Email uses Resend SDK directly with `@react-email/components` for templates (both already installed).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Four task statuses: To Do, In Progress, Waiting, Done (unrestricted transitions)
- Four priority levels: Low, Medium, High, Urgent
- Task display: list view (sortable/filterable table) + kanban board with toggle
- Manual task fields: Title, description, due date, priority, status, assignee, linked client (optional), linked policy (optional)
- Renewal automation: 3 tasks per policy at 60/30/7 days before expiration, escalating priority (Medium/High/Urgent)
- Auto-generated tasks: dismissible only (mark done or dismiss, cannot edit content/dates)
- Policy expiration date change: delete all pending renewal tasks and regenerate
- Policy cancelled/deleted: auto-delete all pending renewal tasks
- Dashboard layout: 4 summary cards (Overdue Tasks, Due Today, Renewals in 30 Days, Active Clients) + quick actions bar + 3 detail sections (Upcoming Renewals, Overdue Tasks, Recent Activity) + Premium Income section
- Quick actions: Add Client, Add Task, Add Policy, Add Expense (expense routes to future Phase 5 placeholder)
- Email: single combined daily digest (renewals + overdue) at 8 AM local time, per-user opt-out, uses Resend
- Premium income: calculated from existing policy premium amounts (no new data entry)

### Claude's Discretion
- Kanban card design and information density
- Exact dashboard responsive layout (grid breakpoints, stacking on mobile)
- Loading states and empty states for dashboard widgets
- Email template design and copy
- Cron job scheduling approach for renewal task generation and digest sending
- Recent activity feed: which events to include and how many to show
- Trend calculation method for premium income (simple % change vs sparkline)

### Deferred Ideas (OUT OF SCOPE)
- Expense summary widget on dashboard (YTD + current month) -- add when Phase 5 builds expense tracking (DASH-03)
- Configurable digest send time per user -- keep 8 AM fixed for MVP, make configurable later
- Task recurrence / repeating tasks -- not in current scope
</user_constraints>

## Standard Stack

### Core (New Dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@nestjs/schedule` | ^6.1.1 | Cron job scheduling for renewal generation + digest emails | Official NestJS module, uses `cron` package under the hood, provides `@Cron` decorator and `CronExpression` enum |
| `@dnd-kit/core` | ^6.3.1 | Drag-and-drop engine for kanban board | Most popular React DnD library, lightweight (10KB), accessible, framework-agnostic engine |
| `@dnd-kit/sortable` | ^10.0.0 | Sortable preset for reordering tasks within/between kanban columns | Thin layer over @dnd-kit/core for list reordering |
| `@dnd-kit/utilities` | ^3.2.2 | CSS transform utilities for drag-and-drop | Helper for smooth visual transforms during drag |

### Already Installed (No New Install Needed)

| Library | Location | Purpose |
|---------|----------|---------|
| `resend` | ^6.9.1 in apps/api | Email delivery SDK -- installed but not yet used directly |
| `@react-email/components` | ^1.0.7 in apps/api | React components for email templates -- installed but not yet used |
| `@tanstack/react-table` | ^8.21.3 in apps/web | Table rendering for task list view (same pattern as client-table.tsx) |
| `date-fns` | ^4.1.0 in both apps | Date formatting and calculations (differenceInDays, addDays, subDays, format) |
| `lucide-react` | ^0.563.0 in apps/web | Icons for task statuses, priorities, dashboard cards |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @dnd-kit/core | @dnd-kit/react (v0.3.2) | @dnd-kit/react is a newer rewrite with native React 19 support, but still at v0.3.x (pre-stable). Use proven @dnd-kit/core for MVP stability |
| @dnd-kit/core | react-beautiful-dnd | Deprecated by Atlassian. Not maintained. |
| @nestjs/schedule | bull/bullmq | Overkill for MVP. Bull needs Redis. @nestjs/schedule is in-process, sufficient for single-instance deployment |
| Resend + React Email | Nodemailer | Resend is already installed, has better DX, React Email components already in deps |

### Installation

```bash
# API (backend) -- cron scheduling
pnpm --filter api add @nestjs/schedule

# Web (frontend) -- kanban drag-and-drop
pnpm --filter web add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Note:** `resend` and `@react-email/components` are already in `apps/api/package.json`. No need to install.

## Architecture Patterns

### Prisma Schema Extension (Task Model)

New enums and model to add to `packages/database/prisma/schema.prisma`:

```prisma
enum TaskStatus {
  todo
  in_progress
  waiting
  done

  @@map("task_status")
}

enum TaskPriority {
  low
  medium
  high
  urgent

  @@map("task_priority")
}

enum TaskType {
  manual
  renewal

  @@map("task_type")
}

model Task {
  id          String       @id @default(uuid()) @db.Uuid
  tenantId    String       @map("tenant_id") @db.Uuid
  title       String
  description String?
  status      TaskStatus   @default(todo)
  priority    TaskPriority @default(medium)
  type        TaskType     @default(manual)
  dueDate     DateTime?    @map("due_date") @db.Date
  assigneeId  String?      @map("assignee_id") @db.Uuid
  clientId    String?      @map("client_id") @db.Uuid
  policyId    String?      @map("policy_id") @db.Uuid
  createdById String       @map("created_by_id") @db.Uuid

  // Renewal-specific: days-before-expiry marker (60, 30, 7)
  renewalDaysBefore Int?   @map("renewal_days_before")

  createdAt   DateTime     @default(now()) @map("created_at")
  updatedAt   DateTime     @updatedAt @map("updated_at")

  tenant    Tenant  @relation(fields: [tenantId], references: [id])
  assignee  User?   @relation("taskAssignee", fields: [assigneeId], references: [id])
  client    Client? @relation(fields: [clientId], references: [id], onDelete: Cascade)
  policy    Policy? @relation(fields: [policyId], references: [id], onDelete: Cascade)
  createdBy User    @relation("taskCreatedBy", fields: [createdById], references: [id])

  @@index([tenantId])
  @@index([tenantId, status])
  @@index([tenantId, dueDate])
  @@index([policyId, type, status])
  @@map("tasks")
}
```

**Critical considerations:**
- `policyId` with `onDelete: Cascade` ensures policy deletion auto-deletes renewal tasks (satisfies "no orphans" requirement)
- `renewalDaysBefore` distinguishes which renewal milestone a task represents (60, 30, or 7)
- `type` enum (`manual` vs `renewal`) satisfies TASK-06 (auto-generated tasks distinguishable from manual)
- Must add `tasks Task[]` relations to `Tenant`, `User` (two relations: assignee + createdBy), `Client`, and `Policy` models
- Must add `Task` to the tenant extension's `$allModels` scope (it auto-applies to all models, so no change needed in `prisma-tenant.extension.ts`)
- The tenant extension already uses `$allModels` so `Task` will automatically be tenant-scoped

### Recommended Backend Structure

```
apps/api/src/
  tasks/
    tasks.module.ts          # TasksModule
    tasks.controller.ts      # CRUD endpoints
    tasks.service.ts         # Business logic
    dto/
      create-task.dto.ts
      update-task.dto.ts
      search-tasks.dto.ts
  renewals/
    renewals.module.ts       # RenewalsModule
    renewals.service.ts      # Renewal task generation logic
    renewals.scheduler.ts    # @Cron decorated scheduler service
  dashboard/
    dashboard.module.ts      # DashboardModule
    dashboard.controller.ts  # Dashboard data endpoints
    dashboard.service.ts     # Aggregation queries
  notifications/
    notifications.module.ts  # NotificationsModule
    notifications.service.ts # Email sending logic
    notifications.scheduler.ts # @Cron for daily digest
    emails/
      daily-digest.tsx       # React Email template component
```

### Recommended Frontend Structure

```
apps/web/src/
  app/(dashboard)/
    tasks/
      page.tsx              # Tasks list/kanban page
    page.tsx                # Today Dashboard (replace placeholder)
  components/
    tasks/
      task-list.tsx         # Container (list + kanban toggle)
      task-table.tsx        # Table view with @tanstack/react-table
      task-kanban.tsx       # Kanban board with @dnd-kit
      task-card.tsx         # Card component (used in kanban + card view)
      task-form.tsx         # Create/edit form (dialog)
      view-toggle.tsx       # Reuse existing or extend for 3 modes
    dashboard/
      summary-cards.tsx     # 4 stat cards
      quick-actions.tsx     # Action button bar
      renewals-widget.tsx   # Upcoming renewals table
      overdue-widget.tsx    # Overdue tasks list
      activity-feed.tsx     # Recent activity feed
      premium-income.tsx    # Premium income section
```

### Pattern 1: NestJS Module with Cron Scheduling

**What:** Add `ScheduleModule.forRoot()` to AppModule, create scheduler services with `@Cron` decorators.
**When to use:** Renewal task generation and daily digest email sending.

```typescript
// apps/api/src/app.module.ts - Add ScheduleModule
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    // ... existing imports
    ScheduleModule.forRoot(),
    TasksModule,
    RenewalsModule,
    DashboardModule,
    NotificationsModule,
  ],
})
export class AppModule {}

// apps/api/src/renewals/renewals.scheduler.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RenewalsService } from './renewals.service.js';

@Injectable()
export class RenewalsScheduler {
  private readonly logger = new Logger(RenewalsScheduler.name);

  constructor(private readonly renewalsService: RenewalsService) {}

  // Run every day at 1:00 AM to generate renewal tasks
  @Cron('0 0 1 * * *', { name: 'generate-renewal-tasks' })
  async handleRenewalGeneration() {
    this.logger.log('Starting daily renewal task generation...');
    await this.renewalsService.generateRenewalTasksForAllTenants();
    this.logger.log('Renewal task generation complete.');
  }
}
```

### Pattern 2: Cross-Tenant Cron Job (Bypass Tenant Extension)

**What:** Cron jobs run without HTTP request context, so CLS (tenant context) is not set. Must use raw PrismaService, not `tenantClient`.
**When to use:** All cron jobs that process data across tenants.

```typescript
// apps/api/src/renewals/renewals.service.ts
@Injectable()
export class RenewalsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateRenewalTasksForAllTenants() {
    // Use raw prisma (NOT tenantClient) since no HTTP context
    const policies = await this.prisma.policy.findMany({
      where: {
        endDate: { not: null },
        status: { in: ['active', 'pending_renewal'] },
      },
      include: { tenant: true },
    });

    for (const policy of policies) {
      await this.generateTasksForPolicy(policy);
    }
  }

  private async generateTasksForPolicy(policy: PolicyWithTenant) {
    const milestones = [
      { daysBefore: 60, priority: 'medium' as const },
      { daysBefore: 30, priority: 'high' as const },
      { daysBefore: 7, priority: 'urgent' as const },
    ];

    for (const milestone of milestones) {
      const targetDate = subDays(policy.endDate, milestone.daysBefore);
      // Only generate if target date is today or in the future
      // AND task doesn't already exist for this policy+milestone
      const existing = await this.prisma.task.findFirst({
        where: {
          policyId: policy.id,
          type: 'renewal',
          renewalDaysBefore: milestone.daysBefore,
          status: { not: 'done' },
        },
      });
      if (!existing && isAfter(targetDate, subDays(new Date(), 1))) {
        await this.prisma.task.create({
          data: {
            tenantId: policy.tenantId,
            title: `Renewal: ${milestone.daysBefore}-day reminder`,
            description: `Policy expires on ${format(policy.endDate, 'MMM d, yyyy')}`,
            type: 'renewal',
            priority: milestone.priority,
            status: 'todo',
            dueDate: targetDate,
            policyId: policy.id,
            clientId: policy.clientId,
            createdById: policy.createdById,
            renewalDaysBefore: milestone.daysBefore,
          },
        });
      }
    }
  }
}
```

### Pattern 3: Kanban Board with @dnd-kit

**What:** Four-column kanban board (To Do, In Progress, Waiting, Done) with drag-and-drop between columns.
**When to use:** Task kanban view.

```typescript
// Key structure for kanban
import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

function TaskKanban({ tasks, onStatusChange }) {
  const [activeTask, setActiveTask] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const columns = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    waiting: tasks.filter(t => t.status === 'waiting'),
    done: tasks.filter(t => t.status === 'done'),
  };

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over) return;
    // Determine target column from droppable ID
    const newStatus = over.data.current?.columnId || over.id;
    if (newStatus !== active.data.current?.status) {
      onStatusChange(active.id, newStatus); // API call to update
    }
    setActiveTask(null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={({ active }) => setActiveTask(active.data.current?.task)}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-4 gap-4">
        {Object.entries(columns).map(([status, items]) => (
          <KanbanColumn key={status} id={status} tasks={items} />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
```

### Pattern 4: Dashboard with Parallel API Calls

**What:** Dashboard page makes multiple independent API calls in parallel for each widget.
**When to use:** Today Dashboard page.

```typescript
// Dashboard uses parallel fetches for each section
useEffect(() => {
  const fetchDashboard = async () => {
    const [summary, renewals, overdueTasks, recentActivity, premiumIncome] =
      await Promise.all([
        api.get<DashboardSummary>('/api/dashboard/summary'),
        api.get<UpcomingRenewal[]>('/api/dashboard/renewals'),
        api.get<OverdueTask[]>('/api/dashboard/overdue-tasks'),
        api.get<ActivityItem[]>('/api/dashboard/recent-activity'),
        api.get<PremiumIncome>('/api/dashboard/premium-income'),
      ]);
    // Set state for each widget
  };
  fetchDashboard();
}, []);
```

### Pattern 5: Resend Email with React Email Components

**What:** Use Resend SDK directly with React Email components rendered server-side.
**When to use:** Daily digest email.

```typescript
// apps/api/src/notifications/notifications.service.ts
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { DailyDigestEmail } from './emails/daily-digest.js';

@Injectable()
export class NotificationsService {
  private readonly resend: Resend;

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(configService.get('RESEND_API_KEY'));
  }

  async sendDailyDigest(to: string, data: DigestData) {
    const html = await render(DailyDigestEmail(data));
    await this.resend.emails.send({
      from: 'Anchor <notifications@yourdomain.com>',
      to,
      subject: `Daily Digest: ${data.overdueCount} overdue, ${data.renewalCount} upcoming renewals`,
      html,
    });
  }
}
```

**IMPORTANT:** The Resend `react` property (passing React component directly) may not work in NestJS since it requires a React runtime. Use `@react-email/render` to convert to HTML string first, then pass as `html`. The `@react-email/render` package needs to be installed:

```bash
pnpm --filter api add @react-email/render
```

### Pattern 6: Renewal Task Lifecycle Hooks

**What:** When a policy's endDate changes, or a policy is cancelled/deleted, renewal tasks must be updated.
**When to use:** PolicyService.update() and PolicyService.remove()

```typescript
// In PoliciesService.update() -- after the policy is updated
if (dto.endDate !== undefined && dto.endDate !== existingEndDate) {
  // Delete all pending renewal tasks for this policy
  await this.prisma.task.deleteMany({
    where: {
      policyId: id,
      type: 'renewal',
      status: { not: 'done' },
    },
  });
  // Regenerate fresh renewal tasks
  await this.renewalsService.generateTasksForPolicy(updatedPolicy);
}

// Policy deletion: handled by Prisma onDelete: Cascade on the Task.policyId relation
```

### Anti-Patterns to Avoid

- **Using tenantClient in cron jobs:** Cron jobs run outside HTTP request context, so CLS has no tenantId. Always use raw `this.prisma` and manually filter by tenantId.
- **Storing cron schedule in environment variables for MVP:** Unnecessary complexity. Hard-code cron expressions. Configurable schedules are deferred.
- **Building custom email HTML strings:** Use `@react-email/components` and `@react-email/render`. Custom HTML is error-prone across email clients.
- **Polling for renewal checks every minute:** Once-daily cron at 1 AM is sufficient. The renewal tasks are generated based on date math, not real-time events.
- **Making dashboard a server component:** Dashboard needs auth context (useUser hook), multiple API calls, and interactive elements. Keep it as a client component.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cron job scheduling | Custom setTimeout/setInterval loops | `@nestjs/schedule` with `@Cron` decorator | Cron expressions, lifecycle management, timezone support |
| Drag-and-drop kanban | Custom mouse event handlers | `@dnd-kit/core` + `@dnd-kit/sortable` | Accessibility (keyboard DnD), touch support, collision detection, smooth animations |
| Sortable/filterable table | Custom sort/filter logic | `@tanstack/react-table` (already installed) | Client-side sorting, column definitions, type-safe |
| Email template HTML | Inline HTML strings with tables | `@react-email/components` (already installed) | Cross-client compatibility, responsive, clean API |
| Email delivery | Raw SMTP / Nodemailer | `resend` SDK (already installed) | Already in deps, simple API, delivery tracking |
| Date math (days between, add/subtract) | Manual Date arithmetic | `date-fns` (already installed) | `differenceInDays`, `subDays`, `addDays`, `isAfter`, `isBefore`, `startOfDay` |

**Key insight:** Most libraries needed for Phase 3 are already installed (`resend`, `@react-email/components`, `@tanstack/react-table`, `date-fns`). Only `@nestjs/schedule` and `@dnd-kit/*` are new.

## Common Pitfalls

### Pitfall 1: CLS Context Missing in Cron Jobs
**What goes wrong:** Cron jobs try to use `this.prisma.tenantClient` which reads from CLS, but CLS is only populated by the JwtAuthGuard during HTTP requests. Cron jobs have no HTTP context.
**Why it happens:** The tenant extension pattern (CLS-based) only works in request scope.
**How to avoid:** In all cron/scheduler services, inject `PrismaService` and use it directly (e.g., `this.prisma.task.findMany({ where: { tenantId: ... } })`). Never use `tenantClient` in cron jobs.
**Warning signs:** `Error: Tenant context not set. Ensure JwtAuthGuard is applied.` in cron job logs.

### Pitfall 2: Duplicate Renewal Tasks
**What goes wrong:** Running the renewal cron job multiple times creates duplicate tasks for the same policy+milestone.
**Why it happens:** No idempotency check -- the job just creates tasks whenever the date math matches.
**How to avoid:** Before creating a renewal task, always check if one already exists for the same `policyId` + `renewalDaysBefore` + `type: 'renewal'` + `status != 'done'`. The `@@index([policyId, type, status])` index supports this query efficiently.
**Warning signs:** Multiple "60-day reminder" tasks for the same policy.

### Pitfall 3: Orphaned Renewal Tasks After Policy Changes
**What goes wrong:** Policy expiration date changes or policy is cancelled, but old renewal tasks remain.
**Why it happens:** No lifecycle hook connecting policy updates to renewal task cleanup.
**How to avoid:** Two mechanisms: (1) For policy deletion, `onDelete: Cascade` on `Task.policyId` handles cleanup automatically at the DB level. (2) For policy endDate changes, explicitly delete pending renewal tasks and regenerate. (3) For policy status change to cancelled/expired, delete pending renewal tasks.
**Warning signs:** Tasks referencing policies with different expiration dates, or tasks for cancelled policies.

### Pitfall 4: Prisma Decimal Serialization in Dashboard Aggregations
**What goes wrong:** Summing premium amounts returns `Decimal` objects, not numbers. Frontend receives strings.
**Why it happens:** Prisma serializes `Decimal` fields as strings (per Phase 2 decision).
**How to avoid:** Use Prisma's `_sum` aggregation which returns `Decimal`. Convert to number using `Number()` or `parseFloat()` in the service before sending to frontend. Or use raw SQL for aggregate queries: `SELECT SUM(premium) FROM policies WHERE ...`.
**Warning signs:** Dashboard showing `[object Object]` or `NaN` for premium totals.

### Pitfall 5: React Email in NestJS (JSX/TSX in Backend)
**What goes wrong:** NestJS doesn't compile `.tsx` files by default. React Email components use JSX syntax.
**Why it happens:** NestJS uses `tsc` which needs `jsx` compiler option, and the nest-cli's webpack config may not handle `.tsx`.
**How to avoid:** Two approaches: (a) Use `@react-email/render` with `render()` to convert to HTML string, keep email templates as plain functions returning React elements, and ensure `tsconfig.json` has `"jsx": "react-jsx"`. (b) Simpler: use `@react-email/render`'s `render()` with the component, and configure `tsconfig.json` in the API to support JSX. The existing `@react-email/components` install suggests the intent was to use JSX.
**Warning signs:** `SyntaxError: Unexpected token '<'` when importing email template.

### Pitfall 6: Timezone Handling for 8 AM Digest
**What goes wrong:** Cron job runs at 8 AM server time, not user's local time.
**Why it happens:** `@nestjs/schedule` `@Cron` decorator supports `timeZone` option, but each user might be in a different timezone.
**How to avoid:** For MVP, use a single timezone (e.g., `America/Toronto` for Canadian agency). The user decision defers per-user timezone configuration. Set timezone in the `@Cron` decorator: `@Cron('0 0 8 * * *', { timeZone: 'America/Toronto' })`.
**Warning signs:** Users receiving digest at wrong local time.

### Pitfall 7: Task Count Queries and Tenant Extension
**What goes wrong:** `count()` is NOT overridden by the tenant extension (per Phase 2 lesson).
**Why it happens:** The `createTenantExtension` only overrides `findMany`, `findFirst`, `create`, `update`, `delete`.
**How to avoid:** Always add `tenantId` manually to `count()` queries: `this.prisma.task.count({ where: { tenantId, ... } })`.
**Warning signs:** Dashboard summary cards showing counts from all tenants.

### Pitfall 8: @dnd-kit with React 19 Server Components
**What goes wrong:** `@dnd-kit/core` components used in a file without `"use client"` directive.
**Why it happens:** DndContext and related components use React hooks internally.
**How to avoid:** Ensure ALL kanban components have `"use client"` at the top. The kanban board is inherently client-side interactive.
**Warning signs:** Hydration errors or "hooks can only be used in client components" errors.

## Code Examples

### Shared Types (packages/shared/src/types/task.ts)

```typescript
export type TaskStatus = 'todo' | 'in_progress' | 'waiting' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskType = 'manual' | 'renewal';

export interface Task {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  /** ISO date string (YYYY-MM-DD) or null */
  dueDate: string | null;
  assigneeId: string | null;
  clientId: string | null;
  policyId: string | null;
  createdById: string;
  renewalDaysBefore: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskWithRelations extends Task {
  assignee?: { id: string; firstName: string; lastName: string } | null;
  client?: { id: string; firstName: string; lastName: string } | null;
  policy?: { id: string; type: string; carrier: string | null; policyNumber: string | null } | null;
}
```

### Zod Validation Schema (packages/shared/src/validation/task.schema.ts)

```typescript
import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional().or(z.literal('')),
  status: z.enum(['todo', 'in_progress', 'waiting', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  dueDate: z.string().optional().or(z.literal('')),
  assigneeId: z.string().uuid().optional().or(z.literal('')),
  clientId: z.string().uuid().optional().or(z.literal('')),
  policyId: z.string().uuid().optional().or(z.literal('')),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().or(z.literal('')),
  status: z.enum(['todo', 'in_progress', 'waiting', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().optional().or(z.literal('')),
  assigneeId: z.string().uuid().optional().or(z.literal('')),
  clientId: z.string().uuid().optional().or(z.literal('')),
  policyId: z.string().uuid().optional().or(z.literal('')),
});

export type CreateTaskInput = z.input<typeof createTaskSchema>;
export type UpdateTaskInput = z.input<typeof updateTaskSchema>;
```

### Dashboard API Endpoints

```typescript
// apps/api/src/dashboard/dashboard.controller.ts
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary(@TenantId() tenantId: string) {
    return this.dashboardService.getSummary(tenantId);
  }

  @Get('renewals')
  async getUpcomingRenewals(@TenantId() tenantId: string) {
    return this.dashboardService.getUpcomingRenewals(tenantId);
  }

  @Get('overdue-tasks')
  async getOverdueTasks(@TenantId() tenantId: string) {
    return this.dashboardService.getOverdueTasks(tenantId);
  }

  @Get('recent-activity')
  async getRecentActivity(@TenantId() tenantId: string) {
    return this.dashboardService.getRecentActivity(tenantId);
  }

  @Get('premium-income')
  async getPremiumIncome(@TenantId() tenantId: string) {
    return this.dashboardService.getPremiumIncome(tenantId);
  }
}
```

### Dashboard Summary Service (Aggregation Queries)

```typescript
// Demonstrates the count() pitfall -- must include tenantId manually
async getSummary(tenantId: string) {
  const today = startOfDay(new Date());
  const thirtyDaysFromNow = addDays(today, 30);

  const [overdueCount, dueTodayCount, renewalsIn30Days, activeClients] =
    await Promise.all([
      this.prisma.task.count({
        where: {
          tenantId,
          dueDate: { lt: today },
          status: { not: 'done' },
        },
      }),
      this.prisma.task.count({
        where: {
          tenantId,
          dueDate: { gte: today, lt: addDays(today, 1) },
          status: { not: 'done' },
        },
      }),
      this.prisma.policy.count({
        where: {
          tenantId,
          endDate: { gte: today, lte: thirtyDaysFromNow },
          status: { in: ['active', 'pending_renewal'] },
        },
      }),
      this.prisma.client.count({
        where: { tenantId, status: 'client' },
      }),
    ]);

  return { overdueCount, dueTodayCount, renewalsIn30Days, activeClients };
}
```

### Premium Income Calculation

```typescript
async getPremiumIncome(tenantId: string) {
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentYearStart = startOfYear(now);
  const previousMonthStart = startOfMonth(subMonths(now, 1));
  const previousMonthEnd = endOfMonth(subMonths(now, 1));

  // Use Prisma aggregate for sum
  const [currentMonth, ytd, previousMonth] = await Promise.all([
    this.prisma.policy.aggregate({
      where: {
        tenantId,
        status: { in: ['active', 'pending_renewal', 'renewed'] },
        createdAt: { gte: currentMonthStart },
        premium: { not: null },
      },
      _sum: { premium: true },
    }),
    this.prisma.policy.aggregate({
      where: {
        tenantId,
        status: { in: ['active', 'pending_renewal', 'renewed'] },
        createdAt: { gte: currentYearStart },
        premium: { not: null },
      },
      _sum: { premium: true },
    }),
    this.prisma.policy.aggregate({
      where: {
        tenantId,
        status: { in: ['active', 'pending_renewal', 'renewed'] },
        createdAt: { gte: previousMonthStart, lte: previousMonthEnd },
        premium: { not: null },
      },
      _sum: { premium: true },
    }),
  ]);

  const currentMonthTotal = Number(currentMonth._sum.premium ?? 0);
  const ytdTotal = Number(ytd._sum.premium ?? 0);
  const previousMonthTotal = Number(previousMonth._sum.premium ?? 0);

  // Simple % change (Claude's discretion: using % change, not sparkline)
  const trendPercentage = previousMonthTotal > 0
    ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
    : 0;

  return {
    currentMonth: currentMonthTotal,
    ytd: ytdTotal,
    previousMonth: previousMonthTotal,
    trendPercentage: Math.round(trendPercentage * 10) / 10,
  };
}
```

### ActivityEvent Types for Recent Activity Feed

The existing `ActivityEventType` enum already includes: `client_created`, `client_updated`, `client_status_changed`, `note_added`, `policy_created`, `policy_updated`, `policy_status_changed`, `policy_deleted`.

New event types to add for Phase 3:
```prisma
// Add to ActivityEventType enum
task_created
task_completed
task_status_changed
```

**Claude's discretion recommendation for recent activity feed:** Show the 10 most recent events of all types, ordered by `createdAt` desc. This provides a comprehensive view of agency activity.

### React Email Template for Daily Digest

```tsx
// apps/api/src/notifications/emails/daily-digest.tsx
import {
  Html, Head, Preview, Body, Container, Section,
  Heading, Text, Hr, Row, Column,
} from '@react-email/components';

interface DigestData {
  userName: string;
  overdueTasksCount: number;
  overdueTasks: Array<{ title: string; dueDate: string; clientName: string }>;
  renewalMilestones: Array<{ policyType: string; clientName: string; daysRemaining: number; expiryDate: string }>;
}

export function DailyDigestEmail(props: DigestData) {
  return (
    <Html>
      <Head />
      <Preview>
        {props.overdueTasksCount} overdue tasks, {props.renewalMilestones.length} upcoming renewals
      </Preview>
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f6f9fc' }}>
        <Container style={{ padding: '20px', maxWidth: '600px' }}>
          <Heading as="h1">Good morning, {props.userName}</Heading>
          {/* Renewal milestones section */}
          {/* Overdue tasks section */}
        </Container>
      </Body>
    </Html>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-beautiful-dnd for kanban | @dnd-kit/core + @dnd-kit/sortable | 2023 (react-beautiful-dnd deprecated) | Must use @dnd-kit, not react-beautiful-dnd |
| Nodemailer for emails | Resend + React Email | 2023+ | Already using Resend in this project |
| Custom cron implementation | @nestjs/schedule | Stable since NestJS 7 | Official module, no custom scheduling needed |
| renderAsync for React Email | render (sync) | React Email 5.0 (2025) | Use `render()` not `renderAsync()` |
| @react-email/render as separate pkg | Included in @react-email/components | Recent | May need to install `@react-email/render` separately for server-side HTML generation |

**Deprecated/outdated:**
- `react-beautiful-dnd`: Deprecated by Atlassian, do not use
- `renderAsync` from `@react-email/render`: Replaced with sync `render()` in React Email 5.0
- `passport-jwt` for auth: Already replaced in Phase 1 with Supabase `auth.getUser()`

## Open Questions

1. **TSX support in NestJS build**
   - What we know: `@react-email/components` is installed in the API. React Email templates use JSX/TSX syntax. NestJS uses `tsc` for compilation.
   - What's unclear: Whether the current `tsconfig.json` in `apps/api` supports JSX compilation. If not, the `"jsx"` compiler option must be added.
   - Recommendation: Check `apps/api/tsconfig.json` for `"jsx"` setting. If missing, add `"jsx": "react-jsx"`. Alternatively, use a simpler approach: build email HTML strings manually or use `render()` from a separate build step. The simplest path is adding `"jsx": "react-jsx"` to the API tsconfig.

2. **Premium Income calculation basis**
   - What we know: User wants current month + YTD + trend. Premiums are stored on policies.
   - What's unclear: Should "current month" mean policies created this month, or all active policies' premiums? Annual premium vs prorated monthly amount?
   - Recommendation: Use policies with `createdAt` in current month for "current month premium income" (new business this month). Use all policies created in current year for YTD. This aligns with insurance agency tracking of new premium written.

3. **User opt-out preference storage**
   - What we know: Per-user opt-out toggle for daily digest (on by default). Settings page exists.
   - What's unclear: Where to store the preference -- new column on User model or a separate UserPreferences model?
   - Recommendation: Add `digestOptOut Boolean @default(false)` column to the User model. Simplest approach for MVP, avoids a new model.

## Sources

### Primary (HIGH confidence)
- Existing codebase patterns: Prisma schema, PoliciesService, ClientsController, client-list.tsx, client-table.tsx, view-toggle.tsx, api.ts
- [NestJS Task Scheduling Documentation](https://docs.nestjs.com/techniques/task-scheduling)
- [@nestjs/schedule npm](https://www.npmjs.com/package/@nestjs/schedule) - v6.1.1
- [dnd kit official site](https://dndkit.com/)
- [Resend Node.js SDK](https://resend.com/nodejs)

### Secondary (MEDIUM confidence)
- [NestJS Task Scheduling Guide (OneUptime, 2026-02-02)](https://oneuptime.com/blog/post/2026-02-02-nestjs-task-scheduling/view) - ScheduleModule setup and @Cron patterns
- [dnd-kit kanban implementation (radzion.com)](https://radzion.com/blog/kanban/) - DndContext, SortableContext, DragOverlay patterns
- [dnd-kit + shadcn/ui + tailwind kanban (GitHub)](https://github.com/Georgegriff/react-dnd-kit-tailwind-shadcn-ui) - Reference implementation with same UI stack
- [React Email + Resend integration](https://react.email/docs/integrations/resend)
- [@dnd-kit/core npm](https://www.npmjs.com/package/@dnd-kit/core) - v6.3.1
- [@dnd-kit/sortable npm](https://www.npmjs.com/package/@dnd-kit/sortable) - v10.0.0

### Tertiary (LOW confidence)
- @dnd-kit/react (v0.3.2) - New React-specific package, pre-stable. Not recommended for MVP but worth monitoring for future migration.
- React Email 5.0 `render()` vs `renderAsync()` change - verified via search but not directly tested

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Existing deps verified in package.json, new deps verified on npm, established patterns
- Architecture: HIGH - Follows exact codebase patterns from Phase 1 and 2 (module structure, tenant extension, controller patterns, shared types)
- Pitfalls: HIGH - Derived from actual codebase analysis (CLS context, count() limitation, Decimal serialization all documented from Phase 2 experience)
- Kanban DnD: MEDIUM - @dnd-kit/core is stable and well-documented, but cross-column drag pattern has complexity. Reference implementations exist with same stack.
- Email (Resend + React Email in NestJS): MEDIUM - Both packages installed, API is simple, but TSX compilation in NestJS backend needs validation

**Research date:** 2026-02-21
**Valid until:** 2026-03-21 (30 days - stable domain, no fast-moving changes expected)

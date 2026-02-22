---
phase: 03-tasks-renewals-and-dashboard
plan: 01
subsystem: database
tags: [prisma, zod, typescript, task-management, dnd-kit, nestjs-schedule, react-email]

# Dependency graph
requires:
  - phase: 02-client-and-policy-management
    provides: Client, Policy, ActivityEvent models and shared types
provides:
  - Task Prisma model with enums, indexes, and cascade relations
  - Shared Task/TaskWithRelations types and TaskStatus/Priority/Type unions
  - createTaskSchema and updateTaskSchema Zod validation schemas
  - TASK_STATUSES, TASK_PRIORITIES, RENEWAL_MILESTONES constants
  - User digestOptOut field for daily digest opt-out
  - ActivityEventType extended with task_created/completed/status_changed
  - API JSX support for React Email templates
  - @nestjs/schedule, @react-email/render, @dnd-kit/* dependencies
affects:
  - 03-02 (task backend API uses Task model, shared types, schemas)
  - 03-03 (renewal engine uses Task model, RENEWAL_MILESTONES)
  - 03-04 (dashboard uses Task types, constants)
  - 03-05 (notifications uses @nestjs/schedule, @react-email/render, JSX tsconfig, digestOptOut)

# Tech tracking
tech-stack:
  added: ["@nestjs/schedule@^6.1.1", "@react-email/render@^2.0.4", "@dnd-kit/core@^6.3.1", "@dnd-kit/sortable@^10.0.0", "@dnd-kit/utilities@^3.2.2"]
  patterns: ["Task model with tenant scoping via $allModels extension", "Cascade delete on policy->tasks for renewal cleanup"]

key-files:
  created:
    - packages/shared/src/types/task.ts
    - packages/shared/src/validation/task.schema.ts
    - packages/shared/src/constants/tasks.ts
  modified:
    - packages/database/prisma/schema.prisma
    - packages/shared/src/types/activity.ts
    - packages/shared/src/index.ts
    - apps/api/tsconfig.json
    - apps/api/package.json
    - apps/web/package.json

key-decisions:
  - "z.input<typeof schema> for form types (consistent with Phase 2 decision)"
  - "onDelete: Cascade on policy relation ensures renewal task cleanup"
  - "jsx: react-jsx in API tsconfig for React Email .tsx templates"

patterns-established:
  - "Task enums mirror Prisma enums as string unions in shared types"
  - "RENEWAL_MILESTONES constant defines 60/30/7-day reminder schedule"

# Metrics
duration: 7min
completed: 2026-02-22
---

# Phase 3 Plan 01: Data Foundation Summary

**Task Prisma model with 3 enums, shared TS types/Zod schemas/constants, and Phase 3 dependency installation**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-22T03:30:58Z
- **Completed:** 2026-02-22T03:37:53Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Task model in Prisma with TaskStatus/TaskPriority/TaskType enums, 4 indexes, and cascade relations to Client and Policy
- Shared types (Task, TaskWithRelations), Zod schemas (createTaskSchema, updateTaskSchema), and constants (TASK_STATUSES, TASK_PRIORITIES, RENEWAL_MILESTONES) exported from @anchor/shared
- ActivityEventType extended with task_created, task_completed, task_status_changed
- User model extended with digestOptOut Boolean for daily digest preference
- All Phase 3 dependencies installed: @nestjs/schedule, @react-email/render, @dnd-kit/*
- API tsconfig supports JSX for React Email templates

## Task Commits

Each task was committed atomically:

1. **Task 1: Prisma schema -- Task model, enums, and User digestOptOut** - `4e0bc18` (feat)
2. **Task 2: Shared types, validation schemas, constants, and dependency installation** - `7cdcf4c` (feat)

## Files Created/Modified
- `packages/database/prisma/schema.prisma` - Added TaskStatus, TaskPriority, TaskType enums; Task model; digestOptOut on User; extended ActivityEventType; reverse relations on Tenant/User/Client/Policy
- `packages/shared/src/types/task.ts` - Task, TaskWithRelations interfaces; TaskStatus, TaskPriority, TaskType union types
- `packages/shared/src/types/activity.ts` - Added task_created, task_completed, task_status_changed to ActivityEventType
- `packages/shared/src/validation/task.schema.ts` - createTaskSchema, updateTaskSchema with Zod; CreateTaskInput, UpdateTaskInput types
- `packages/shared/src/constants/tasks.ts` - TASK_STATUSES, TASK_PRIORITIES, RENEWAL_MILESTONES constants
- `packages/shared/src/index.ts` - Re-exports for all new task types, schemas, and constants
- `apps/api/tsconfig.json` - Added jsx: react-jsx for React Email template compilation
- `apps/api/package.json` - Added @nestjs/schedule, @react-email/render
- `apps/web/package.json` - Added @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities

## Decisions Made
- Used `z.input<typeof schema>` for CreateTaskInput/UpdateTaskInput (consistent with Phase 2 decision for zodResolver compatibility with .default() fields)
- `onDelete: Cascade` on Task->Policy relation to auto-delete renewal tasks when policy is deleted
- `jsx: react-jsx` in API tsconfig (simplest approach for React Email .tsx templates per Phase 3 research)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Task model and all shared types/schemas/constants ready for Plan 02 (backend API)
- @nestjs/schedule ready for Plan 03 (renewal engine cron)
- @react-email/render and JSX tsconfig ready for Plan 05 (notifications)
- @dnd-kit/* ready for Plan 04 (dashboard kanban board)
- Tenant extension $allModels will auto-scope Task queries

## Self-Check: PASSED

---
*Phase: 03-tasks-renewals-and-dashboard*
*Plan: 01*
*Completed: 2026-02-22*

# Roadmap: Anchor

## Overview

Anchor's MVP delivers a complete insurance agent operating system in 7 phases, starting with authentication and tenant isolation, building the core client-policy-renewal-task chain, then layering documents, finances, trust features, and analytics. Each phase delivers a coherent, testable capability. The dashboard is built incrementally — skeleton in Phase 3, enhanced as modules come online.

## Phases

- [ ] **Phase 1: Foundation & Auth** - Monorepo setup, Supabase integration, authentication, multi-tenancy, user roles
- [x] **Phase 2: Client & Policy Management** - Client CRM, policy records, lead/client workflow
- [x] **Phase 3: Tasks, Renewals & Dashboard** - Task system, renewal automation, Today Dashboard, email notifications
- [x] **Phase 4: Documents & Compliance** - Document upload/linking, compliance activity log
- [ ] **Phase 5: Expenses & Budgets** - Expense tracking, receipt uploads, budgets, alerts, financial dashboard widget
- [ ] **Phase 6: Trust & Reputation** - Testimonials, surveys, feedback, public Agent Badge page
- [ ] **Phase 7: Analytics, Import & Polish** - Light analytics, CSV import, performance optimization

## Phase Details

### Phase 1: Foundation & Auth
**Goal**: Users can securely create accounts, log in, and manage their agency with role-based access
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-08, NOTF-04
**Success Criteria** (what must be TRUE):
  1. User can sign up with email/password, verify email, and access the app
  2. User can log in and stay logged in across browser refresh
  3. User can reset a forgotten password via email
  4. Admin can invite a user via email and that user can create their account
  5. Admin sees full navigation; invited user sees restricted navigation (no budget/expense)
**Plans**: 5 plans

Plans:
- [ ] 01-01-PLAN.md -- Monorepo scaffolding, Prisma schema, Supabase config, shared packages
- [ ] 01-02-PLAN.md -- Auth pages (signup, login, verification, password reset)
- [ ] 01-03-PLAN.md -- NestJS backend (JWT strategy, guards, tenant Prisma, user endpoints)
- [ ] 01-04-PLAN.md -- App shell (sidebar, topnav, navy theme, role-based navigation)
- [ ] 01-05-PLAN.md -- Invitations, setup wizard, team management, email templates

### Phase 2: Client & Policy Management
**Goal**: Users can manage their book of business — clients, leads, and policies with full profiles
**Depends on**: Phase 1
**Requirements**: CLNT-01, CLNT-02, CLNT-03, CLNT-04, CLNT-05, CLNT-06, CLNT-07, CLNT-08, PLCY-01, PLCY-02, PLCY-03, PLCY-04, PLCY-05
**Success Criteria** (what must be TRUE):
  1. User can create, edit, search, and delete clients with full contact details
  2. User can set a client as Lead (minimal data) or Client (full records)
  3. Each client has a profile page showing a living activity timeline
  4. User can add notes to a client and see them in the timeline
  5. User can create, edit, and delete policies linked to a client with type, carrier, dates, premium, and status
**Plans**: 6 plans

Plans:
- [x] 02-01-PLAN.md -- Schema, shared types/constants/validation, install dependencies
- [x] 02-02-PLAN.md -- NestJS backend modules (Clients, Timeline, Policies)
- [x] 02-03-PLAN.md -- Client list page (tabs, search, filters, table/card toggle, forms)
- [x] 02-04-PLAN.md -- Client profile page (tabbed sections, timeline/notes display)
- [x] 02-05-PLAN.md -- Policy frontend (forms, cards/table, auto-convert, visual verification)
- [x] 02-06-PLAN.md -- Standalone policies page with cross-client search

### Phase 3: Tasks, Renewals & Dashboard
**Goal**: The system actively prevents quiet failures — auto-generating renewal tasks and surfacing what needs attention daily
**Depends on**: Phase 2
**Requirements**: PLCY-06, TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, DASH-01, DASH-02, DASH-04, NOTF-01, NOTF-02
**Success Criteria** (what must be TRUE):
  1. When a policy is created with an expiration date, renewal tasks automatically appear at 60, 30, and 7 days before
  2. User can create, complete, and manage tasks linked to clients and policies
  3. Today Dashboard shows upcoming renewals (30/60 days) and overdue tasks
  4. Dashboard provides quick action shortcuts to add clients, tasks, and expenses
  5. System sends renewal reminder emails and daily overdue task digests
**Plans**: 5 plans

Plans:
- [x] 03-01-PLAN.md -- Data foundation (Prisma Task model, shared types/validation/constants, install deps)
- [x] 03-02-PLAN.md -- Task CRUD backend + Renewal engine (tasks module, renewals module, policy lifecycle hooks)
- [x] 03-03-PLAN.md -- Dashboard backend + Email notifications (5 dashboard endpoints, daily digest via Resend)
- [x] 03-04-PLAN.md -- Task frontend (list/kanban page, table view, kanban board with drag-and-drop, task form)
- [x] 03-05-PLAN.md -- Dashboard frontend (summary cards, quick actions, renewals/overdue/activity widgets, premium income)

### Phase 4: Documents & Compliance
**Goal**: Agents can store and retrieve documents for any client or policy, with an immutable compliance trail
**Depends on**: Phase 2
**Requirements**: DOCS-01, DOCS-02, DOCS-03, DOCS-04, DOCS-05, COMP-01, COMP-02, COMP-03
**Success Criteria** (what must be TRUE):
  1. User can upload documents (PDF, images, Word) linked to a client or policy (max 10MB)
  2. Documents are securely stored with tenant isolation — agency A cannot access agency B's files
  3. User can view, download, and delete documents with category tags
  4. Key actions (policy created, task completed, document uploaded) are automatically logged
  5. User can view the compliance log filtered by client, date range, or action type
**Plans**: 4 plans

Plans:
- [x] 04-01-PLAN.md -- Data foundation (Prisma Document model, shared types/schemas/constants, api.ts upload, NAV_ITEMS)
- [x] 04-02-PLAN.md -- Backend modules (Documents CRUD + Supabase Storage, Compliance query endpoint)
- [x] 04-03-PLAN.md -- Document frontend (upload, folder browse, preview, client profile tabs, count badges)
- [x] 04-04-PLAN.md -- Compliance page (/compliance with filters, table, pagination) + policy document section

### Phase 5: Expenses & Budgets
**Goal**: Admin has financial awareness -- tracking expenses, setting budgets, and receiving alerts before limits are exceeded
**Depends on**: Phase 1 (roles), Phase 4 (storage for receipts)
**Requirements**: EXPN-01, EXPN-02, EXPN-03, EXPN-04, EXPN-05, EXPN-06, DASH-03, NOTF-03
**Success Criteria** (what must be TRUE):
  1. Any user can create expenses with amount (CAD), category, date, description (everyone submits, admin approves)
  2. User can upload receipt images (JPEG, PNG, WebP, PDF) attached to expenses
  3. Admin can create monthly budgets with overall limit and per-category limits that auto-renew
  4. System sends in-app alert when approved spending reaches 80% of a budget category
  5. Today Dashboard shows budget usage and expense totals for the current month
**Plans**: 5 plans

Plans:
- [ ] 05-01-PLAN.md -- Data foundation (Prisma schema, shared types/schemas/constants, Recharts install)
- [ ] 05-02-PLAN.md -- Expense backend (CRUD, approval workflow, receipt upload, recurring cron)
- [ ] 05-03-PLAN.md -- Budget & alerts backend (budget CRUD, auto-renewal cron, threshold alerts, dashboard financial endpoint)
- [ ] 05-04-PLAN.md -- Expense UI (list with status tabs, form dialog, receipt upload/preview, inline approval)
- [ ] 05-05-PLAN.md -- Budget UI, notification bell, donut chart, and dashboard financial widget

### Phase 6: Trust & Reputation
**Goal**: Agents can build and showcase their professional reputation through client testimonials and a public digital presence
**Depends on**: Phase 2 (clients)
**Requirements**: TRST-01, TRST-02, TRST-03, TRST-04, TRST-05, TRST-06, TRST-07
**Success Criteria** (what must be TRUE):
  1. User can generate and send a testimonial request link to a client
  2. Client can submit a testimonial without creating an account
  3. User can create and send feedback surveys; responses appear on the client profile
  4. Each agent has a public badge page displaying photo, license, contact info, social links, and approved testimonials
  5. Agent can choose which testimonials appear on their public badge page
**Plans**: TBD

Plans:
- [ ] 06-01: Testimonial requests, client submissions, survey/feedback system
- [ ] 06-02: Public Agent Badge page (SSG, agent profile, testimonial display)

### Phase 7: Analytics, Import & Polish
**Goal**: Agents can understand their book of business, import existing data, and experience a polished, performant app
**Depends on**: Phases 2-6 (analytics needs data from all modules)
**Requirements**: ANLY-01, ANLY-02, ANLY-03, ANLY-04, CLNT-09, DASH-05
**Success Criteria** (what must be TRUE):
  1. User can view clients broken down by policy type
  2. User can view a renewal pipeline by month and active vs expired policy counts
  3. System identifies cross-sell opportunities (e.g., client has auto but no home insurance)
  4. User can import clients from a CSV file with column mapping
  5. Dashboard loads within 2 seconds for agencies with up to 200 clients
**Plans**: TBD

Plans:
- [ ] 07-01: Analytics dashboards (policy type breakdown, renewal pipeline, cross-sell signals)
- [ ] 07-02: CSV import with column mapping
- [ ] 07-03: Performance optimization, testing, polish

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Auth | 0/5 | Planning complete | - |
| 2. Client & Policy Management | 6/6 | UAT passed | 2026-02-21 |
| 3. Tasks, Renewals & Dashboard | 5/5 | Verified | 2026-02-22 |
| 4. Documents & Compliance | 4/4 | Verified | 2026-02-23 |
| 5. Expenses & Budgets | 0/5 | Planning complete | - |
| 6. Trust & Reputation | 0/2 | Not started | - |
| 7. Analytics, Import & Polish | 0/3 | Not started | - |

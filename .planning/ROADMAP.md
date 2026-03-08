# Roadmap: Anchor

## Overview

Anchor's MVP delivers a complete insurance agent operating system in 8 phases, starting with authentication and tenant isolation, building the core client-policy-renewal-task chain, then layering documents, finances, trust features, and analytics. Each phase delivers a coherent, testable capability. The dashboard is built incrementally — skeleton in Phase 3, enhanced as modules come online.

## Phases

- [ ] **Phase 1: Foundation & Auth** - Monorepo setup, Supabase integration, authentication, multi-tenancy, user roles
- [x] **Phase 2: Client & Policy Management** - Client CRM, policy records, lead/client workflow
- [x] **Phase 3: Tasks, Renewals & Dashboard** - Task system, renewal automation, Today Dashboard, email notifications
- [x] **Phase 4: Documents & Compliance** - Document upload/linking, compliance activity log
- [x] **Phase 5: Expenses & Budgets** - Expense tracking, receipt uploads, budgets, alerts, financial dashboard widget
- [x] **Phase 6: Trust & Reputation** - Testimonials, public Agent Badge page
- [x] **Phase 7: Analytics, Import & Polish** - Analytics dashboards, CSV import, cross-sell intelligence, performance optimization
- [x] **Phase 8: Scheduled Emails & Client Communications** - Birthday emails, configurable renewal reminders, bulk email, cross-sell campaigns
- [ ] **Phase 9: Founder / Super-Admin Dashboard** - Centralized founder dashboard with agency-wide oversight, metrics, and administrative controls

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
- [x] 05-01-PLAN.md -- Data foundation (Prisma schema, shared types/schemas/constants, Recharts install)
- [x] 05-02-PLAN.md -- Expense backend (CRUD, approval workflow, receipt upload, recurring cron)
- [x] 05-03-PLAN.md -- Budget & alerts backend (budget CRUD, auto-renewal cron, threshold alerts, dashboard financial endpoint)
- [x] 05-04-PLAN.md -- Expense UI (list with status tabs, form dialog, receipt upload/preview, inline approval)
- [x] 05-05-PLAN.md -- Budget UI, notification bell, donut chart, and dashboard financial widget

### Phase 6: Trust & Reputation
**Goal**: Agents can build and showcase their professional reputation through client testimonials and a public digital presence
**Depends on**: Phase 2 (clients)
**Requirements**: TRST-01, TRST-02, TRST-05, TRST-06, TRST-07 (TRST-03, TRST-04 deferred -- surveys out of scope)
**Success Criteria** (what must be TRUE):
  1. User can generate and share a testimonial request link
  2. Client can submit a testimonial without creating an account
  3. Each agent has a public badge page displaying photo, license, contact info, social links, and approved testimonials
  4. Agent can choose which testimonials appear on their public badge page (show/hide, feature up to 2)
  5. Agent receives in-app notification when a new testimonial is submitted
**Plans**: 4 plans

Plans:
- [x] 06-01-PLAN.md -- Data foundation (AgentProfile + Testimonial schema, shared types/schemas/constants)
- [x] 06-02-PLAN.md -- Backend badge module (profile CRUD, testimonial submission, curation, image upload, notifications)
- [x] 06-03-PLAN.md -- Public pages (testimonial form, badge page, middleware update, display components)
- [x] 06-04-PLAN.md -- Badge management UI (Settings > Badge, profile editor, testimonial curation, link sharing)

### Phase 7: Analytics, Import & Polish
**Goal**: Agents can understand their book of business, import existing data, and experience a polished, performant app
**Depends on**: Phases 2-6 (analytics needs data from all modules)
**Requirements**: ANLY-01, ANLY-02, ANLY-03, ANLY-04, CLNT-09, DASH-05
**Success Criteria** (what must be TRUE):
  1. User can view clients broken down by policy type
  2. User can view a renewal pipeline by month and active vs expired policy counts
  3. System identifies cross-sell opportunities with client email/phone visible in gap table
  4. User can import clients from a CSV file with column mapping
  5. Dashboard loads within 2 seconds for agencies with up to 200 clients
  6. CSV and PDF exports include client email and phone columns
**Plans**: 5 plans

Plans:
- [x] 07-01-PLAN.md -- Data foundation + backend (shared types/constants, analytics module with 8 endpoints, import module)
- [x] 07-02-PLAN.md -- Analytics frontend part 1 (page shell, time range selector, export utils, Overview/Clients/Policies tabs)
- [x] 07-03-PLAN.md -- Analytics frontend part 2 (Renewals/Expenses/Compliance/Cross-Sell tabs, client profile cross-sell badge)
- [x] 07-04-PLAN.md -- CSV import wizard (4-step wizard: upload, column mapping, preview, summary)
- [x] 07-05-PLAN.md -- Performance optimization, mobile responsive audit, UX polish

### Phase 8: Scheduled Emails & Client Communications
**Goal**: Agents never miss a client touchpoint — automated birthday greetings, configurable renewal reminder emails, bulk email capability, and cross-sell campaign outreach
**Depends on**: Phase 3 (email infrastructure, renewal engine), Phase 2 (client data)
**Success Criteria** (what must be TRUE):
  1. System automatically sends birthday emails to clients on their birthday
  2. Admin can configure renewal reminder email timing (60, 30, 7 days before — toggle each on/off)
  3. Renewal reminder emails are sent to clients at the configured intervals before policy expiry
  4. Admin can compose and send a bulk email to all clients (or filtered subset)
  5. Email send history is visible so agents know what was sent and when
  6. Admin can configure up to 10 custom cross-sell pairings that drive gap analysis
  7. Admin can schedule cross-sell email campaigns (one-time or recurring monthly) to clients with coverage gaps
  8. Emailed clients list shows who received each campaign with sent date and status
**Plans**: 5 plans

Plans:
- [x] 08-01-PLAN.md -- Data foundation (EmailLog + TenantEmailSettings schema, shared types/constants/validation, sendEmail refactor)
- [x] 08-02-PLAN.md -- Birthday + renewal reminder cron jobs (templates, service methods, scheduler entries, idempotent sends)
- [x] 08-03-PLAN.md -- Communications backend module (bulk email endpoint, email history, settings CRUD)
- [x] 08-04-PLAN.md -- Frontend (settings communications page, email history page, bulk email compose page)
- [x] 08-05-PLAN.md -- Build verification and human checkpoint

### Phase 9: Founder / Super-Admin Dashboard
**Goal**: Founder has centralized oversight of the entire platform — key metrics, agency management, user support actions, impersonation, and administrative controls in a separate admin app
**Depends on**: Phase 8
**Success Criteria** (what must be TRUE):
  1. Super-admin can log in to a separate admin app and see platform-wide metrics (agencies, users, policies, clients)
  2. Dashboard shows health alerts, growth charts, and engagement metrics with time range filtering
  3. Super-admin can browse, search, and filter agencies in a sortable table
  4. Clicking an agency shows detail page with tabs: overview, users, policies summary, activity log
  5. Super-admin can suspend/unsuspend agencies with confirmation and suspended agency users are locked out
  6. Super-admin can export agency data as CSV or JSON
  7. Super-admin can disable/enable users, change roles, trigger password resets, and deactivate (soft delete) users
  8. Super-admin can impersonate agency users with a visible banner and 30-minute auto-expiry
  9. Every admin action is logged in an audit trail viewable in the admin panel
  10. Super-admins can invite and remove other super-admins
**Plans**: 8 plans

Plans:
- [ ] 09-01-PLAN.md -- Data foundation (SuperAdmin + AdminAuditLog models, Tenant/User extensions, shared types/constants/validation)
- [ ] 09-02-PLAN.md -- Admin app scaffold (Next.js app, auth, middleware, layout, sidebar, API client)
- [ ] 09-03-PLAN.md -- Backend admin module (SuperAdminGuard, AuditService, platform metrics, health endpoints)
- [ ] 09-04-PLAN.md -- Backend agencies, users, and impersonation endpoints
- [ ] 09-05-PLAN.md -- Dashboard metrics UI (summary cards, health alerts, growth charts, time range, export)
- [ ] 09-06-PLAN.md -- Agency management UI (list, detail tabs, suspend, export, limits)
- [ ] 09-07-PLAN.md -- User management UI (cross-tenant table, support actions, impersonation flow)
- [ ] 09-08-PLAN.md -- Audit log UI, super-admin settings, build verification, human checkpoint

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Auth | 0/5 | Planning complete | - |
| 2. Client & Policy Management | 6/6 | UAT passed | 2026-02-21 |
| 3. Tasks, Renewals & Dashboard | 5/5 | Verified | 2026-02-22 |
| 4. Documents & Compliance | 4/4 | Verified | 2026-02-23 |
| 5. Expenses & Budgets | 5/5 | Complete | 2026-02-23 |
| 6. Trust & Reputation | 4/4 | Complete | 2026-02-23 |
| 7. Analytics, Import & Polish | 5/5 | Complete | 2026-03-02 |
| 8. Scheduled Emails & Client Communications | 5/5 | Complete | 2026-03-02 |
| 9. Founder / Super-Admin Dashboard | 0/8 | Planned | - |

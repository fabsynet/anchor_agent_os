# Anchor

## What This Is

Anchor is an operating system for insurance agents in Canada. It prevents quiet failures — missed renewals, lost documents, inconsistent client communication, and budget overruns — by making lifecycle-driven insurance work automatic and visible. Built for small agencies (admin + up to 2 team members) who need calm, reliable infrastructure, not another bloated CRM.

## Core Value

No renewal, follow-up, or compliance task silently slips through the cracks.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Onboarding flow with email verification, SMS phone verification, and profile setup
- [ ] Today Dashboard showing renewals due, overdue tasks, missing documents, budget usage, and quick actions
- [ ] Client profiles with personal details, policies, renewal dates, tasks, notes, emails, documents, and optional expenses
- [ ] CRM status system (Lead → Client) with minimal data for leads, full records for clients
- [ ] Living client timeline as the system of record
- [ ] Policy management with renewal automation (auto-created tasks at 60/30/7 days before renewal)
- [ ] Task and follow-up system tied to clients, policies, and the dashboard
- [ ] Document upload and linking to clients/policies
- [ ] Lightweight compliance activity log
- [ ] Manual expense tracking with receipt uploads
- [ ] Monthly budgets by category with start/end dates and auto-retirement
- [ ] Budget alerts at 80% threshold
- [ ] Financial snapshot on dashboard (expense totals, budget usage)
- [ ] Optional expense-to-client linkage
- [ ] Testimonial request links sent to clients
- [ ] Client feedback and surveys
- [ ] Public Digital Agent Badge page (photo, license, contact info, WhatsApp/social links, testimonials, optional booking link)
- [ ] User roles: Admin (full access, budget/expense control, user invitations up to 2) and Invited Users (client/policy/task access, no budget control)
- [ ] Light analytics: clients by policy type, renewals by month, active vs expired, new business vs renewals, province filtering, cross-sell signals
- [ ] Email notifications (renewal reminders, budget alerts, task reminders)

### Out of Scope

- Accounting & taxes — complexity too high for MVP, not core to preventing quiet failures
- Commission reconciliation — requires carrier data, defer to post-MVP
- Carrier integrations — each carrier has different systems, massive scope
- Advanced marketing automation — not core to agent operations
- Mobile native app — web-first, responsive design sufficient for MVP
- Real-time chat — high complexity, agents use WhatsApp/phone already
- OAuth social login — email/password + phone verification sufficient for MVP
- Video/media in documents — file upload covers core need

## Context

- **Target market:** Canadian insurance agents, primarily small independent agencies
- **Pricing model:** SaaS subscription — Core $79 CAD/agent/month, Pro $129 CAD/agent/month
- **Competitive positioning:** Not competing with Salesforce/HubSpot CRMs or QuickBooks. Anchor is purpose-built infrastructure for insurance agent workflows.
- **Geographic:** Canada-first (provinces, CAD, Canadian compliance) with internationalization kept possible for future expansion
- **Team:** Small development team (2-3 developers) building with Claude assistance
- **User behavior:** Agents need daily driver software — something they open every morning. The dashboard must answer "what needs my attention right now?" instantly.
- **Multi-tenancy:** Each agency is a tenant. Admin creates the account, can invite up to 2 additional users.

## Constraints

- **Tech stack:** Next.js + Tailwind (frontend), NestJS (backend API), Supabase (Auth + PostgreSQL + Storage), Prisma ORM, Resend (email)
- **Auth:** Supabase Auth including phone auth for SMS verification
- **Hosting:** Vercel (frontend), managed backend service (Railway/Render/Fly)
- **Storage:** Supabase Storage for documents and receipt uploads
- **Timeline:** 12-week target for MVP delivery
- **Team size:** Small team, so architecture must be simple and maintainable — avoid over-engineering
- **Canada-first:** Province-based geography, CAD currency, but don't hardcode — keep internationalization feasible

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| NestJS over Express | More structured for growing codebase with modules/services pattern | — Pending |
| Supabase all-in (Auth + DB + Storage) | One platform, simpler ops, scales well, reduces integration complexity | — Pending |
| Prisma ORM | Type-safe database queries, good migration story, works well with Supabase PostgreSQL | — Pending |
| Resend for email | Modern, simple API, good developer experience | — Pending |
| Public Agent Badge as dedicated page | Each agent gets anchor.com/agent/slug — shareable, professional | — Pending |
| Canada-first, not Canada-only | Province fields, CAD pricing, but architecture allows future localization | — Pending |
| No mobile app for MVP | Responsive web covers mobile use cases, native app is large scope | — Pending |

---
*Last updated: 2026-02-05 after initialization*

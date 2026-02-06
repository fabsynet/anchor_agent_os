# Requirements: Anchor

**Defined:** 2026-02-05
**Core Value:** No renewal, follow-up, or compliance task silently slips through the cracks.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication & Access

- [ ] **AUTH-01**: User can create an account with email and password
- [ ] **AUTH-02**: User receives email verification link after signup and must verify before accessing the app
- [ ] **AUTH-03**: User can reset password via email link
- [ ] **AUTH-04**: User session persists across browser refresh (cookie-based)
- [ ] **AUTH-05**: Admin can invite up to 2 additional users via email
- [ ] **AUTH-06**: Invited user can accept invitation and create their account
- [ ] **AUTH-07**: Admin role has full access including budget/expense control and user management
- [ ] **AUTH-08**: Invited User role has client, policy, task, note, and document access but no budget/expense control

### Client Management

- [ ] **CLNT-01**: User can create a client with personal details (name, email, phone, address with province and postal code)
- [ ] **CLNT-02**: User can search clients by name, email, or phone number
- [ ] **CLNT-03**: User can view a client profile showing all associated data (policies, tasks, notes, documents, expenses)
- [ ] **CLNT-04**: User can edit and delete client records
- [ ] **CLNT-05**: User can set client status as Lead or Client
- [ ] **CLNT-06**: Leads require minimal data (name + one contact method); Clients require full records
- [ ] **CLNT-07**: Each client has a living activity timeline showing all interactions in chronological order
- [ ] **CLNT-08**: User can add free-form notes to a client record
- [ ] **CLNT-09**: User can import clients from a CSV file with column mapping

### Policy Management

- [ ] **PLCY-01**: User can create a policy linked to a client with type, carrier, policy number, effective date, expiration date, premium, and status
- [ ] **PLCY-02**: Policy types include at minimum: Auto, Home, Life, Health, Commercial, and Other
- [ ] **PLCY-03**: Policy status can be Active, Expired, Cancelled, or Pending
- [ ] **PLCY-04**: A client can have multiple policies
- [ ] **PLCY-05**: User can edit and delete policy records
- [ ] **PLCY-06**: When a policy is created with an expiration date, renewal tasks are automatically generated at 60, 30, and 7 days before expiration

### Task Management

- [ ] **TASK-01**: User can create a task with title, description, due date, and priority
- [ ] **TASK-02**: Tasks can be linked to a specific client and/or policy
- [ ] **TASK-03**: User can mark tasks as complete or reopen them
- [ ] **TASK-04**: Overdue tasks are highlighted on the Today Dashboard
- [ ] **TASK-05**: User receives email notification for tasks due today and overdue tasks
- [ ] **TASK-06**: Auto-generated renewal tasks are distinguishable from manual tasks

### Document Management

- [ ] **DOCS-01**: User can upload documents (PDF, images, Word) linked to a client or policy
- [ ] **DOCS-02**: Documents are stored securely with tenant isolation (agency A cannot access agency B's files)
- [ ] **DOCS-03**: User can view, download, and delete uploaded documents
- [ ] **DOCS-04**: Documents have a name and optional category/type tag
- [ ] **DOCS-05**: File size limit of 10MB per document

### Compliance

- [ ] **COMP-01**: System automatically logs key actions as compliance activities (policy created, renewal task completed, document uploaded)
- [ ] **COMP-02**: User can view the compliance activity log filtered by client, date range, or action type
- [ ] **COMP-03**: Compliance log entries are immutable (cannot be edited or deleted)

### Expenses & Budgets

- [ ] **EXPN-01**: Admin can create an expense entry with amount (CAD), category, date, description, and optional client linkage
- [ ] **EXPN-02**: Admin can upload a receipt image attached to an expense
- [ ] **EXPN-03**: Admin can create monthly budgets by category with start and end dates
- [ ] **EXPN-04**: Budgets auto-retire after their end date
- [ ] **EXPN-05**: System sends alert when spending reaches 80% of a budget category
- [ ] **EXPN-06**: Invited Users cannot access expense or budget features

### Dashboard

- [ ] **DASH-01**: Today Dashboard shows renewals due in the next 30 and 60 days
- [ ] **DASH-02**: Today Dashboard shows overdue tasks with count and list
- [ ] **DASH-03**: Today Dashboard shows budget usage and expense totals for the current month
- [ ] **DASH-04**: Today Dashboard provides quick action shortcuts (add client, add task, add expense)
- [ ] **DASH-05**: Dashboard loads within 2 seconds for agencies with up to 200 clients

### Trust & Reputation

- [ ] **TRST-01**: User can generate a testimonial request link to send to a client
- [ ] **TRST-02**: Client can submit a testimonial via the link (no account required)
- [ ] **TRST-03**: User can create and send short feedback surveys to clients
- [ ] **TRST-04**: Client survey responses are stored and viewable on the client profile
- [ ] **TRST-05**: Each agent has a public Digital Agent Badge page at a unique URL
- [ ] **TRST-06**: Badge page displays agent photo, license number, contact info, social/WhatsApp links, and approved testimonials
- [ ] **TRST-07**: Agent can choose which testimonials appear on their public badge page

### Analytics

- [ ] **ANLY-01**: User can view a breakdown of clients by policy type
- [ ] **ANLY-02**: User can view renewal pipeline by month (upcoming renewals)
- [ ] **ANLY-03**: User can view active vs expired policy counts
- [ ] **ANLY-04**: System identifies cross-sell opportunities (clients with coverage gaps, e.g., has auto but no home)

### Email Notifications

- [ ] **NOTF-01**: System sends renewal reminder emails at 60, 30, and 7 days before policy expiration
- [ ] **NOTF-02**: System sends daily digest of overdue tasks (if any exist)
- [ ] **NOTF-03**: System sends budget alert email when 80% threshold is reached
- [ ] **NOTF-04**: User invitation email includes signup link

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Onboarding & Auth Enhancements

- **AUTH-V2-01**: Phone verification via SMS during signup
- **AUTH-V2-02**: Guided onboarding wizard with progress indicator (name, phone, address, license)
- **AUTH-V2-03**: OAuth login (Google)

### Client Enhancements

- **CLNT-V2-01**: Household/account grouping (link family members sharing policies)
- **CLNT-V2-02**: Custom fields on client records
- **CLNT-V2-03**: Client lifecycle automation (birthday, policy anniversary triggers)

### Task Enhancements

- **TASK-V2-01**: Recurring tasks (daily, weekly, monthly, quarterly)
- **TASK-V2-02**: Task templates for common workflows (new client checklist, renewal process)
- **TASK-V2-03**: Calendar view for tasks and renewals

### Communication

- **COMM-V2-01**: Email templates for common communications (renewal notices, welcome emails)
- **COMM-V2-02**: Send templated emails from within the platform
- **COMM-V2-03**: Two-way email integration (BCC forwarding to log in timeline)

### Reporting

- **REPT-V2-01**: Export reports to CSV/PDF
- **REPT-V2-02**: Province-based geographic filtering in analytics
- **REPT-V2-03**: Custom date range filtering on all reports

### Localization

- **LOCL-V2-01**: French language support (Quebec market)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Accounting & taxes | High complexity, not core to preventing quiet failures. Point users to QuickBooks/Wave. |
| Commission reconciliation | Requires carrier statement imports and complex matching. AgencyBloc's specialty — not ours. |
| Carrier API integrations | Each carrier has different systems. In Canada, fragmentation is worse. Massive scope for a startup. |
| Comparative rating/quoting | EZLynx's entire business. 6-12 months of work alone. Not Anchor's value proposition. |
| Advanced marketing automation | Mailchimp territory. Anchor is operations, not marketing. |
| Mobile native app | Responsive web sufficient for MVP. Native app is large scope. |
| Real-time chat | Agents use WhatsApp/phone already. High complexity, low unique value. |
| Claims management workflow | Agent's role in claims is limited. Low-value complex workflow. |
| VOIP/phone integration | Complex, expensive, agents use cell phones. |
| Built-in email inbox | Full IMAP/SMTP client is complex. Agents use Gmail/Outlook. |
| Workflow builder | Hard to build well, rarely used by small agents. Opinionated built-in workflows are better. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | TBD | Pending |
| AUTH-02 | TBD | Pending |
| AUTH-03 | TBD | Pending |
| AUTH-04 | TBD | Pending |
| AUTH-05 | TBD | Pending |
| AUTH-06 | TBD | Pending |
| AUTH-07 | TBD | Pending |
| AUTH-08 | TBD | Pending |
| CLNT-01 | TBD | Pending |
| CLNT-02 | TBD | Pending |
| CLNT-03 | TBD | Pending |
| CLNT-04 | TBD | Pending |
| CLNT-05 | TBD | Pending |
| CLNT-06 | TBD | Pending |
| CLNT-07 | TBD | Pending |
| CLNT-08 | TBD | Pending |
| CLNT-09 | TBD | Pending |
| PLCY-01 | TBD | Pending |
| PLCY-02 | TBD | Pending |
| PLCY-03 | TBD | Pending |
| PLCY-04 | TBD | Pending |
| PLCY-05 | TBD | Pending |
| PLCY-06 | TBD | Pending |
| TASK-01 | TBD | Pending |
| TASK-02 | TBD | Pending |
| TASK-03 | TBD | Pending |
| TASK-04 | TBD | Pending |
| TASK-05 | TBD | Pending |
| TASK-06 | TBD | Pending |
| DOCS-01 | TBD | Pending |
| DOCS-02 | TBD | Pending |
| DOCS-03 | TBD | Pending |
| DOCS-04 | TBD | Pending |
| DOCS-05 | TBD | Pending |
| COMP-01 | TBD | Pending |
| COMP-02 | TBD | Pending |
| COMP-03 | TBD | Pending |
| EXPN-01 | TBD | Pending |
| EXPN-02 | TBD | Pending |
| EXPN-03 | TBD | Pending |
| EXPN-04 | TBD | Pending |
| EXPN-05 | TBD | Pending |
| EXPN-06 | TBD | Pending |
| DASH-01 | TBD | Pending |
| DASH-02 | TBD | Pending |
| DASH-03 | TBD | Pending |
| DASH-04 | TBD | Pending |
| DASH-05 | TBD | Pending |
| TRST-01 | TBD | Pending |
| TRST-02 | TBD | Pending |
| TRST-03 | TBD | Pending |
| TRST-04 | TBD | Pending |
| TRST-05 | TBD | Pending |
| TRST-06 | TBD | Pending |
| TRST-07 | TBD | Pending |
| ANLY-01 | TBD | Pending |
| ANLY-02 | TBD | Pending |
| ANLY-03 | TBD | Pending |
| ANLY-04 | TBD | Pending |
| NOTF-01 | TBD | Pending |
| NOTF-02 | TBD | Pending |
| NOTF-03 | TBD | Pending |
| NOTF-04 | TBD | Pending |

**Coverage:**
- v1 requirements: 52 total
- Mapped to phases: 0
- Unmapped: 52

---
*Requirements defined: 2026-02-05*
*Last updated: 2026-02-05 after initial definition*

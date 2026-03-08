# Phase 9: Founder / Super-Admin Dashboard - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Platform-level super-admin panel for the app owner to manage ALL agencies/tenants. The founder can monitor platform health, browse and manage agencies, perform cross-tenant support actions (password resets, account management), impersonate agency users for debugging, and extract platform-wide analytics. This is NOT a per-agency dashboard — it's the platform administration layer.

</domain>

<decisions>
## Implementation Decisions

### Platform Metrics
- Landing view: summary cards at top (total agencies, users, policies, clients) + health alerts below
- Metrics categories: growth (new agencies/users/clients over time), engagement (active agencies, login frequency, feature usage), business (total policies, premium value, renewal rates), operational (email delivery, storage, errors)
- Visual charts (line graphs, bar charts) with CSV/PDF export option
- Time range: preset periods (7d, 30d, 90d, All Time) plus custom date picker

### Agency Management
- Searchable table for agency list (name, plan, user count, created date — search/filter/sort)
- Click into agency opens a dedicated agency profile page with tabs (overview, users, policies summary, activity log)
- Full read access to individual records within any agency
- Full impersonation — super-admin can act as agency admin, make changes on their behalf for support
- Impersonation banner: "Acting as [Agency]" clearly visible
- Impersonation sessions auto-expire (e.g., 30 min) — must re-enter to continue

### Support Actions — User Level
- Trigger password reset email for any user
- Disable/enable user accounts (lock out or re-enable)
- Change user role within their agency (promote/demote)
- Deactivate user (soft delete — NOT permanent deletion)

### Support Actions — Agency Level
- Suspend entire agency (all users locked out until re-enabled)
- Export agency's full data (clients, policies, etc.) as CSV/JSON
- Adjust agency-specific limits (user cap, storage, etc.)
- No agency deletion — suspend only

### Support Action Confirmations
- Modal confirmation for all destructive actions (suspend, deactivate, role changes)
- Non-destructive actions (password reset, view) proceed without confirmation

### Audit Trail
- Every super-admin action logged with timestamp, action type, target user/agency
- Full audit log viewable in the admin panel

### Access & Security
- Separate login route (/admin/login or similar) — isolated from tenant auth
- Separate Next.js app in the monorepo (apps/admin) — fully isolated deployment
- Small team access (2-3 super-admins) — need ability to add/remove super-admins
- Impersonation sessions time-limited with auto-expiry

### Claude's Discretion
- Exact chart library and visualization approach (likely Recharts, matching existing patterns)
- Impersonation session duration (30 min suggested, Claude can adjust)
- Admin app styling (can match or diverge from tenant app)
- Audit log retention policy
- Super-admin invitation/onboarding flow mechanics
- Health alert thresholds and definitions

</decisions>

<specifics>
## Specific Ideas

- Platform admin is the app owner, not an agency admin — cross-tenant visibility
- Impersonation must clearly show a banner so actions aren't confused with personal account
- Deactivate (not delete) users to preserve data integrity
- Suspend (not delete) agencies — reversible action only
- Analytics extraction is a key use case — founder needs to pull metrics for business reporting

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-founder-super-admin-dashboard*
*Context gathered: 2026-03-07*

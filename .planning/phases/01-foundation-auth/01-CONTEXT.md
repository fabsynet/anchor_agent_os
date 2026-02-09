# Phase 1: Foundation & Auth - Context

**Gathered:** 2026-02-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can securely create accounts, log in, and manage their agency with role-based access. Covers monorepo setup, Supabase integration, authentication flows (signup, login, verification, password reset), multi-tenancy with tenant isolation, user roles (Admin/Agent), and invitation flow. Dashboard content, client management, and other features are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Signup & Login Experience
- Email and password only — no social login (Google, Microsoft, etc.)
- Signup fields: first name, last name, agency name, email, password, confirm password
- Agency tenant is created at signup from the agency name
- Split-screen login page: left side for branding/tagline/gradient, right side for login form
- After signup and email verification, user lands in a quick setup wizard (2-3 steps: agency details, profile photo, invite first team member) before reaching the dashboard
- Forgot password flow via email reset link

### Invitation & Onboarding Flow
- Admin invites by entering email address and selecting a role (Admin or Agent) at invite time
- Invited user clicks link and sees a full mini-signup: name, password, optional profile photo. Agency is pre-linked
- Admin can view pending invites, revoke/cancel them, and resend expired invites
- Agency invite cap: 2 users maximum for MVP (admin + 2 invited = 3 total)

### Role Visibility & Navigation
- Two roles at MVP: Admin (full access, manages agency) and Agent (no invite capability, no budget management, but can submit expenses)
- Restricted nav items are visible but disabled/greyed out with "Admin only" tooltip — Agent knows features exist
- Top nav bar for branding and profile/account menu
- Collapsible left sidebar for main navigation
- Admin sidebar nav items: Dashboard, Clients, Policies, Tasks, Documents, Expenses, Settings (team, profile)

### App Shell & Branding
- Color scheme: navy blue primary, white backgrounds — professional trust and authority feel
- UI component library: shadcn/ui with Tailwind CSS
- Light + dark mode toggle (user can switch)
- Fully responsive: works on desktop, tablet, and mobile. Sidebar collapses to hamburger on small screens

### Claude's Discretion
- Exact navy palette shades and accent colors
- Loading states and skeleton screens
- Form validation UX (inline vs summary)
- Email template design for verification, reset, and invites
- Setup wizard step details and flow
- Error page designs (404, 500)
- Toast/notification component choice

</decisions>

<specifics>
## Specific Ideas

- Split-screen login: branding side should reinforce the "Anchor" identity — tagline, logo, professional feel
- Setup wizard should feel lightweight — not a blocker, but a guided welcome
- Disabled nav items with tooltip help Agents understand the product has more to offer (upgrade path later)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-auth*
*Context gathered: 2026-02-08*

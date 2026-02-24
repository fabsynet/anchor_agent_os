# Phase 7: Analytics, Import & Polish - Context

**Gathered:** 2026-02-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver analytics dashboards with reports and exports, CSV import for bulk client+policy data, and a performance/UX polish pass across the entire app. Cross-sell intelligence surfaces coverage gaps. All existing data from Phases 2-6 is visualized but no new data-entry capabilities are added.

</domain>

<decisions>
## Implementation Decisions

### Analytics page & reports
- Dedicated /analytics page (not embedded in dashboard)
- Tabbed sections on one page: Overview, Clients, Policies, Renewals, Expenses, Compliance
- Reports available:
  - Total/active/inactive client counts
  - Premium report by product line and policy sub-type
  - Expense report and budget summary
  - Renewal report month-over-month
  - Compliance report per client or per company
  - Policy report per client
- Default time range: last 12 months with range selector (3mo, 6mo, YTD, all time)
- All reports viewable in-app AND exportable as CSV and PDF
- Add Analytics to sidebar NAV_ITEMS

### Chart types
- Policy type breakdown: donut/pie chart
- Renewal pipeline by month: stacked bar chart (active vs expiring vs expired segments)
- Other chart types at Claude's discretion based on data characteristics

### Cross-sell intelligence
- Summary cards at top showing counts (e.g., "12 clients missing Home insurance")
- Detail table below with all clients and their coverage gaps
- Cross-sell lives as a tab on the /analytics page
- Additionally, show a small cross-sell badge/indicator on individual client profiles
- Product pairings: standard bundles (Auto+Home, Life+Disability, Home+Umbrella) PLUS flag any client with fewer than 2 policy types
- View-only — no action buttons (agent decides follow-up manually)

### CSV import
- Import clients + policies from a single CSV file
- Format: one row per policy, client info repeated on each row (system deduplicates clients automatically)
- Column mapping: auto-detect from headers + manual adjust before import
- Error handling: preview all rows with errors highlighted, user can fix inline or skip individual rows before committing
- Duplicate detection: auto-skip duplicates, but show flagged duplicates in import summary so agent can handle manually
- Downloadable CSV template with expected headers and 1-2 example rows
- Import page accessible from settings or a dedicated route

### Performance targets
- 2-second load target for ALL pages (dashboard, client list, policies, tasks, expenses, analytics) at 200-client scale
- Claude to profile and identify specific bottlenecks rather than guessing
- Optimize queries, add pagination/virtualization where needed

### Mobile & UX polish
- Must work on mobile — all pages usable on mobile screens — but desktop experience is primary and must not be compromised
- Claude to systematically audit all existing pages for UX inconsistencies
- Apply best-practice UI/UX patterns: loading states, skeleton screens, consistent form validation, error feedback

### Claude's Discretion
- Specific chart library configurations and styling
- Analytics page layout and spacing
- Which performance optimizations to apply (query optimization, caching, virtualization, lazy loading)
- Mobile responsive breakpoints and layout adjustments
- Loading skeleton designs and animation
- CSV import page layout and step-by-step wizard flow
- PDF export formatting and styling

</decisions>

<specifics>
## Specific Ideas

- Reports should cover the full scope of existing data: clients, policies, premiums, expenses, budgets, renewals, compliance
- Premium report drills from product line (Auto, Home, Life) into policy sub-types within each
- Single-CSV import means agents can export from their current system and import everything at once
- Template download ensures agents know exactly what format to use
- Cross-sell badges on client profiles give at-a-glance coverage gap visibility

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-analytics-import-and-polish*
*Context gathered: 2026-02-23*

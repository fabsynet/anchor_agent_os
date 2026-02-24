---
phase: 07-analytics-import-and-polish
plan: 03
subsystem: analytics-frontend
tags: [recharts, analytics, cross-sell, coverage-gaps, stacked-bar, donut-chart]
requires: [07-01, 07-02]
provides: [complete-analytics-tabs, cross-sell-badge]
affects: [07-05]
tech-stack:
  added: []
  patterns: [coverage-gap-computation-from-loaded-data, cross-sell-bundle-matching]
key-files:
  created:
    - apps/web/src/components/analytics/analytics-renewals-tab.tsx
    - apps/web/src/components/analytics/analytics-expenses-tab.tsx
    - apps/web/src/components/analytics/analytics-compliance-tab.tsx
    - apps/web/src/components/analytics/analytics-crosssell-tab.tsx
  modified:
    - apps/web/src/app/(dashboard)/analytics/page.tsx
    - apps/web/src/app/(dashboard)/clients/[id]/page.tsx
key-decisions:
  - Cross-sell badge computed from already-loaded policies (no extra API call)
  - Coverage gaps only flagged for partial bundle matches (client has auto but not home)
  - CROSS_SELL_BUNDLES defined inline in client page (avoids @anchor/shared import in page component)
duration: ~10 minutes
completed: 2026-02-24
---

# Phase 7 Plan 3: Remaining Analytics Tabs + Cross-Sell Badge Summary

**One-liner:** 4 analytics tabs (Renewals stacked bar, Expenses donut, Compliance horizontal bar, Cross-Sell detail table) plus client profile coverage gap badge

## What Was Built

### Renewals Tab
- Stacked bar chart (Recharts BarChart with stackId) showing active/expiring/expired policies per month
- 12-month pipeline view fetched from `/api/analytics/renewal-pipeline` (no date range params)
- Summary cards below chart with totals for each status category
- CSV/PDF export via ExportButtons

### Expenses Tab
- 3 stat cards: Total Approved (CAD), Total Pending (CAD), Budget Usage (percentage or "No budget set")
- Donut chart (PieChart with inner radius) showing expense distribution by category
- Category breakdown table with amount and percentage columns
- Fetches from `/api/analytics/expense-summary` with date range params

### Compliance Tab
- Total Events stat card
- Horizontal bar chart (BarChart layout="vertical") showing activity events by type
- Per-user activity summary table sorted by event count descending
- Fetches from `/api/analytics/compliance-summary` with date range params

### Cross-Sell Tab
- Summary cards grid: one card per policy type showing count of clients missing that type
- "Under-Insured" card for clients with < 2 active policy types
- "Total Opportunities" summary card
- Detail table with columns: Client Name (link to profile), Active Types (secondary badges), Missing Types (destructive badges), # Policies
- View-only table, no action buttons
- Fetches from `/api/analytics/cross-sell` (no date range params)

### Client Profile Coverage Gap Badge
- Amber badge displayed after profile header for status='client' clients
- Computes coverage gaps from policies already loaded in the profile (no extra API call)
- Uses CROSS_SELL_BUNDLES logic: only flags gaps where client has partial bundle coverage
- Shows "Coverage Gaps: Home, Life" etc. with ShieldAlert icon
- Hidden when no gaps exist or client is a lead

### Analytics Page Update
- Replaced all 4 placeholder "Coming soon" TabsContent with real tab component imports
- Removed PLACEHOLDER_TABS constant
- All 7 tabs now render real data: Overview, Clients, Policies, Renewals, Expenses, Compliance, Cross-Sell

## All Components Follow Established Patterns

- Three-state pattern: loading skeleton, empty state with icon, data display
- ExportButtons with CSV/PDF on all 4 new tabs
- HSL CSS variable chart colors: `hsl(var(--chart-1))` through `--chart-5`
- CAD currency formatting via `Intl.NumberFormat('en-CA', ...)`
- ChartCard wrapper for chart sections
- Cancellation-safe useEffect with `cancelled` flag

## Task Commits

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Renewals and Expenses analytics tabs | 7ccdb48 | analytics-renewals-tab.tsx, analytics-expenses-tab.tsx |
| 2 | Compliance, Cross-Sell tabs + client badge | a941fd7 | analytics-compliance-tab.tsx, analytics-crosssell-tab.tsx, analytics/page.tsx, clients/[id]/page.tsx |

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Cross-sell badge uses loaded policies, not API call | Client profile already fetches `policies: true`; avoid redundant network request |
| Coverage gaps only for partial bundle matches | More useful than flagging every missing type; highlights actionable cross-sell |
| CROSS_SELL_BUNDLES defined inline (not imported from @anchor/shared) | Page component uses `'use client'` directive; keeps dependency graph simple |

## Deviations from Plan

None - plan executed exactly as written.

## Verification

1. `pnpm --filter web build` passes - CONFIRMED
2. All 7 analytics tabs have real content (no placeholders) - CONFIRMED
3. Renewals tab: stacked bar chart - CONFIRMED
4. Cross-Sell tab: summary cards + detail table (view-only) - CONFIRMED
5. Client profile: cross-sell badge when gaps exist - CONFIRMED
6. CSV/PDF export on all 4 new tabs - CONFIRMED

## Next Phase Readiness

Plan 07-03 completes the analytics frontend. All 7 tabs are populated. The cross-sell badge is live on client profiles. Phase 7 Plan 5 (final polish) can proceed.

## Self-Check: PASSED

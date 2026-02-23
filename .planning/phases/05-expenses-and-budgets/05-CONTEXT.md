# Phase 5: Expenses & Budgets - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin has financial awareness -- tracking expenses, setting budgets, and receiving alerts before limits are exceeded. Covers expense CRUD with receipt uploads, category budgets with auto-renewal, 80% threshold alerts, and a dashboard financial widget. Depends on Phase 1 (roles) and Phase 4 (storage for receipts).

</domain>

<decisions>
## Implementation Decisions

### Expense entry & categories
- Preset categories for insurance agencies + ability to add custom categories
- Everyone can submit expenses, but admin must approve before they count toward budgets (approval workflow)
- Simple recurring expenses supported -- mark as recurring (weekly/monthly/yearly) and auto-create on schedule
- No client or policy linkage on expenses -- expenses stand alone
- Currency is CAD (per success criteria)

### Receipt handling
- File picker + drag-and-drop zone on the expense form
- Multiple receipts per expense (e.g., itemized receipt + credit card statement)
- Inline preview -- thumbnail/lightbox for images, browser viewer for PDFs
- Accepted file types: JPEG, PNG, WebP, and PDF
- Reuse Phase 4 Supabase Storage patterns for receipt uploads

### Budget setup & alerts
- Two-level budget structure: overall monthly budget AND optional per-category limits
- Budgets are admin-only (create, modify, delete). Team members can view but not change.
- 80% threshold alerts delivered in-app only (banner/toast), no email
- Auto-retirement at month end with auto-creation of next month's budget (same limits carry forward)

### Dashboard financial widget
- Combined widget: budget progress bars per category AND expense summary numbers (total spent, expense count, top category)
- Current month only -- no comparison to previous months
- Donut/pie chart for category breakdown alongside numbers and progress bars
- Admin-only by default, with ability for admin to grant select team members view access
- Follows existing dashboard widget patterns (three-state: loading/empty/data)

### Claude's Discretion
- Preset expense category list (pick sensible defaults for insurance agencies)
- Approval workflow UX (inline approve/reject or separate queue)
- Recurring expense cron schedule and edge cases
- In-app alert presentation (toast, banner, or badge)
- Donut chart library choice
- How "grant team member view access" is implemented (simple flag vs settings UI)

</decisions>

<specifics>
## Specific Ideas

- Admin can selectively grant financial widget visibility to individual team members (not all-or-nothing)
- Recurring expenses auto-create on schedule (weekly/monthly/yearly)
- Budgets auto-renew each month with same limits -- agent shouldn't have to re-create budgets manually

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 05-expenses-and-budgets*
*Context gathered: 2026-02-22*

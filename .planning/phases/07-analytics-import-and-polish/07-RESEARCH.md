# Phase 7: Analytics, Import & Polish - Research

**Researched:** 2026-02-23
**Domain:** Analytics dashboards, CSV import, PDF export, performance optimization, UX polish
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Analytics page & reports
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

#### Chart types
- Policy type breakdown: donut/pie chart
- Renewal pipeline by month: stacked bar chart (active vs expiring vs expired segments)
- Other chart types at Claude's discretion based on data characteristics

#### Cross-sell intelligence
- Summary cards at top showing counts (e.g., "12 clients missing Home insurance")
- Detail table below with all clients and their coverage gaps
- Cross-sell lives as a tab on the /analytics page
- Additionally, show a small cross-sell badge/indicator on individual client profiles
- Product pairings: standard bundles (Auto+Home, Life+Disability, Home+Umbrella) PLUS flag any client with fewer than 2 policy types
- View-only -- no action buttons (agent decides follow-up manually)

#### CSV import
- Import clients + policies from a single CSV file
- Format: one row per policy, client info repeated on each row (system deduplicates clients automatically)
- Column mapping: auto-detect from headers + manual adjust before import
- Error handling: preview all rows with errors highlighted, user can fix inline or skip individual rows before committing
- Duplicate detection: auto-skip duplicates, but show flagged duplicates in import summary so agent can handle manually
- Downloadable CSV template with expected headers and 1-2 example rows
- Import page accessible from settings or a dedicated route

#### Performance targets
- 2-second load target for ALL pages (dashboard, client list, policies, tasks, expenses, analytics) at 200-client scale
- Claude to profile and identify specific bottlenecks rather than guessing
- Optimize queries, add pagination/virtualization where needed

#### Mobile & UX polish
- Must work on mobile -- all pages usable on mobile screens -- but desktop experience is primary and must not be compromised
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

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Summary

Phase 7 is a three-part effort: (1) analytics dashboards with charts, reports, cross-sell intelligence, and CSV/PDF export; (2) CSV import for bulk client+policy data; and (3) performance optimization and UX polish across the entire app.

The analytics work builds on Recharts v3 (already installed at ^3.7.0) and the existing Prisma query patterns. The backend needs new analytics endpoints that use `groupBy`, `aggregate`, and `count` with manual tenantId (since the tenant extension only overrides findMany/findFirst/create/update/delete). The frontend adds a new /analytics route with tabbed sections using the existing Radix Tabs component. CSV and PDF export are client-side operations using PapaParse (for CSV generation) and jsPDF + jspdf-autotable (for PDF table generation).

CSV import requires a multi-step wizard on the frontend with PapaParse for parsing and a new NestJS endpoint that accepts the parsed, validated rows as JSON (not raw file upload -- parse client-side for preview/mapping). Cross-sell intelligence is a rule-based system using predefined product bundles and a minimum policy count threshold. Performance optimization involves profiling actual query performance and applying targeted fixes (indexes, query optimization, pagination).

**Primary recommendation:** Build analytics as a new NestJS module with dedicated aggregation endpoints, use Recharts v3 (already installed) for all charts, PapaParse + jsPDF for export, and PapaParse for import parsing client-side with JSON submission to the API.

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Recharts | ^3.7.0 | All chart types (pie, bar, line, area) | Already in project from Phase 5; proven pattern with ResponsiveContainer + HSL chart colors |
| @tanstack/react-table | ^8.21.3 | Analytics detail tables with sorting/filtering | Already installed; used for existing table views |
| date-fns | ^4.1.0 | Date range calculations, period grouping | Already in both web and API; used extensively |
| Radix Tabs | (via radix-ui ^1.4.3) | Analytics page tab sections | Already installed; used in client profile, expenses |

### New Dependencies (Web)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| papaparse | ^5.5.3 | CSV parsing (import) and CSV generation (export) | Import wizard + CSV export buttons |
| @types/papaparse | ^5.5.2 | TypeScript types for PapaParse | Dev dependency |
| jspdf | latest | PDF document generation | PDF export from analytics reports |
| jspdf-autotable | ^5.0.7 | PDF table generation plugin | Structured report tables in PDF |

### New Dependencies (API)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | -- | -- | CSV parsing is done client-side; API receives JSON |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| jsPDF | @react-pdf/renderer | react-pdf is more React-native but heavier; jsPDF + autotable is simpler for tabular report exports and lighter bundle |
| Client-side CSV parse | Server-side Multer + csv-parse | Client-side allows preview/mapping UI before submission; server-side would require upload-parse-respond-map-resubmit flow |
| PapaParse for CSV export | Manual string building | PapaParse handles escaping, quoting, and edge cases correctly |

**Installation:**
```bash
pnpm --filter web add papaparse jspdf jspdf-autotable
pnpm --filter web add -D @types/papaparse
```

## Architecture Patterns

### Backend: Analytics Module Structure
```
apps/api/src/analytics/
  analytics.module.ts       # NestJS module
  analytics.controller.ts   # Endpoints for each report type
  analytics.service.ts      # Query logic with Prisma groupBy/aggregate
  dto/
    analytics-query.dto.ts  # Date range + filter DTOs
```

### Backend: Import Module Structure
```
apps/api/src/import/
  import.module.ts          # NestJS module
  import.controller.ts      # POST /api/import/clients-policies
  import.service.ts         # Validation, dedup, batch create
  dto/
    import-row.dto.ts       # Row shape DTO
```

### Frontend: Analytics Page Structure
```
apps/web/src/app/(dashboard)/analytics/
  page.tsx                  # Main analytics page with tabs
apps/web/src/components/analytics/
  analytics-overview-tab.tsx     # Summary cards + overview charts
  analytics-clients-tab.tsx      # Client breakdown
  analytics-policies-tab.tsx     # Policy type breakdown, premium report
  analytics-renewals-tab.tsx     # Renewal pipeline stacked bar
  analytics-expenses-tab.tsx     # Expense report, budget summary
  analytics-compliance-tab.tsx   # Compliance event summary
  analytics-crosssell-tab.tsx    # Cross-sell intelligence
  time-range-selector.tsx        # Shared date range picker component
  chart-card.tsx                 # Reusable card wrapper for charts
  export-buttons.tsx             # CSV + PDF export button group
```

### Frontend: Import Page Structure
```
apps/web/src/app/(dashboard)/settings/import/
  page.tsx                  # Import wizard page
apps/web/src/components/import/
  import-wizard.tsx         # Multi-step wizard container
  file-upload-step.tsx      # Step 1: File upload + parse
  column-mapping-step.tsx   # Step 2: Map CSV columns to fields
  preview-step.tsx          # Step 3: Preview rows, fix errors
  import-summary.tsx        # Step 4: Results summary
```

### Pattern 1: Analytics API with Date Range Filtering
**What:** Every analytics endpoint accepts startDate/endDate query params for time range filtering
**When to use:** All analytics report endpoints
**Example:**
```typescript
// analytics.controller.ts
@Get('policy-breakdown')
async getPolicyBreakdown(
  @TenantId() tenantId: string,
  @Query() query: AnalyticsQueryDto,
) {
  return this.analyticsService.getPolicyBreakdown(tenantId, query);
}

// analytics.service.ts
async getPolicyBreakdown(tenantId: string, query: AnalyticsQueryDto) {
  const where: any = { tenantId };
  if (query.startDate) where.startDate = { gte: new Date(query.startDate) };
  if (query.endDate) {
    where.startDate = { ...where.startDate, lte: new Date(query.endDate) };
  }

  // groupBy requires raw prisma (not tenantClient) with manual tenantId
  const breakdown = await this.prisma.policy.groupBy({
    by: ['type'],
    where,
    _count: { id: true },
    _sum: { premium: true },
  });

  return breakdown.map(item => ({
    type: item.type,
    count: item._count.id,
    totalPremium: Number(item._sum.premium ?? 0),
  }));
}
```

### Pattern 2: Cross-Sell Rule Engine
**What:** Simple rule-based coverage gap detection using predefined bundles
**When to use:** Cross-sell analytics tab and client profile badge
**Example:**
```typescript
// Cross-sell bundle definitions (in shared constants)
const CROSS_SELL_BUNDLES = [
  { name: 'Auto + Home', types: ['auto', 'home'] },
  { name: 'Life + Disability', types: ['life', 'health'] },
  { name: 'Home + Umbrella', types: ['home', 'umbrella'] },
] as const;

const MIN_POLICY_TYPES = 2;

// Service logic
async getCrossSellOpportunities(tenantId: string) {
  const clients = await this.prisma.client.findMany({
    where: { tenantId, status: 'client' },
    include: {
      policies: {
        where: { status: { in: ['active', 'pending_renewal'] } },
        select: { type: true },
      },
    },
  });

  return clients.map(client => {
    const activeTypes = [...new Set(client.policies.map(p => p.type))];
    const gaps: string[] = [];

    // Check each bundle
    for (const bundle of CROSS_SELL_BUNDLES) {
      const hasAll = bundle.types.every(t => activeTypes.includes(t));
      const hasSome = bundle.types.some(t => activeTypes.includes(t));
      if (hasSome && !hasAll) {
        const missing = bundle.types.filter(t => !activeTypes.includes(t));
        gaps.push(...missing);
      }
    }

    // Flag clients with fewer than MIN_POLICY_TYPES
    const fewPolicies = activeTypes.length < MIN_POLICY_TYPES;

    return {
      clientId: client.id,
      clientName: `${client.firstName} ${client.lastName}`,
      activeTypes,
      gaps: [...new Set(gaps)],
      fewPolicies,
      hasGaps: gaps.length > 0 || fewPolicies,
    };
  }).filter(c => c.hasGaps);
}
```

### Pattern 3: Client-Side CSV Import with Preview
**What:** Parse CSV in browser with PapaParse, preview/map columns, then submit validated JSON to API
**When to use:** CSV import wizard
**Example:**
```typescript
// File parsing step
import Papa from 'papaparse';

function handleFile(file: File) {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      // results.data = array of objects keyed by header names
      // results.errors = array of {type, code, message, row}
      // results.meta.fields = array of header names
      setHeaders(results.meta.fields ?? []);
      setRows(results.data as Record<string, string>[]);
      setErrors(results.errors);
    },
  });
}

// Column mapping: map detected headers to expected fields
const EXPECTED_FIELDS = [
  { key: 'firstName', label: 'First Name', required: true },
  { key: 'lastName', label: 'Last Name', required: true },
  { key: 'email', label: 'Email', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'policyType', label: 'Policy Type', required: true },
  { key: 'carrier', label: 'Carrier', required: false },
  { key: 'policyNumber', label: 'Policy Number', required: false },
  { key: 'premium', label: 'Premium', required: false },
  { key: 'startDate', label: 'Start Date', required: false },
  { key: 'endDate', label: 'End Date', required: false },
  // ... more fields
];

// Auto-detect: fuzzy match CSV headers to expected field keys/labels
function autoMapColumns(csvHeaders: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const field of EXPECTED_FIELDS) {
    const match = csvHeaders.find(h =>
      h.toLowerCase().replace(/[_\s-]/g, '') ===
      field.key.toLowerCase().replace(/[_\s-]/g, '')
      || h.toLowerCase().includes(field.label.toLowerCase())
    );
    if (match) mapping[field.key] = match;
  }
  return mapping;
}
```

### Pattern 4: CSV and PDF Export
**What:** Export analytics data as CSV (PapaParse unparse) and PDF (jsPDF + autotable)
**When to use:** Export buttons on each analytics tab
**Example:**
```typescript
// CSV export
import Papa from 'papaparse';

function exportToCsv(data: Record<string, any>[], filename: string) {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// PDF export
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function exportToPdf(
  title: string,
  columns: string[],
  rows: (string | number)[][],
  filename: string,
) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-CA')}`, 14, 28);

  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 35,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [15, 23, 42] }, // slate-900
  });

  doc.save(`${filename}.pdf`);
}
```

### Pattern 5: Time Range Selector Component
**What:** Reusable time range selector with preset options
**When to use:** Top of analytics page, shared across all tabs
**Example:**
```typescript
type TimeRange = '3mo' | '6mo' | 'ytd' | '12mo' | 'all';

interface TimeRangeOption {
  value: TimeRange;
  label: string;
  getRange: () => { startDate: string; endDate: string } | null;
}

const TIME_RANGES: TimeRangeOption[] = [
  { value: '3mo', label: '3 Months', getRange: () => ({
    startDate: subMonths(new Date(), 3).toISOString(),
    endDate: new Date().toISOString(),
  })},
  { value: '6mo', label: '6 Months', getRange: () => ({...})},
  { value: 'ytd', label: 'YTD', getRange: () => ({
    startDate: startOfYear(new Date()).toISOString(),
    endDate: new Date().toISOString(),
  })},
  { value: '12mo', label: '12 Months', getRange: () => ({...})},
  { value: 'all', label: 'All Time', getRange: () => null },
];
```

### Anti-Patterns to Avoid
- **Fetching all data client-side for aggregation:** Always aggregate in the API via Prisma groupBy/aggregate. Do NOT fetch all policies to the frontend and count them in JS.
- **Using tenantClient for groupBy/aggregate/count:** The tenant extension does NOT override these methods. Always use raw `this.prisma` with manual `where: { tenantId }`.
- **Server-side CSV parsing for import:** Parse in the browser to enable column mapping preview. Submit validated JSON, not raw files.
- **Building a custom chart wrapper library:** Use Recharts components directly with the existing HSL chart color CSS variables pattern.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSV parsing | Custom string splitter | PapaParse | Handles quoting, escaping, multiline values, BOM, encoding detection |
| CSV generation | String concatenation | PapaParse.unparse() | Proper escaping of commas, quotes, newlines in values |
| PDF table generation | Canvas/SVG to PDF | jsPDF + jspdf-autotable | Handles pagination, column widths, text wrapping, page breaks |
| Date range calculation | Manual date math | date-fns (subMonths, startOfYear, etc.) | Timezone-safe, DST-aware, already in project |
| Chart responsive sizing | CSS width/height | Recharts ResponsiveContainer | Handles resize events, debouncing, container measurement |
| Column auto-mapping | Exact string matching | Fuzzy normalized comparison | Users may have "First Name", "first_name", "FirstName", "fname" etc. |
| Duplicate client detection | Exact email match only | Normalized name + email combination | Same client may appear as "John Smith" and "john smith" |

**Key insight:** CSV parsing and PDF generation have many edge cases (encoding, special characters, page breaks, column overflow). Libraries handle these; custom code will break on real-world data.

## Common Pitfalls

### Pitfall 1: Prisma Decimal Serialization in Aggregates
**What goes wrong:** `_sum.premium` returns a Prisma Decimal object, not a number. Sending it directly to the frontend causes JSON serialization issues or NaN in charts.
**Why it happens:** Prisma wraps Decimal columns in a Decimal.js object for precision. The tenant extension only affects findMany/findFirst/etc, so aggregate results bypass the extension.
**How to avoid:** Always `Number(result._sum.premium ?? 0)` when extracting aggregate Decimal values. This is already the pattern in `dashboard.service.ts` -- follow it consistently.
**Warning signs:** NaN appearing in chart data or "[object Object]" in table cells.

### Pitfall 2: groupBy Requires Manual tenantId
**What goes wrong:** Using `this.prisma.tenantClient.policy.groupBy()` fails or returns cross-tenant data because groupBy is not overridden by the tenant extension.
**Why it happens:** The tenant extension only overrides findMany, findFirst, create, update, delete. Methods like count(), aggregate(), groupBy() pass through to raw PrismaClient.
**How to avoid:** Always use `this.prisma.policy.groupBy({ where: { tenantId } })` (raw prisma + manual tenantId). This is the established pattern from dashboard.service.ts and compliance.service.ts.
**Warning signs:** Missing tenantId in where clause of groupBy/aggregate/count.

### Pitfall 3: Large CSV Import Memory Pressure
**What goes wrong:** Importing a 10,000+ row CSV file into the browser causes the page to freeze during parsing or the API request to time out.
**Why it happens:** PapaParse loads the entire parsed result into memory. The API endpoint tries to create thousands of records in a single transaction.
**How to avoid:** (1) Use PapaParse `preview` option to show first 100 rows in preview; (2) Batch API submissions in chunks of 50-100 rows; (3) Use `$transaction` with batched createMany for database writes; (4) For MVP at 200-client scale, this is unlikely to be an issue but the pattern should handle it.
**Warning signs:** Browser tab becoming unresponsive during import, API 504 timeout errors.

### Pitfall 4: Chart Color Consistency
**What goes wrong:** Charts use different color schemes across tabs, or dark mode breaks chart colors.
**Why it happens:** Hard-coded hex colors instead of using the CSS variable pattern.
**How to avoid:** Follow the existing pattern from `expense-donut-chart.tsx`: use `hsl(var(--chart-1))` through `hsl(var(--chart-5))` for chart colors. These CSS variables are defined in globals.css and support dark mode.
**Warning signs:** Charts that look fine in light mode but are invisible or clashing in dark mode.

### Pitfall 5: Time Zone Issues in Date Range Queries
**What goes wrong:** Analytics for "this month" excludes today's data or includes yesterday's data from a different timezone.
**Why it happens:** JavaScript Date uses UTC by default, but Prisma date comparisons depend on the database timezone setting.
**How to avoid:** Use `startOfDay(new Date())` from date-fns for range boundaries, consistent with the existing `dashboard.service.ts` pattern. Send ISO strings from frontend, parse to Date in the API.
**Warning signs:** Edge-of-day records appearing in the wrong period.

### Pitfall 6: PDF Export Bundle Size
**What goes wrong:** jsPDF + autotable adds significant bundle size to the initial page load.
**Why it happens:** Importing jsPDF at the top level includes it in the main bundle.
**How to avoid:** Use dynamic imports: `const { default: jsPDF } = await import('jspdf')` and `const { default: autoTable } = await import('jspdf-autotable')` only when the user clicks the PDF export button.
**Warning signs:** Increased initial page load time, large JS bundle warnings from Next.js.

### Pitfall 7: Import Deduplication False Positives
**What goes wrong:** The system marks legitimate distinct clients as duplicates because they share a common name.
**Why it happens:** Deduplication based on name alone without considering additional fields.
**How to avoid:** Use a composite key for deduplication: normalized(firstName + lastName + email). If email is missing, fall back to normalized(firstName + lastName + phone). Show flagged duplicates in the summary for manual review rather than silently skipping.
**Warning signs:** Users reporting "missing" imported clients that were silently deduplicated.

## Code Examples

### Recharts Stacked Bar Chart (Renewal Pipeline)
```typescript
// Source: Existing project pattern (expense-donut-chart.tsx) + Recharts docs
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const CHART_COLORS = {
  active: 'hsl(var(--chart-1))',
  expiring: 'hsl(var(--chart-2))',
  expired: 'hsl(var(--chart-3))',
};

interface RenewalPipelineData {
  month: string; // "Jan 2026"
  active: number;
  expiring: number;
  expired: number;
}

function RenewalPipelineChart({ data }: { data: RenewalPipelineData[] }) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="month" className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius)',
          }}
        />
        <Legend />
        <Bar dataKey="active" stackId="a" fill={CHART_COLORS.active} name="Active" />
        <Bar dataKey="expiring" stackId="a" fill={CHART_COLORS.expiring} name="Expiring" />
        <Bar dataKey="expired" stackId="a" fill={CHART_COLORS.expired} name="Expired" />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

### Recharts Donut/Pie Chart (Policy Type Breakdown)
```typescript
// Source: Existing expense-donut-chart.tsx pattern (already working in project)
import { PieChart, Pie, Cell, Label, ResponsiveContainer, Tooltip } from 'recharts';

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

// Follow the exact pattern from ExpenseDonutChart:
// - ResponsiveContainer wrapper
// - innerRadius/outerRadius for donut
// - Cell per data point with modulo color index
// - Label for center text
// - Custom tooltip with popover styling
```

### Prisma Analytics Query Pattern
```typescript
// Source: Existing dashboard.service.ts + Prisma docs
// All analytics queries use raw this.prisma with manual tenantId

// Policy count by type
async getPolicyTypeBreakdown(tenantId: string, startDate?: Date, endDate?: Date) {
  const where: any = {
    tenantId,
    status: { in: ['active', 'pending_renewal', 'renewed'] },
  };
  if (startDate) where.createdAt = { ...where.createdAt, gte: startDate };
  if (endDate) where.createdAt = { ...where.createdAt, lte: endDate };

  return this.prisma.policy.groupBy({
    by: ['type'],
    where,
    _count: { id: true },
    _sum: { premium: true },
  });
}

// Renewal pipeline by month
async getRenewalPipeline(tenantId: string, months: number = 12) {
  const now = new Date();
  const periods = [];

  for (let i = 0; i < months; i++) {
    const monthStart = startOfMonth(subMonths(now, months - 1 - i));
    const monthEnd = endOfMonth(subMonths(now, months - 1 - i));

    const [active, expiring, expired] = await Promise.all([
      this.prisma.policy.count({
        where: {
          tenantId,
          status: 'active',
          startDate: { lte: monthEnd },
          OR: [
            { endDate: null },
            { endDate: { gte: monthStart } },
          ],
        },
      }),
      this.prisma.policy.count({
        where: {
          tenantId,
          status: { in: ['pending_renewal'] },
          endDate: { gte: monthStart, lte: monthEnd },
        },
      }),
      this.prisma.policy.count({
        where: {
          tenantId,
          status: 'expired',
          endDate: { gte: monthStart, lte: monthEnd },
        },
      }),
    ]);

    periods.push({
      month: format(monthStart, 'MMM yyyy'),
      active,
      expiring,
      expired,
    });
  }

  return periods;
}
```

### Import Batch Create with Deduplication
```typescript
// Source: Existing project Prisma patterns
async importClientsAndPolicies(
  tenantId: string,
  userId: string,
  rows: ImportRowDto[],
) {
  // Step 1: Group rows by client (deduplicate by normalized name+email)
  const clientMap = new Map<string, { client: any; policies: any[] }>();

  for (const row of rows) {
    const key = normalizeKey(row.firstName, row.lastName, row.email);
    if (!clientMap.has(key)) {
      clientMap.set(key, {
        client: { firstName: row.firstName, lastName: row.lastName, ... },
        policies: [],
      });
    }
    clientMap.get(key)!.policies.push({
      type: row.policyType,
      carrier: row.carrier,
      ...
    });
  }

  // Step 2: Check for existing clients in DB (duplicate detection)
  const existingClients = await this.prisma.client.findMany({
    where: { tenantId },
    select: { id: true, firstName: true, lastName: true, email: true },
  });

  // Step 3: Batch create in transaction
  const results = await this.prisma.$transaction(async (tx) => {
    const created = { clients: 0, policies: 0, skipped: 0, duplicates: [] };

    for (const [key, { client, policies }] of clientMap) {
      // Check if existing
      const existing = existingClients.find(e =>
        normalizeKey(e.firstName, e.lastName, e.email) === key
      );

      let clientId: string;
      if (existing) {
        clientId = existing.id;
        created.duplicates.push({ ...client, existingId: existing.id });
      } else {
        const newClient = await tx.client.create({
          data: { ...client, tenantId, createdById: userId, status: 'client' },
        });
        clientId = newClient.id;
        created.clients++;
      }

      // Create policies for this client
      for (const policy of policies) {
        await tx.policy.create({
          data: { ...policy, tenantId, clientId, createdById: userId, status: 'active' },
        });
        created.policies++;
      }
    }

    return created;
  });

  return results;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Chart.js | Recharts v3 | 2024 | Already using Recharts v3; it rewrote internal state management for better performance |
| Server-side PDF (puppeteer) | Client-side jsPDF | Standard | No server-side Chrome needed; lighter, faster |
| Raw file upload + server parse | Client-side parse + JSON submit | Best practice for wizards | Enables preview/mapping UI before committing |
| Recharts v2 activeShape prop | Recharts v3 isActive callback | v3.0 | activeShape on Pie is deprecated; use isActive prop |

**Deprecated/outdated:**
- Recharts v2 `activeShape` prop on Pie: replaced with `isActive` callback in v3
- `reverseStackOrder` was added in v3 to fix a regression from v2 for stacked bars

## Existing Codebase Patterns (Critical for Consistency)

These patterns are established across Phases 2-6 and MUST be followed:

| Pattern | Location | Used In |
|---------|----------|---------|
| HSL chart colors via CSS vars | `expense-donut-chart.tsx` | `hsl(var(--chart-1))` through `--chart-5` |
| Three-state component (loading/empty/data) | `financial-widget.tsx` | Skeleton -> empty -> data pattern |
| Manual tenantId for count/aggregate | `dashboard.service.ts` | All count(), aggregate(), groupBy() calls |
| Decimal-as-string from Prisma | `policy.ts` types | `Number()` conversion only at display/aggregation |
| Sub-navigation tabs | `expenses/page.tsx` | Link-based tab navigation with `usePathname` for active state |
| Radix Tabs for in-page sections | `clients/[id]/page.tsx` | TabsList + TabsTrigger + TabsContent |
| API response with pagination | `clients.service.ts` | `{ data, total, page, limit, totalPages }` |
| Currency formatting | `financial-widget.tsx` | `new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' })` |
| Skeleton loading | `ui/skeleton.tsx` | Used across all loading states |
| NAV_ITEMS in shared constants | `constants/roles.ts` | Add 'analytics' entry here |

## Cross-Sell Bundle Definitions

Based on Canadian insurance industry standard product pairings:

```typescript
// Recommended constants for @anchor/shared
export const CROSS_SELL_BUNDLES = [
  {
    name: 'Auto + Home',
    types: ['auto', 'home'] as const,
    description: 'Most common Canadian insurance bundle',
  },
  {
    name: 'Life + Health',
    types: ['life', 'health'] as const,
    description: 'Personal protection bundle',
  },
  {
    name: 'Home + Umbrella',
    types: ['home', 'umbrella'] as const,
    description: 'Enhanced liability protection',
  },
] as const;

export const MIN_POLICY_TYPES_FOR_CROSSSELL = 2;
```

Note: The user specified "Life+Disability" but the schema uses `health` as the type (not disability). The Life+Health pairing is the closest match.

## Analytics Tab Recommendations (Claude's Discretion)

### Overview Tab
- 4 summary cards: Total Clients, Active Policies, Total Premium (YTD), Renewal Rate
- Policy type donut chart (existing pattern)
- Line chart showing new clients/policies over time (Recharts LineChart)

### Clients Tab
- Client count by status (lead vs client) -- simple stat cards
- Client growth line chart (new clients per month)
- Table: client list with policy counts and total premium
- Exportable as CSV/PDF

### Policies Tab
- Policy type breakdown donut chart
- Premium by product line bar chart (horizontal)
- Policy sub-type drill-down table (e.g., Auto -> Comprehensive, Collision, etc. uses customType)
- Status breakdown cards (active, expired, pending renewal counts)

### Renewals Tab
- Stacked bar chart: monthly view of active/expiring/expired
- Upcoming renewals list (next 90 days)
- Renewal rate metric (renewed / total expiring)

### Expenses Tab
- Expense by category donut chart (reuse existing ExpenseDonutChart pattern)
- Monthly expense trend line chart
- Budget vs actual bar chart
- Summary stats: total approved, pending, average expense

### Compliance Tab
- Activity event counts by type bar chart
- Timeline density chart (events per day/week)
- Per-user activity summary table

### Cross-Sell Tab
- Summary cards: "X clients missing Home", "Y clients missing Life", etc.
- Gap coverage matrix table
- Cross-sell badge indicator for client profiles: small icon/tooltip showing gaps

## Performance Optimization Strategy

### What to Profile (Don't Guess)
1. Use browser DevTools Network tab to measure actual page load times
2. Check Prisma query logs for slow queries (`prisma.$on('query')`)
3. Identify N+1 query patterns in existing endpoints
4. Measure bundle size with `next build` output

### Known Optimization Targets
| Area | Likely Optimization | Why |
|------|-------------------|-----|
| Client list with policies | Add `_count` include instead of fetching all policies | Current pattern fetches all policy records just to get count and next renewal |
| Analytics groupBy queries | Batch parallel queries with Promise.all | Multiple groupBy calls for same dataset can be parallelized |
| PDF export | Dynamic import | Don't load jsPDF until user clicks export |
| Chart rendering | `useMemo` for data transformation | Prevent re-computing chart data on every render |
| Large table rendering | Virtual scrolling or pagination | Cross-sell table may have hundreds of rows |
| Bundle size | Next.js dynamic imports for analytics page | Analytics is a power-user feature; lazy-load charts |

### Existing Indexes (Already in Schema)
The Prisma schema already has appropriate indexes for most analytics queries:
- `@@index([tenantId])` on all models
- `@@index([tenantId, status])` on policies, tasks, expenses
- `@@index([tenantId, date])` on expenses
- `@@index([tenantId, createdAt(sort: Desc)])` on activity_events
- `@@index([clientId])` on policies

**Potential new indexes needed:**
- `@@index([tenantId, type])` on policies (for groupBy type queries) -- this does NOT exist yet
- Consider if `@@index([tenantId, endDate])` on policies would help renewal pipeline queries

## Mobile Responsive Strategy

### Breakpoints
Use Tailwind default breakpoints (already configured):
- `sm` (640px): Mobile landscape
- `md` (768px): Tablet
- `lg` (1024px): Desktop

### Key Responsive Patterns
1. **Charts:** ResponsiveContainer already handles resize. On mobile, reduce chart height (200px instead of 350px).
2. **Summary cards:** Grid goes from `grid-cols-1` on mobile to `grid-cols-2 md:grid-cols-4`.
3. **Tables:** Add horizontal scroll wrapper (`overflow-x-auto`) on mobile. Consider card view for key tables.
4. **Analytics tabs:** TabsList should scroll horizontally on mobile (`overflow-x-auto flex-nowrap`).
5. **Import wizard:** Single column on mobile, side-by-side on desktop.
6. **Export buttons:** Stack vertically on mobile.

## Open Questions

1. **Policy sub-type drill-down data**
   - What we know: The `customType` field is free-text for `type: 'other'`. For standard types (auto, home, life, etc.), there is no sub-type field.
   - What's unclear: Premium report "by product line and policy sub-type" -- sub-types only exist for `other` type policies via customType.
   - Recommendation: Group by `type` as the primary level. For `other` type, break down by `customType`. For standard types, there are no sub-types to drill into -- show them as flat categories. The "sub-type" in the premium report effectively means grouping by `type` with `customType` as a secondary grouper.

2. **Import data validation strictness**
   - What we know: CSV import should validate rows and highlight errors for user review.
   - What's unclear: Should policyType values be strictly matched against the enum, or should fuzzy matching be allowed (e.g., "Automobile" -> "auto")?
   - Recommendation: Implement lenient parsing with a mapping table: `{ automobile: 'auto', car: 'auto', house: 'home', homeowners: 'home', ... }`. Show a warning (not error) for unrecognized types, defaulting to 'other'.

3. **Analytics endpoint count vs. aggregation approach**
   - What we know: The renewal pipeline needs counts per month for 12 months, which could be 36+ individual queries.
   - What's unclear: Whether this will be performant at scale.
   - Recommendation: For MVP at 200-client scale, individual queries are fine. If profiling shows slowness, consolidate to raw SQL with `GROUP BY date_trunc('month', end_date)`. Start with Prisma queries and optimize only if needed.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `expense-donut-chart.tsx`, `financial-widget.tsx`, `dashboard.service.ts` -- verified Recharts v3 pattern and Prisma query patterns
- Existing codebase: `schema.prisma` -- verified all model structures, indexes, relations
- Existing codebase: `constants/insurance.ts`, `constants/roles.ts` -- verified POLICY_TYPES and NAV_ITEMS structures
- Existing codebase: `package.json` files -- verified Recharts ^3.7.0, @tanstack/react-table ^8.21.3 already installed

### Secondary (MEDIUM confidence)
- [Recharts Stacked Bar Chart Examples](https://recharts.github.io/en-US/examples/StackedBarChart/) -- API for BarChart + Bar with stackId
- [PapaParse Documentation](https://www.papaparse.com/docs) -- header parsing, error handling, preview mode
- [jspdf-autotable npm](https://www.npmjs.com/package/jspdf-autotable) -- v5.0.7, table generation API
- [Prisma Aggregation Docs](https://www.prisma.io/docs/orm/prisma-client/queries/aggregation-grouping-summarizing) -- groupBy, aggregate API

### Tertiary (LOW confidence)
- Cross-sell bundle definitions (Auto+Home, Life+Disability, Home+Umbrella) -- based on general Canadian insurance industry knowledge, not verified against a specific source
- jsPDF/autotable import pattern -- `import autoTable from 'jspdf-autotable'` may need `import { autoTable }` depending on module system; verify at build time

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Recharts already in project, PapaParse and jsPDF are industry-standard mature libraries
- Architecture: HIGH -- Follows established patterns from Phases 2-6 (NestJS module structure, Prisma query patterns, React component patterns)
- Pitfalls: HIGH -- All pitfalls derived from documented project issues (Decimal serialization, tenantClient limitations, bundle size)
- Cross-sell logic: MEDIUM -- Bundle definitions are reasonable but user-defined; rule engine pattern is straightforward
- Performance: MEDIUM -- Optimization targets are educated guesses; actual profiling needed to confirm bottlenecks

**Research date:** 2026-02-23
**Valid until:** 2026-03-23 (30 days -- stable libraries, established patterns)

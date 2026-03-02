# Phase 8: Scheduled Emails & Client Communications - Research

**Researched:** 2026-03-01
**Domain:** Cron-based email automation, ZeptoMail transactional email API, React Email templates, Prisma date queries
**Confidence:** HIGH

## Summary

Phase 8 adds four features to the Anchor MVP: automated birthday emails, configurable renewal reminder emails to clients, bulk email to clients, and email send history tracking. The existing codebase already has a solid foundation: three cron schedulers (renewals at 1AM, recurring expenses at 2AM, daily digest at 8AM), ZeptoMail integration via plain fetch, React Email TSX templates with `@react-email/render`, and the `notifications.service.ts` pattern for iterating across tenants.

The critical discovery is that **ZeptoMail explicitly prohibits bulk/promotional emails** -- it is a transactional-only service. The "bulk email" feature must be carefully scoped as operational/service communication (e.g., agency announcements to existing clients), NOT marketing campaigns. ZeptoMail's batch API endpoint (`/v1.1/email/batch`) supports up to 500 recipients per call with merge fields for personalization, which is sufficient for individual agency client lists.

Birthday emails require a raw SQL query using PostgreSQL's `EXTRACT()` function since Prisma's standard filters cannot match month+day while ignoring year. Renewal reminder emails to clients are distinct from the existing renewal TASKS (which are for agents) -- they need the tenant-level configuration model to let admins toggle which intervals are active. A new `EmailLog` Prisma model is needed to track all sent emails for the history feature.

**Primary recommendation:** Extend the existing NotificationsService with dedicated methods for each email type, add new cron jobs at staggered times, use `$queryRaw` for birthday matching, create a TenantEmailSettings model for renewal reminder configuration, and add an EmailLog model for tracking all outbound client emails.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already Installed -- Zero New Dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@nestjs/schedule` | ^6.1.1 | Cron job scheduling | Already used for 3 existing cron jobs; `@Cron` decorator with timezone support |
| `@react-email/components` | ^1.0.7 | Email template components | Already used for daily-digest.tsx; React component-based email design |
| `@react-email/render` | ^2.0.4 | TSX-to-HTML rendering | Already used; `await render(Component(props))` pattern established |
| `date-fns` | ^4.1.0 | Date manipulation | Already used in notifications and renewals services |
| ZeptoMail REST API | v1.1 | Email delivery | Already integrated via plain `fetch()` in notifications.service.ts |
| Prisma | ^6.19.2 | Database ORM + raw queries | Already used everywhere; `$queryRaw` needed for birthday matching |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `class-validator` | ^0.14.3 | DTO validation | Validating email composition input (subject, body, recipient filters) |
| `class-transformer` | ^0.5.1 | DTO transformation | Transform incoming bulk email DTOs |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ZeptoMail batch API | Individual sends in a loop | Loop is simpler but slower; batch API handles up to 500 recipients in one call |
| `$queryRaw` for birthdays | Storing month/day as separate columns | Separate columns avoid raw SQL but require schema change and data migration |
| New EmailLog model | Storing in ActivityEvent | ActivityEvent is client-scoped; EmailLog needs tenant-wide queries and different fields |

**Installation:**
```bash
# No new dependencies required -- all libraries already installed
```

## Architecture Patterns

### Recommended Project Structure
```
apps/api/src/
├── notifications/
│   ├── notifications.module.ts          # Updated: add new providers
│   ├── notifications.service.ts         # Updated: add sendEmail() generic method, birthday/renewal email methods
│   ├── notifications.scheduler.ts       # Updated: add birthday + renewal reminder cron jobs
│   ├── emails/
│   │   ├── daily-digest.tsx             # Existing
│   │   ├── birthday-greeting.tsx        # NEW: birthday email template
│   │   ├── renewal-reminder.tsx         # NEW: renewal reminder to client template
│   │   └── bulk-announcement.tsx        # NEW: agency announcement template
│   └── dto/
│       └── send-bulk-email.dto.ts       # NEW: DTO for bulk email composition
├── communications/
│   ├── communications.module.ts         # NEW: handles bulk email + email history
│   ├── communications.controller.ts     # NEW: REST endpoints for compose/send/history
│   └── communications.service.ts        # NEW: bulk email logic + email log queries
packages/database/prisma/
└── schema.prisma                        # Updated: add EmailLog model, TenantEmailSettings model
packages/shared/src/
├── types/
│   └── communication.ts                 # NEW: EmailLog type, TenantEmailSettings type
└── index.ts                             # Updated: export new types
apps/web/src/
├── app/(dashboard)/settings/
│   └── communications/
│       └── page.tsx                     # NEW: renewal reminder toggle config (admin only)
└── app/(dashboard)/communications/
    ├── page.tsx                          # NEW: email history list
    └── compose/
        └── page.tsx                     # NEW: bulk email composer (admin only)
```

### Pattern 1: Cron Job for Tenant-Scoped Operations
**What:** Iterate all tenants, process each independently, catch errors per-tenant to avoid one failure stopping all
**When to use:** All new scheduled email jobs (birthday, renewal reminders)
**Example:**
```typescript
// Source: existing notifications.service.ts lines 46-76
async sendBirthdayEmailsForAllTenants(): Promise<void> {
  this.logger.log('Starting birthday emails for all tenants...');
  if (!this.zeptoApiKey) {
    this.logger.warn('ZeptoMail not configured. Skipping birthday emails.');
    return;
  }
  const tenants = await this.prisma.tenant.findMany({
    select: { id: true },
  });
  for (const tenant of tenants) {
    try {
      await this.sendBirthdayEmailsForTenant(tenant.id);
    } catch (error) {
      this.logger.error(`Birthday emails failed for tenant ${tenant.id}: ${error}`);
    }
  }
}
```

### Pattern 2: Birthday Date Matching via Raw SQL
**What:** Use PostgreSQL EXTRACT() to match month+day while ignoring year
**When to use:** Querying clients whose birthday is today
**Example:**
```typescript
// Source: Prisma GitHub Discussion #12286
async getClientsWithBirthdayToday(tenantId: string): Promise<Array<{ id: string; firstName: string; lastName: string; email: string }>> {
  const today = new Date();
  const month = today.getMonth() + 1; // JS months are 0-indexed
  const day = today.getDate();

  return this.prisma.$queryRaw`
    SELECT id, first_name AS "firstName", last_name AS "lastName", email
    FROM clients
    WHERE tenant_id = ${tenantId}::uuid
      AND date_of_birth IS NOT NULL
      AND email IS NOT NULL
      AND EXTRACT(MONTH FROM date_of_birth) = ${month}
      AND EXTRACT(DAY FROM date_of_birth) = ${day}
  `;
}
```

### Pattern 3: Idempotent Email Sending
**What:** Check EmailLog before sending to prevent duplicate emails on the same day
**When to use:** All automated emails (birthday, renewal reminders)
**Example:**
```typescript
// Idempotency: skip if already sent today
const existingLog = await this.prisma.emailLog.findFirst({
  where: {
    tenantId,
    clientId: client.id,
    type: 'birthday_greeting',
    sentAt: { gte: startOfDay(new Date()) },
  },
});
if (existingLog) {
  this.logger.debug(`Birthday email already sent to ${client.email} today`);
  return;
}
```

### Pattern 4: Generic Email Sending Method
**What:** Refactor the ZeptoMail fetch call into a reusable method
**When to use:** All email sending (birthday, renewal, bulk, digest)
**Example:**
```typescript
// Extract from existing sendDigestToUser, make generic
async sendEmail(params: {
  to: string;
  toName?: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!this.zeptoApiKey) {
    this.logger.warn('ZeptoMail not configured.');
    return { success: false, error: 'ZeptoMail not configured' };
  }
  const response = await fetch('https://api.zeptomail.com/v1.1/email', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Zoho-enczapikey ${this.zeptoApiKey}`,
    },
    body: JSON.stringify({
      from: { address: this.fromAddress, name: this.fromName },
      to: [{ email_address: { address: params.to, name: params.toName } }],
      subject: params.subject,
      htmlbody: params.html,
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    return { success: false, error: `${response.status}: ${body}` };
  }
  return { success: true };
}
```

### Pattern 5: Bulk Email via ZeptoMail Batch API
**What:** Use the `/v1.1/email/batch` endpoint for sending to multiple recipients at once
**When to use:** Bulk email feature (up to 500 recipients per call)
**Example:**
```typescript
// ZeptoMail batch API -- max 500 recipients per call
async sendBatchEmail(params: {
  recipients: Array<{ email: string; name?: string }>;
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!this.zeptoApiKey) return { success: false, error: 'Not configured' };

  // Chunk into batches of 500
  const BATCH_SIZE = 500;
  for (let i = 0; i < params.recipients.length; i += BATCH_SIZE) {
    const batch = params.recipients.slice(i, i + BATCH_SIZE);
    const response = await fetch('https://api.zeptomail.com/v1.1/email/batch', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Zoho-enczapikey ${this.zeptoApiKey}`,
      },
      body: JSON.stringify({
        from: { address: this.fromAddress, name: this.fromName },
        to: batch.map(r => ({
          email_address: { address: r.email, name: r.name },
        })),
        subject: params.subject,
        htmlbody: params.html,
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Batch email error: ${response.status}: ${body}`);
      return { success: false, error: `${response.status}: ${body}` };
    }
  }
  return { success: true };
}
```

### Anti-Patterns to Avoid
- **Sending emails synchronously in request handler:** Bulk email must be fire-and-forget or processed async. Never block an HTTP response waiting for 100+ emails to send.
- **Using Supabase REST API for database queries:** Always use Prisma. The codebase has established this pattern in all cron services.
- **Creating separate email service per email type:** Extend the existing NotificationsService with new methods rather than creating parallel services for each email type. Keep one service that owns the ZeptoMail connection.
- **Querying all clients without tenant scoping:** Every query MUST include `tenantId` in the WHERE clause. The cron jobs have no CLS context.
- **Skipping idempotency checks:** Without checking EmailLog, a server restart could cause duplicate birthday/renewal emails on the same day.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Birthday date matching | JavaScript filter over all clients | PostgreSQL `EXTRACT()` via `$queryRaw` | DB-level filtering is O(1) query vs loading entire client table into memory |
| Email HTML rendering | String template concatenation | React Email TSX templates + `render()` | Already established pattern; components are reusable, type-safe, previewable |
| Cron scheduling | Custom setTimeout/setInterval | `@nestjs/schedule` `@Cron` decorator | Already in use; handles timezone, named jobs, error resilience |
| Rate limiting emails | Custom delay/queue logic | ZeptoMail batch API (500/call) | ZeptoMail handles queuing internally; batch endpoint reduces API calls |
| Duplicate prevention | Ad-hoc flags/timestamps on Client model | EmailLog model with idempotency queries | Centralized, queryable, serves double duty as email history |

**Key insight:** The existing NotificationsService + React Email + ZeptoMail pattern is proven and handles all complexity. Every new email type follows the same send pattern -- the only new code is templates and data-fetching queries.

## Common Pitfalls

### Pitfall 1: ZeptoMail Prohibits Bulk/Marketing Emails
**What goes wrong:** Sending mass promotional emails through ZeptoMail gets the account flagged or suspended
**Why it happens:** ZeptoMail is explicitly a transactional email service. Their ToS prohibits bulk promotional/marketing emails.
**How to avoid:** Frame "bulk email" as operational/service communications (agency announcements, policy updates, important notices). NOT newsletters or marketing campaigns. Keep volume reasonable (agency client lists are typically <500). If the agency needs marketing email, that is a separate product (Zoho Campaigns or similar).
**Warning signs:** ZeptoMail returns error codes or suspends the agent token; emails landing in spam

### Pitfall 2: Birthday Query Ignoring Timezone
**What goes wrong:** Birthday emails sent on the wrong day because the server is in UTC but the agency is in Toronto (ET)
**Why it happens:** `new Date()` returns UTC time. At 11PM ET = 4AM UTC next day, so the month/day extraction could be off by one day.
**How to avoid:** Use the Toronto timezone explicitly when extracting today's date for birthday matching. Use `date-fns-tz` or manually adjust:
```typescript
// Use the same timezone as the cron job
const torontoNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Toronto' }));
const month = torontoNow.getMonth() + 1;
const day = torontoNow.getDate();
```
**Warning signs:** Users report birthday emails arriving a day early or late

### Pitfall 3: Client Email is Optional
**What goes wrong:** Attempting to send email to a client with no email address causes errors
**Why it happens:** `Client.email` is `String?` (nullable) in the schema. Some clients may not have email addresses.
**How to avoid:** Always filter `email IS NOT NULL` and `email != ''` in queries that feed email sending. The birthday raw SQL query already includes this. Renewal reminder queries must do the same.
**Warning signs:** ZeptoMail API errors about invalid/empty email addresses

### Pitfall 4: Duplicate Emails on Server Restart
**What goes wrong:** Cron job runs, server restarts mid-process, cron runs again and sends duplicates
**Why it happens:** Without tracking what was already sent, there's no idempotency
**How to avoid:** Log every sent email to `EmailLog` BEFORE or immediately AFTER successful send. Check for existing log entries before sending. Use `sentAt >= startOfDay(today)` as the idempotency key.
**Warning signs:** Clients receiving multiple birthday or renewal emails in one day

### Pitfall 5: Raw SQL Column Names vs Prisma Model Names
**What goes wrong:** `$queryRaw` returns columns with database names (snake_case) not Prisma names (camelCase)
**Why it happens:** `$queryRaw` bypasses Prisma's mapping. The `clients` table uses `first_name` but the Prisma model uses `firstName`.
**How to avoid:** Use SQL aliases in the raw query: `SELECT first_name AS "firstName"`. The double quotes are needed in PostgreSQL for case-sensitive aliases.
**Warning signs:** Properties undefined on query results; TypeScript types say field exists but runtime value is undefined

### Pitfall 6: Renewal Reminder Emails vs Renewal Tasks Confusion
**What goes wrong:** Implementing renewal emails that duplicate the existing task system rather than complementing it
**Why it happens:** Phase 3 already creates renewal TASKS at 60/30/7 days for agents. Phase 8 adds renewal EMAILS to clients at those same intervals.
**How to avoid:** Make a clear distinction: Tasks are for agents (internal workflow). Emails are for clients (external communication). The email cron should be separate from the task cron. Use the same interval constants (60/30/7) but check the `TenantEmailSettings` config for which intervals are enabled for email.
**Warning signs:** Agents getting confused between task notifications and client emails; clients receiving emails that are meant for agents

### Pitfall 7: Bulk Email Blocking HTTP Response
**What goes wrong:** Admin composes and sends bulk email to 300 clients; the request times out
**Why it happens:** Sending 300 emails takes time, even with batch API. If done synchronously in the request handler, the HTTP connection times out.
**How to avoid:** Accept the compose request, validate it, create EmailLog entries with status "queued", return 202 Accepted immediately, then process sending in the background. Alternatively, for MVP simplicity with small client lists (<500), use the batch API which sends in one API call and should return quickly. Log the result after.
**Warning signs:** 504 Gateway Timeout on bulk send; frontend spinner never resolves

## Code Examples

Verified patterns from official sources:

### Staggered Cron Schedule (following existing pattern)
```typescript
// Source: existing codebase pattern (renewals 1AM, expenses 2AM, digest 8AM)
// Birthday emails: 7:30 AM Toronto time (before digest at 8AM)
@Cron('0 30 7 * * *', { timeZone: 'America/Toronto' })
async handleBirthdayEmails(): Promise<void> {
  this.logger.log('Birthday email cron triggered');
  try {
    await this.notificationsService.sendBirthdayEmailsForAllTenants();
  } catch (error) {
    this.logger.error(`Birthday email cron failed: ${error}`);
  }
}

// Renewal reminder emails: 7:00 AM Toronto time
@Cron('0 0 7 * * *', { timeZone: 'America/Toronto' })
async handleRenewalReminderEmails(): Promise<void> {
  this.logger.log('Renewal reminder email cron triggered');
  try {
    await this.notificationsService.sendRenewalReminderEmailsForAllTenants();
  } catch (error) {
    this.logger.error(`Renewal reminder email cron failed: ${error}`);
  }
}
```

### React Email Birthday Template
```tsx
// Source: existing daily-digest.tsx pattern
import * as React from 'react';
import {
  Html, Head, Body, Container, Section, Text, Heading, Preview,
} from '@react-email/components';

export interface BirthdayEmailData {
  clientName: string;
  agencyName: string;
}

export function BirthdayGreetingEmail({ clientName, agencyName }: BirthdayEmailData) {
  return (
    <Html>
      <Head />
      <Preview>Happy Birthday, {clientName}!</Preview>
      <Body style={{ backgroundColor: '#f6f9fc', fontFamily: 'sans-serif' }}>
        <Container style={{ backgroundColor: '#fff', maxWidth: '600px', margin: '0 auto', padding: '32px' }}>
          <Heading>Happy Birthday, {clientName}!</Heading>
          <Text>
            Wishing you a wonderful birthday from everyone at {agencyName}.
            We value you as a client and look forward to continuing to serve your insurance needs.
          </Text>
          <Text style={{ color: '#666', fontSize: '12px' }}>
            This email was sent by {agencyName} via Anchor.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
```

### New Prisma Models
```prisma
// EmailLog -- tracks all outbound client emails
model EmailLog {
  id          String   @id @default(uuid()) @db.Uuid
  tenantId    String   @map("tenant_id") @db.Uuid
  clientId    String?  @map("client_id") @db.Uuid
  recipientEmail String @map("recipient_email")
  type        String   // 'birthday_greeting' | 'renewal_reminder' | 'bulk_announcement' | 'digest'
  subject     String
  status      String   @default("sent") // 'queued' | 'sent' | 'failed'
  errorMessage String? @map("error_message")
  metadata    Json?    // e.g., { policyId, daysBefore, bulkEmailId }
  sentAt      DateTime @default(now()) @map("sent_at")
  sentById    String?  @map("sent_by_id") @db.Uuid // null for automated, userId for bulk

  tenant  Tenant  @relation(fields: [tenantId], references: [id])
  client  Client? @relation(fields: [clientId], references: [id], onDelete: SetNull)
  sentBy  User?   @relation("emailSentBy", fields: [sentById], references: [id])

  @@index([tenantId, sentAt(sort: Desc)])
  @@index([tenantId, type])
  @@index([tenantId, clientId])
  @@map("email_logs")
}

// TenantEmailSettings -- per-tenant email configuration
model TenantEmailSettings {
  id                     String  @id @default(uuid()) @db.Uuid
  tenantId               String  @unique @map("tenant_id") @db.Uuid
  birthdayEmailsEnabled  Boolean @default(true) @map("birthday_emails_enabled")
  renewalReminder60Days  Boolean @default(true) @map("renewal_reminder_60_days")
  renewalReminder30Days  Boolean @default(true) @map("renewal_reminder_30_days")
  renewalReminder7Days   Boolean @default(true) @map("renewal_reminder_7_days")
  createdAt              DateTime @default(now()) @map("created_at")
  updatedAt              DateTime @updatedAt @map("updated_at")

  tenant Tenant @relation(fields: [tenantId], references: [id])

  @@map("tenant_email_settings")
}
```

### Renewal Reminder Email Query
```typescript
// Find policies expiring in exactly N days, with client email
async getPoliciesExpiringInDays(tenantId: string, daysBefore: number) {
  const targetDate = startOfDay(addDays(new Date(), daysBefore));
  const nextDay = startOfDay(addDays(targetDate, 1));

  return this.prisma.policy.findMany({
    where: {
      tenantId,
      status: { in: ['active', 'pending_renewal'] },
      endDate: {
        gte: targetDate,
        lt: nextDay,
      },
    },
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| String template emails | React Email TSX components | Already in codebase | Type-safe, component-reusable email templates |
| Individual API calls per recipient | ZeptoMail batch API `/v1.1/email/batch` | Available now | Up to 500 recipients per call, merge field personalization |
| Prisma standard filters for date parts | `$queryRaw` with `EXTRACT()` | N/A (Prisma limitation) | Only way to match month+day without year in PostgreSQL |

**Deprecated/outdated:**
- None applicable -- the existing stack is current and well-suited for this phase

## Open Questions

Things that couldn't be fully resolved:

1. **ZeptoMail daily sending limits for this account**
   - What we know: ZeptoMail allows configuring per-Agent daily limits; the SM_151 error is returned when exceeded; limits reset at midnight server time
   - What's unclear: What are the default/current limits for this project's ZeptoMail agent? This depends on the plan/account configuration
   - Recommendation: Check the ZeptoMail dashboard for current limits. For an MVP with <500 clients per agency, limits are unlikely to be an issue. Add error handling for SM_151 errors.

2. **Bulk email content restrictions**
   - What we know: ZeptoMail prohibits promotional/marketing emails. It allows transactional/operational emails.
   - What's unclear: Where exactly is the line between "agency announcement" (operational) and "marketing"? Could sending a "Happy holidays from our agency" email be considered promotional?
   - Recommendation: Scope bulk email as service communications only. Add a disclaimer in the UI that bulk emails are for operational announcements, not marketing. If marketing email is needed in the future, integrate Zoho Campaigns or similar.

3. **Birthday email personalization depth**
   - What we know: Basic template with client name and agency name
   - What's unclear: Should the email include policy details, agent contact info, or promotional offers?
   - Recommendation: Keep it simple for MVP -- just a warm greeting with the agency name. Avoid promotional content to stay within ZeptoMail's transactional email policy.

4. **Email unsubscribe mechanism for clients**
   - What we know: Clients are external recipients, not system users. They have no login or settings page.
   - What's unclear: Do we need an unsubscribe link? Canadian Anti-Spam Legislation (CASL) may require one for commercial electronic messages.
   - Recommendation: For MVP, include agency contact info in the footer so clients can request opt-out. A full unsubscribe mechanism (token-based opt-out link) can be added later. Note: birthday greetings and renewal reminders to existing clients with an existing business relationship may fall under CASL's implied consent, but this should be verified.

## Sources

### Primary (HIGH confidence)
- **Existing codebase** -- `notifications.service.ts`, `notifications.scheduler.ts`, `renewals.service.ts`, `renewals.scheduler.ts`, `expenses.scheduler.ts`, `schema.prisma`, `daily-digest.tsx` -- all patterns verified by reading source code directly
- [ZeptoMail email sending API](https://www.zoho.com/zeptomail/help/api/email-sending.html) -- single email endpoint, request/response format
- [ZeptoMail batch email API](https://www.zoho.com/zeptomail/help/api/batch-email-sending.html) -- batch endpoint, 500 recipient max, merge fields
- [ZeptoMail email limits](https://www.zoho.com/zeptomail/help/email-limits.html) -- per-Agent configurable limits, SM_151 error
- [ZeptoMail bulk email policy](https://www.zoho.com/zeptomail/help/sending-bulk-emails.html) -- explicitly prohibits promotional/bulk/marketing emails

### Secondary (MEDIUM confidence)
- [Prisma Discussion #12286](https://github.com/prisma/prisma/discussions/12286) -- birthday query using `EXTRACT()` with `$queryRaw`; confirmed by multiple community members
- [NestJS Task Scheduling docs](https://docs.nestjs.com/techniques/task-scheduling) -- `@Cron` decorator, timezone support, SchedulerRegistry

### Tertiary (LOW confidence)
- Birthday email timezone handling -- based on general JavaScript Date behavior knowledge; should be validated during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new dependencies needed; all libraries already installed and in use
- Architecture: HIGH -- follows exact same patterns as existing cron/email/template code
- Pitfalls: HIGH -- ZeptoMail restrictions verified via official docs; birthday query pattern confirmed via Prisma community; duplicate prevention is a well-known cron pattern
- Data model: MEDIUM -- EmailLog and TenantEmailSettings are new models; schema design follows existing conventions but needs implementation validation

**Research date:** 2026-03-01
**Valid until:** 2026-03-31 (stable domain, no fast-moving dependencies)

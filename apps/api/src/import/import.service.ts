import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { TimelineService } from '../timeline/timeline.service.js';
import { ImportRowDto } from './dto/import-row.dto.js';

/**
 * Lenient mapping from common policy type variations to canonical types.
 * Inlined because API doesn't have @anchor/shared dep.
 */
const IMPORT_POLICY_TYPE_MAP: Record<string, string> = {
  // Auto
  automobile: 'auto',
  car: 'auto',
  vehicle: 'auto',
  motor: 'auto',
  automotive: 'auto',
  'auto insurance': 'auto',
  // Home
  house: 'home',
  homeowners: 'home',
  homeowner: 'home',
  'home insurance': 'home',
  property: 'home',
  dwelling: 'home',
  condo: 'home',
  tenant: 'home',
  renters: 'home',
  renter: 'home',
  // Life
  'life insurance': 'life',
  'term life': 'life',
  'whole life': 'life',
  'universal life': 'life',
  // Health
  'health insurance': 'health',
  medical: 'health',
  dental: 'health',
  disability: 'health',
  benefits: 'health',
  // Commercial
  business: 'commercial',
  'commercial insurance': 'commercial',
  liability: 'commercial',
  'general liability': 'commercial',
  'professional liability': 'commercial',
  // Travel
  'travel insurance': 'travel',
  trip: 'travel',
  // Umbrella
  'umbrella insurance': 'umbrella',
  'excess liability': 'umbrella',
  // Other
  'other insurance': 'other',
};

/** Canonical policy types recognized by the system */
const CANONICAL_TYPES = [
  'auto',
  'home',
  'life',
  'health',
  'commercial',
  'travel',
  'umbrella',
  'other',
];

/**
 * Normalize a string for comparison: lowercase, trim, collapse whitespace.
 */
function normalize(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Create a deduplication key from client fields.
 */
function clientKey(
  firstName: string,
  lastName: string,
  email?: string,
): string {
  const base = normalize(`${firstName} ${lastName}`);
  const emailPart = email ? normalize(email) : '';
  return `${base}|${emailPart}`;
}

/**
 * Resolve a lenient policy type to its canonical form.
 * If unrecognized, returns 'other'.
 */
function resolvePolicyType(rawType: string): {
  type: string;
  customType: string | null;
} {
  const normalized = normalize(rawType);

  // Check if it's already a canonical type
  if (CANONICAL_TYPES.includes(normalized)) {
    return { type: normalized, customType: null };
  }

  // Check the mapping
  const mapped = IMPORT_POLICY_TYPE_MAP[normalized];
  if (mapped) {
    return { type: mapped, customType: null };
  }

  // Unrecognized -- default to 'other' with the original as customType
  return { type: 'other', customType: rawType.trim() };
}

/**
 * Parse a date string in common formats: YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY.
 * Returns a Date or null if parsing fails.
 */
function parseDate(value: string | undefined): Date | null {
  if (!value || value.trim() === '') return null;

  const trimmed = value.trim();

  // ISO format: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;
  }

  // MM/DD/YYYY format
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, m, d, y] = slashMatch;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    if (!isNaN(date.getTime())) return date;
  }

  // DD-MM-YYYY format
  const dashMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dashMatch) {
    const [, d, m, y] = dashMatch;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    if (!isNaN(date.getTime())) return date;
  }

  return null;
}

/**
 * Parse a premium string to a Decimal-compatible number or null.
 */
function parsePremium(value: string | undefined): number | null {
  if (!value || value.trim() === '') return null;
  // Remove currency symbols, commas
  const cleaned = value.replace(/[$,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly timelineService: TimelineService,
  ) {}

  /**
   * Import clients and policies from validated rows.
   * Groups rows by client, deduplicates against existing clients,
   * creates new clients and all policies in a transaction.
   */
  async importClientsAndPolicies(
    tenantId: string,
    userId: string,
    rows: ImportRowDto[],
  ) {
    // Step 1: Group rows by client using normalized key
    const clientGroups = new Map<
      string,
      {
        client: {
          firstName: string;
          lastName: string;
          email?: string;
          phone?: string;
          address?: string;
          city?: string;
          province?: string;
          postalCode?: string;
        };
        policies: { row: ImportRowDto; rowIndex: number }[];
      }
    >();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const key = clientKey(row.firstName, row.lastName, row.email);

      if (!clientGroups.has(key)) {
        clientGroups.set(key, {
          client: {
            firstName: row.firstName.trim(),
            lastName: row.lastName.trim(),
            email: row.email?.trim() || undefined,
            phone: row.phone?.trim() || undefined,
            address: row.address?.trim() || undefined,
            city: row.city?.trim() || undefined,
            province: row.province?.trim() || undefined,
            postalCode: row.postalCode?.trim() || undefined,
          },
          policies: [],
        });
      }

      clientGroups.get(key)!.policies.push({ row, rowIndex: i + 1 });
    }

    // Step 2: Load existing clients for duplicate detection
    const existingClients = await this.prisma.client.findMany({
      where: { tenantId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    const existingMap = new Map<string, { id: string; firstName: string; lastName: string; email: string | null }>();
    for (const ec of existingClients) {
      const key = clientKey(ec.firstName, ec.lastName, ec.email ?? undefined);
      existingMap.set(key, ec);
    }

    // Step 3: Batch create in transaction
    let clientsCreated = 0;
    let policiesCreated = 0;
    let duplicatesSkipped = 0;
    const duplicates: {
      firstName: string;
      lastName: string;
      email?: string;
      existingId: string;
    }[] = [];
    const errors: { row: number; message: string }[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const [key, group] of clientGroups) {
        let clientId: string;

        // Check for existing client
        const existing = existingMap.get(key);

        if (existing) {
          clientId = existing.id;
          duplicatesSkipped++;
          duplicates.push({
            firstName: group.client.firstName,
            lastName: group.client.lastName,
            email: group.client.email,
            existingId: existing.id,
          });
        } else {
          // Create new client
          try {
            const newClient = await tx.client.create({
              data: {
                firstName: group.client.firstName,
                lastName: group.client.lastName,
                email: group.client.email ?? null,
                phone: group.client.phone ?? null,
                address: group.client.address ?? null,
                city: group.client.city ?? null,
                province: group.client.province ?? null,
                postalCode: group.client.postalCode ?? null,
                tenantId,
                createdById: userId,
                status: 'client',
              } as any,
            });
            clientId = newClient.id;
            clientsCreated++;
          } catch (err: any) {
            errors.push({
              row: group.policies[0].rowIndex,
              message: `Failed to create client: ${err.message}`,
            });
            continue;
          }
        }

        // Create policies for this client
        for (const { row, rowIndex } of group.policies) {
          try {
            const { type, customType } = resolvePolicyType(row.policyType);
            const premium = parsePremium(row.premium);
            const startDate = parseDate(row.startDate);
            const endDate = parseDate(row.endDate);

            // Resolve status: default to 'active' if not provided or not recognized
            const validStatuses = [
              'draft',
              'active',
              'pending_renewal',
              'renewed',
              'expired',
              'cancelled',
            ];
            const rawStatus = row.status?.trim().toLowerCase().replace(/\s+/g, '_');
            const status =
              rawStatus && validStatuses.includes(rawStatus)
                ? rawStatus
                : 'active';

            await tx.policy.create({
              data: {
                type: type as any,
                customType,
                carrier: row.carrier?.trim() || null,
                policyNumber: row.policyNumber?.trim() || null,
                premium,
                startDate,
                endDate,
                status: status as any,
                tenantId,
                clientId,
                createdById: userId,
              } as any,
            });
            policiesCreated++;
          } catch (err: any) {
            errors.push({
              row: rowIndex,
              message: `Failed to create policy: ${err.message}`,
            });
          }
        }
      }
    });

    this.logger.log(
      `Import complete for tenant ${tenantId}: ${clientsCreated} clients, ${policiesCreated} policies, ${duplicatesSkipped} duplicates skipped`,
    );

    return {
      clientsCreated,
      policiesCreated,
      duplicatesSkipped,
      duplicates,
      errors,
    };
  }

  /**
   * Generate a CSV template with headers and 2 example rows.
   */
  getTemplate(): string {
    const headers = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'address',
      'city',
      'province',
      'postalCode',
      'policyType',
      'carrier',
      'policyNumber',
      'premium',
      'startDate',
      'endDate',
      'status',
    ];

    const row1 = [
      'Sarah',
      'Thompson',
      'sarah.thompson@email.com',
      '416-555-0123',
      '42 Maple Drive',
      'Toronto',
      'ON',
      'M5V 2T6',
      'auto',
      'Intact Insurance',
      'POL-2024-001',
      '1850.00',
      '2024-06-01',
      '2025-06-01',
      'active',
    ];

    const row2 = [
      'Sarah',
      'Thompson',
      'sarah.thompson@email.com',
      '416-555-0123',
      '42 Maple Drive',
      'Toronto',
      'ON',
      'M5V 2T6',
      'home',
      'Aviva Canada',
      'POL-2024-002',
      '2400.00',
      '2024-03-15',
      '2025-03-15',
      'active',
    ];

    return [
      headers.join(','),
      row1.join(','),
      row2.join(','),
    ].join('\n');
  }
}
